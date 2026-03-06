import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("requests.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT,
    password TEXT,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT UNIQUE,
    requestor_name TEXT,
    requestor_email TEXT,
    employee_id TEXT,
    request_type TEXT,
    source_channel TEXT,
    priority TEXT,
    raw_description TEXT,
    ai_summary TEXT,
    ai_details TEXT,
    ai_next_action TEXT,
    status TEXT DEFAULT 'Draft',
    due_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS request_tags (
    request_id INTEGER,
    tag_id INTEGER,
    FOREIGN KEY(request_id) REFERENCES requests(id),
    FOREIGN KEY(tag_id) REFERENCES tags(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER,
    user_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(request_id) REFERENCES requests(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed a default user if none exists
const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (email, name, password, role) VALUES (?, ?, ?, ?)").run(
    "admin@example.com",
    "Admin User",
    "password123",
    "admin"
  );
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = 3000;

  // --- API Routes ---

  // Auth
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Requests
  app.get("/api/requests", (req, res) => {
    const { status, priority, type, overdue } = req.query;
    let query = "SELECT * FROM requests WHERE 1=1";
    const params: any[] = [];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    if (priority) {
      query += " AND priority = ?";
      params.push(priority);
    }
    if (type) {
      query += " AND request_type = ?";
      params.push(type);
    }
    if (overdue === 'true') {
      query += " AND due_date < date('now') AND status != 'Completed'";
    }

    query += " ORDER BY created_at DESC";
    const requests = db.prepare(query).all(...params);
    res.json(requests);
  });

  app.get("/api/requests/:id", (req, res) => {
    const request = db.prepare("SELECT * FROM requests WHERE id = ?").get(req.params.id);
    if (request) {
      const comments = db.prepare(`
        SELECT c.*, u.name as user_name 
        FROM comments c 
        JOIN users u ON c.user_id = u.id 
        WHERE c.request_id = ? 
        ORDER BY c.created_at ASC
      `).all(req.params.id);
      
      const tags = db.prepare(`
        SELECT t.name 
        FROM tags t 
        JOIN request_tags rt ON t.id = rt.tag_id 
        WHERE rt.request_id = ?
      `).all(req.params.id);

      res.json({ ...request, comments, tags: tags.map((t: any) => t.name) });
    } else {
      res.status(404).json({ error: "Request not found" });
    }
  });

  app.post("/api/requests", (req, res) => {
    const { 
      requestor_name, requestor_email, employee_id, 
      request_type, source_channel, priority, raw_description 
    } = req.body;

    const request_id = `REQ-${Date.now()}`;
    
    // Calculate due date based on Type and Priority
    const now = new Date();
    let baseDays = 5;
    switch(request_type) {
      case 'Access': baseDays = 2; break;
      case 'Issue': baseDays = 3; break;
      case 'Information': baseDays = 5; break;
      case 'Change': baseDays = 7; break;
      default: baseDays = 5;
    }
    
    let daysToAdd = baseDays;
    if (priority === 'High') daysToAdd = Math.max(1, Math.floor(baseDays * 0.5));
    else if (priority === 'Low') daysToAdd = Math.ceil(baseDays * 1.5);
    
    const dueDate = new Date(now);
    dueDate.setDate(now.getDate() + daysToAdd);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const result = db.prepare(`
      INSERT INTO requests (
        request_id, requestor_name, requestor_email, employee_id, 
        request_type, source_channel, priority, raw_description, due_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      request_id, requestor_name, requestor_email, employee_id, 
      request_type, source_channel, priority, raw_description, dueDateStr
    );

    res.json({ id: result.lastInsertRowid, request_id });
  });

  app.put("/api/requests/:id", (req, res) => {
    const { ai_summary, ai_details, ai_next_action, status } = req.body;
    
    // Check if approved
    const current = db.prepare("SELECT status FROM requests WHERE id = ?").get(req.params.id) as any;
    if (current && (current.status === 'Approved' || current.status === 'Completed') && status !== 'Completed') {
        // Only allow status change to completed if approved
        if (current.status === 'Approved' && status === 'Completed') {
             db.prepare("UPDATE requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
               .run(status, req.params.id);
             return res.json({ success: true });
        }
        return res.status(403).json({ error: "Approved requests are read-only" });
    }

    const fields = [];
    const params = [];
    if (ai_summary !== undefined) { fields.push("ai_summary = ?"); params.push(ai_summary); }
    if (ai_details !== undefined) { fields.push("ai_details = ?"); params.push(ai_details); }
    if (ai_next_action !== undefined) { fields.push("ai_next_action = ?"); params.push(ai_next_action); }
    if (status !== undefined) { fields.push("status = ?"); params.push(status); }
    
    if (fields.length > 0) {
      params.push(req.params.id);
      db.prepare(`UPDATE requests SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...params);
    }
    
    res.json({ success: true });
  });

  app.post("/api/requests/:id/generate-ai-notes", async (req, res) => {
    const request = db.prepare("SELECT * FROM requests WHERE id = ?").get(req.params.id) as any;
    if (!request) return res.status(404).json({ error: "Not found" });

    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        console.error("GEMINI_API_KEY is missing or placeholder");
        return res.status(500).json({ 
          error: "API Key is missing. Please use the 'Configure API Key' button in the sidebar or add GEMINI_API_KEY to the Secrets panel." 
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Convert this informal internal request into a professional structured format.
        
        Raw Request: ${request.raw_description}
        Request Type: ${request.request_type}
        
        Return a JSON object with:
        - summary: A concise professional summary
        - details: Structured context and details
        - next_action: Proposed next steps
        - tags: Array of 3-5 relevant short tags`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              details: { type: Type.STRING },
              next_action: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["summary", "details", "next_action", "tags"]
          }
        }
      });

      let text = response.text || "{}";
      // Clean up markdown if present
      if (text.startsWith("```json")) {
        text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      } else if (text.startsWith("```")) {
        text = text.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }

      const result = JSON.parse(text);
      
      // Update request with AI notes
      db.prepare(`
        UPDATE requests 
        SET ai_summary = ?, ai_details = ?, ai_next_action = ?, status = 'Reviewed'
        WHERE id = ?
      `).run(result.summary || "", result.details || "", result.next_action || "", req.params.id);

      // Handle tags
      if (result.tags && Array.isArray(result.tags)) {
        for (const tagName of result.tags) {
          db.prepare("INSERT OR IGNORE INTO tags (name) VALUES (?)").run(tagName);
          const tag = db.prepare("SELECT id FROM tags WHERE name = ?").get(tagName) as any;
          if (tag) {
            db.prepare("INSERT OR IGNORE INTO request_tags (request_id, tag_id) VALUES (?, ?)").run(req.params.id, tag.id);
          }
        }
      }

      res.json(result);
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI notes" });
    }
  });

  app.post("/api/comments", (req, res) => {
    const { request_id, user_id, content } = req.body;
    db.prepare("INSERT INTO comments (request_id, user_id, content) VALUES (?, ?, ?)").run(request_id, user_id, content);
    res.json({ success: true });
  });

  app.get("/api/dashboard", (req, res) => {
    const totalOpen = db.prepare("SELECT count(*) as count FROM requests WHERE status != 'Completed'").get() as any;
    const byStatus = db.prepare("SELECT status, count(*) as count FROM requests GROUP BY status").all();
    const byType = db.prepare("SELECT request_type as type, count(*) as count FROM requests GROUP BY request_type").all();
    const byPriority = db.prepare("SELECT priority, count(*) as count FROM requests GROUP BY priority").all();
    const overdue = db.prepare("SELECT count(*) as count FROM requests WHERE due_date < date('now') AND status != 'Completed'").get() as any;
    const onTime = db.prepare("SELECT count(*) as count FROM requests WHERE due_date >= date('now') AND status != 'Completed'").get() as any;

    res.json({
      totalOpen: totalOpen.count,
      byStatus,
      byType,
      byPriority,
      overdue: overdue.count,
      onTime: onTime.count
    });
  });

  // --- Vite / Static Files ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
