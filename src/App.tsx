import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Search, 
  Filter, 
  MessageSquare, 
  Send, 
  Sparkles,
  User,
  LogOut,
  ArrowLeft,
  Calendar,
  Tag,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { format, isPast, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Types ---
declare global {
  interface Window {
    aistudio?: {
      openSelectKey?: () => Promise<void>;
      hasSelectedApiKey?: () => Promise<boolean>;
    };
  }
}

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Context ---
const AuthContext = createContext<{
  user: any;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  apiStatus: 'checking' | 'ok' | 'error';
  handleOpenKeySelector: () => Promise<void>;
} | null>(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// --- Components ---

const SourceIcon = ({ channel, size = 16 }: { channel: string, size?: number }) => {
  switch (channel) {
    case 'Email': return <Send size={size} className="text-blue-500" />;
    case 'Chat': return <MessageSquare size={size} className="text-emerald-500" />;
    case 'Portal': return <LayoutDashboard size={size} className="text-indigo-500" />;
    case 'Ticketing': return <ClipboardList size={size} className="text-amber-500" />;
    default: return <FileText size={size} className="text-slate-400" />;
  }
};

const SidebarLink = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active?: boolean }) => (
  <Link 
    to={to} 
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
      active 
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
        : "text-slate-600 hover:bg-slate-100"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) => {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
    info: "bg-indigo-100 text-indigo-700",
  };
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold", variants[variant])}>
      {children}
    </span>
  );
};

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden", className)}>
    {children}
  </div>
);

// --- Pages ---

const LoginPage = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password123');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white mb-4 shadow-xl">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">RequestFlow AI</h1>
          <p className="text-slate-500 mt-2 text-lg">Internal Documentation & Tracking</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm border border-rose-100 flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="name@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ChevronRight size={20} />}
            </button>
          </form>
        </Card>
        <p className="text-center mt-6 text-slate-400 text-sm">
          Demo credentials: admin@example.com / password123
        </p>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const { apiStatus } = useAuth();

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setStats(data);
      });
  }, []);

  if (!stats) return <div className="p-8 text-slate-500">Loading dashboard...</div>;

  const statusColors: any = {
    'Draft': '#94a3b8',
    'Reviewed': '#6366f1',
    'Approved': '#10b981',
    'Completed': '#059669'
  };

  const priorityColors: any = {
    'High': '#f43f5e',
    'Medium': '#f59e0b',
    'Low': '#10b981'
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Operations Dashboard</h1>
          <p className="text-slate-500">Real-time overview of internal requests and SLAs</p>
        </div>
        <Link to="/create" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all">
          <PlusCircle size={20} />
          New Request
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-l-4 border-l-indigo-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Open Requests</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.totalOpen}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <ClipboardList size={24} />
            </div>
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-rose-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Overdue</p>
              <h3 className="text-3xl font-bold text-rose-600 mt-1">{stats.overdue}</h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <AlertCircle size={24} />
            </div>
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">On Time</p>
              <h3 className="text-3xl font-bold text-emerald-600 mt-1">{stats.onTime}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Avg. Response</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">1.2d</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={24} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Requests by Status</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.byStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                >
                  {stats.byStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.status] || '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Priority Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byPriority}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="priority" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.byPriority.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={priorityColors[entry.priority] || '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

const RequestRegister = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    type: '',
    overdue: false
  });

  const fetchRequests = () => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.type) params.append('type', filters.type);
    if (filters.overdue) params.append('overdue', 'true');

    fetch(`/api/requests?${params.toString()}`)
      .then(res => res.json())
      .then(data => setRequests(data));
  };

  useEffect(() => {
    fetchRequests();
  }, [filters]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Request Register</h1>
        <div className="flex gap-3">
          <select 
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Approved">Approved / Finalized</option>
            <option value="Completed">Completed</option>
          </select>
          <select 
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={filters.priority}
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <button 
            onClick={() => setFilters({...filters, overdue: !filters.overdue})}
            className={cn(
              "px-4 py-2 rounded-xl border text-sm font-medium transition-all",
              filters.overdue ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-white border-slate-200 text-slate-600"
            )}
          >
            Overdue Only
          </button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Requestor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-indigo-600 font-semibold">{req.request_id}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{req.requestor_name}</span>
                      <span className="text-xs text-slate-500">{req.requestor_email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <SourceIcon channel={req.source_channel} size={14} />
                      <span className="text-sm text-slate-600">{req.request_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={req.priority === 'High' ? 'danger' : req.priority === 'Medium' ? 'warning' : 'success'}>
                      {req.priority}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={req.status === 'Approved' || req.status === 'Completed' ? 'success' : req.status === 'Reviewed' ? 'info' : 'default'}>
                      {req.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className={cn(isPast(parseISO(req.due_date)) && req.status !== 'Completed' ? "text-rose-500" : "text-slate-400")} />
                      <span className={cn("text-sm", isPast(parseISO(req.due_date)) && req.status !== 'Completed' ? "text-rose-600 font-bold" : "text-slate-600")}>
                        {format(parseISO(req.due_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/requests/${req.id}`} className="text-indigo-600 hover:text-indigo-800 font-bold text-sm flex items-center gap-1">
                      Details <ChevronRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No requests found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const CreateRequest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    requestor_name: '',
    requestor_email: '',
    employee_id: '',
    request_type: 'Access',
    source_channel: 'Portal',
    priority: 'Medium',
    raw_description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      navigate(`/requests/${data.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-900 flex items-center gap-2 mb-4 transition-colors">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="text-3xl font-bold text-slate-900">Create New Request</h1>
        <p className="text-slate-500">Capture raw request details for AI processing</p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Requestor Name</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.requestor_name}
                onChange={(e) => setFormData({...formData, requestor_name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Requestor Email</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.requestor_email}
                onChange={(e) => setFormData({...formData, requestor_email: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Employee ID</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.employee_id}
                onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Request Type</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.request_type}
                onChange={(e) => setFormData({...formData, request_type: e.target.value})}
              >
                <option>Access</option>
                <option>Issue</option>
                <option>Information</option>
                <option>Change</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Raw Request Description</label>
            <textarea 
              required
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder="Paste the raw email or chat message here..."
              value={formData.raw_description}
              onChange={(e) => setFormData({...formData, raw_description: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Creating..." : "Create Request"}
            {!loading && <ChevronRight size={20} />}
          </button>
        </form>
      </Card>
    </div>
  );
};

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    ai_summary: '',
    ai_details: '',
    ai_next_action: ''
  });

  const [actionCompleted, setActionCompleted] = useState(false);

  const fetchRequest = () => {
    fetch(`/api/requests/${id}`)
      .then(res => res.json())
      .then(data => {
        setRequest(data);
        setEditData({
          ai_summary: data.ai_summary || '',
          ai_details: data.ai_details || '',
          ai_next_action: data.ai_next_action || ''
        });
      });
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleGenerateAI = async () => {
    setGenerating(true);
    setGenError('');
    try {
      const res = await fetch(`/api/requests/${id}/generate-ai-notes`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate AI notes');
      }
      fetchRequest();
    } catch (err: any) {
      console.error(err);
      setGenError(err.message || 'An unexpected error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAI = async () => {
    try {
      await fetch(`/api/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      setEditing(false);
      fetchRequest();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async () => {
    try {
      await fetch(`/api/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved' })
      });
      fetchRequest();
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async () => {
    try {
      await fetch(`/api/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed' })
      });
      fetchRequest();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: id,
          user_id: user.id,
          content: comment
        })
      });
      setComment('');
      fetchRequest();
    } catch (err) {
      console.error(err);
    }
  };

  if (!request) return <div className="p-8">Loading...</div>;

  const isReadOnly = request.status === 'Approved' || request.status === 'Completed';

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <button onClick={() => navigate('/register')} className="text-slate-500 hover:text-slate-900 flex items-center gap-2 mb-2 transition-colors">
            <ArrowLeft size={16} /> Back to Register
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-slate-900">{request.request_id}</h1>
            <Badge variant={request.status === 'Approved' || request.status === 'Completed' ? 'success' : 'info'}>
              {request.status === 'Approved' ? 'Approved / Finalized' : request.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-slate-500 text-sm">
            <span className="flex items-center gap-1"><User size={14} /> {request.requestor_name}</span>
            <span className="flex items-center gap-1"><Calendar size={14} /> Created {format(parseISO(request.created_at), 'MMM d, yyyy')}</span>
            <span className="flex items-center gap-1"><Clock size={14} /> Due {format(parseISO(request.due_date), 'MMM d, yyyy')}</span>
          </div>
        </div>

        <div className="flex gap-3">
          {request.status === 'Draft' && (
            <button 
              onClick={handleGenerateAI}
              disabled={generating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles size={20} />
              {generating ? "AI Processing..." : "Generate AI Notes"}
            </button>
          )}
          {request.status === 'Reviewed' && (
            <button 
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-100 flex items-center gap-2 transition-all"
            >
              <CheckCircle2 size={20} />
              Finalize Request
            </button>
          )}
          {request.status === 'Approved' && (
            <button 
              onClick={handleComplete}
              className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all"
            >
              <CheckCircle2 size={20} />
              Mark Completed
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* AI Structured Notes */}
          <Card className="relative">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-600" />
                AI Structured Request Notes
              </h3>
              {!isReadOnly && request.ai_summary && (
                <button 
                  onClick={() => editing ? handleSaveAI() : setEditing(true)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-bold"
                >
                  {editing ? "Save Changes" : "Edit Notes"}
                </button>
              )}
            </div>
            <div className="p-8 space-y-8">
              {genError && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle size={18} />
                  {genError}
                </div>
              )}
              {!request.ai_summary ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText size={48} className="mx-auto mb-4 opacity-20" />
                  <p>AI notes have not been generated yet.</p>
                  <button onClick={handleGenerateAI} className="mt-4 text-indigo-600 font-bold hover:underline">Generate now</button>
                </div>
              ) : (
                <>
                  <section>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Request Summary</h4>
                    {editing ? (
                      <input 
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={editData.ai_summary}
                        onChange={(e) => setEditData({...editData, ai_summary: e.target.value})}
                      />
                    ) : (
                      <p className="text-xl font-semibold text-slate-900 leading-relaxed">{request.ai_summary}</p>
                    )}
                  </section>

                  <section>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Context & Details</h4>
                    {editing ? (
                      <textarea 
                        rows={4}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        value={editData.ai_details}
                        onChange={(e) => setEditData({...editData, ai_details: e.target.value})}
                      />
                    ) : (
                      <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-wrap">{request.ai_details}</div>
                    )}
                  </section>

                  <section>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Proposed Next Action</h4>
                    {editing ? (
                      <input 
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={editData.ai_next_action}
                        onChange={(e) => setEditData({...editData, ai_next_action: e.target.value})}
                      />
                    ) : (
                      <div className={cn(
                        "p-4 rounded-xl border flex items-center gap-4 transition-all",
                        actionCompleted ? "bg-emerald-50 border-emerald-100 text-emerald-900 opacity-60" : "bg-indigo-50 border-indigo-100 text-indigo-900"
                      )}>
                        <button 
                          onClick={() => setActionCompleted(!actionCompleted)}
                          className={cn(
                            "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                            actionCompleted ? "bg-emerald-600 border-emerald-600 text-white" : "border-indigo-300 bg-white"
                          )}
                        >
                          {actionCompleted && <CheckCircle2 size={14} />}
                        </button>
                        <span className={cn("font-medium", actionCompleted && "line-through")}>
                          {request.ai_next_action}
                        </span>
                      </div>
                    )}
                  </section>

                  {request.tags && request.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                      {request.tags.map((tag: string) => (
                        <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                          <Tag size={12} /> {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Comments / Follow-up */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 px-2">
              <MessageSquare size={18} className="text-slate-400" />
              Follow-up & Comments
            </h3>
            
            <div className="space-y-4">
              {request.comments?.map((c: any) => (
                <div key={c.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold shrink-0">
                    {c.user_name[0]}
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-900 text-sm">{c.user_name}</span>
                      <span className="text-xs text-slate-400">{format(parseISO(c.created_at), 'MMM d, h:mm a')}</span>
                    </div>
                    <p className="text-slate-600 text-sm">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <Card className="p-4">
              <form onSubmit={handleAddComment} className="flex gap-3">
                <input 
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="Add a comment or follow-up..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition-all"
                >
                  <Send size={20} />
                </button>
              </form>
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          {/* Request Info Sidebar */}
          <Card className="p-6 space-y-6">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-4">Request Information</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Source Channel</p>
                <p className="text-sm font-medium text-slate-900">{request.source_channel}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Priority</p>
                <Badge variant={request.priority === 'High' ? 'danger' : request.priority === 'Medium' ? 'warning' : 'success'}>
                  {request.priority}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Request Type</p>
                <p className="text-sm font-medium text-slate-900">{request.request_type}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Employee ID</p>
                <p className="text-sm font-medium text-slate-900">{request.employee_id || 'N/A'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-4 mb-4">Raw Description</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 whitespace-pre-wrap italic leading-relaxed">
                "{request.raw_description}"
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// --- Layout ---

const MainLayout = () => {
  const { user, logout, apiStatus, handleOpenKeySelector } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col p-6 space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
            <ShieldCheck size={24} />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">RequestFlow</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" active={window.location.pathname === '/'} />
          <SidebarLink to="/register" icon={ClipboardList} label="Request Register" active={window.location.pathname === '/register'} />
          <SidebarLink to="/create" icon={PlusCircle} label="Create Request" active={window.location.pathname === '/create'} />
        </nav>

        <div className="pt-6 border-t border-slate-100">
          <div className="px-4 py-2 mb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              System Status
            </div>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", apiStatus === 'ok' ? "bg-emerald-500" : apiStatus === 'error' ? "bg-rose-500" : "bg-amber-500")} />
              <span className="text-xs font-medium text-slate-600">
                {apiStatus === 'ok' ? "AI Engine Connected" : apiStatus === 'error' ? "API Key Required" : "Checking Connection..."}
              </span>
            </div>
            {apiStatus === 'error' && (
              <button 
                onClick={handleOpenKeySelector}
                className="mt-2 w-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 py-1.5 rounded-lg hover:bg-indigo-100 transition-all"
              >
                Configure API Key
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              {user?.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-medium"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/register" element={<RequestRegister />} />
          <Route path="/create" element={<CreateRequest />} />
          <Route path="/requests/:id" element={<RequestDetails />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

// --- Auth Provider ---

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  const handleOpenKeySelector = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setApiStatus('ok');
    } else {
      alert("Please configure your GEMINI_API_KEY in the Secrets panel.");
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    setLoading(false);

    // Initial API check
    fetch('/api/dashboard')
      .then(res => {
        if (res.ok) setApiStatus('ok');
        else setApiStatus('error');
      })
      .catch(() => setApiStatus('error'));
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    } else {
      throw new Error("Login failed");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout, apiStatus, handleOpenKeySelector }}>
      {children}
    </AuthContext.Provider>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/*" element={user ? <MainLayout /> : <Navigate to="/login" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
