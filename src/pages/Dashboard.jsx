/**
 * Dashboard Page
 * List of submissions with filters and pagination
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSubmissions, getStats } from '../services/submissions';
import Layout from '../components/layout/Layout';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Loader2,
  Target,
  Users,
  Inbox,
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

// 4-status system: processing, sent, rejected, failed
const STATUS_STYLES = {
  processing: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: Clock, label: 'Processing' },
  pending: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: Clock, label: 'Processing' }, // Legacy mapping
  pending_approval: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: Clock, label: 'Processing' }, // Legacy mapping
  sent: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: Mail, label: 'Sent' },
  rejected: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: XCircle, label: 'Rejected' },
  failed: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: AlertTriangle, label: 'Failed' },
};

const CHALLENGE_ICONS = {
  'Persona-Based': { icon: Users, color: 'text-purple-500', bg: 'bg-purple-100' },
  'Active Adventure': { icon: Target, color: 'text-primary-500', bg: 'bg-primary-100' },
  'Creative Collab': { icon: Target, color: 'text-pink-500', bg: 'bg-pink-100' },
  'Foodie Quest': { icon: Target, color: 'text-orange-500', bg: 'bg-orange-100' },
  'Chill Hangout': { icon: Target, color: 'text-teal-500', bg: 'bg-teal-100' },
  'Learning Together': { icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-100' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending_approval: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  
  // Filters from URL params
  const status = searchParams.get('status') || 'all';
  const challengeType = searchParams.get('challengeType') || 'all';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    fetchData();
  }, [status, challengeType, search, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [submissionsData, statsData] = await Promise.all([
        getSubmissions({ status, challengeType, search, page, limit: 10 }),
        getStats()
      ]);
      
      setSubmissions(submissionsData.submissions || []);
      setPagination({
        page: submissionsData.page,
        totalPages: submissionsData.totalPages,
        total: submissionsData.total
      });
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(params);
  };

  const goToPage = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(dateString);
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage and review connection plan emails</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard 
          label="Total Emails" 
          value={stats.total} 
          icon={Inbox}
          gradient="from-slate-500 to-slate-600"
        />
        <StatCard 
          label="Processing" 
          value={stats.processing || 0} 
          icon={Clock}
          gradient="from-amber-500 to-orange-500"
          highlight={(stats.processing || 0) > 0}
        />
        <StatCard 
          label="Sent" 
          value={stats.sent} 
          icon={Mail}
          gradient="from-emerald-500 to-teal-500"
        />
        <StatCard 
          label="Failed" 
          value={stats.failed || 0} 
          icon={AlertTriangle}
          gradient="from-orange-500 to-red-400"
          highlight={(stats.failed || 0) > 0}
        />
        <StatCard 
          label="Rejected" 
          value={stats.rejected} 
          icon={XCircle}
          gradient="from-red-500 to-pink-500"
        />
      </div>

      {/* Filters */}
      <div className="card p-5 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Filter className="w-4 h-4" />
              <span>Filters:</span>
            </div>
            <select
              value={status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="input py-2.5 px-4 w-auto min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="processing">⏳ Processing</option>
              <option value="sent">📧 Sent</option>
              <option value="rejected">❌ Rejected</option>
              <option value="failed">⚠️ Failed</option>
            </select>
          </div>

          {/* Challenge Type Filter */}
          <div>
            <select
              value={challengeType}
              onChange={(e) => updateFilter('challengeType', e.target.value)}
              className="input py-2.5 px-4 w-auto min-w-[180px]"
            >
              <option value="all">All Types</option>
              <option value="Persona-Based">👥 Persona-Based</option>
              <option value="Social Recommendation">🎯 Social Recommendation</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Search by recipient email..."
                className="input-icon py-2.5"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">
            Submissions
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({pagination.total} total)
            </span>
          </h2>
          {loading && <Loader2 className="w-5 h-5 animate-spin text-primary-500" />}
        </div>

        {loading && submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-4" />
            <p className="text-gray-500">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No submissions found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your filters or wait for new submissions</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {submissions.map((submission) => (
              <SubmissionCard 
                key={submission.id} 
                submission={submission} 
                onClick={() => navigate(`/email/${submission.id}`)}
                timeAgo={timeAgo}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-sm text-gray-600">
              Page <span className="font-semibold">{pagination.page}</span> of <span className="font-semibold">{pagination.totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ label, value, icon: Icon, gradient, highlight }) {
  return (
    <div className={`card p-5 relative overflow-hidden ${highlight ? 'ring-2 ring-amber-300 ring-offset-2' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">{label}</p>
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {highlight && (
        <div className="absolute -bottom-1 -right-1 w-24 h-24 bg-amber-200/20 rounded-full blur-2xl"></div>
      )}
    </div>
  );
}

function SubmissionCard({ submission, onClick, timeAgo, formatDate }) {
  const statusStyle = STATUS_STYLES[submission.status] || STATUS_STYLES.pending;
  const StatusIcon = statusStyle.icon;
  
  // Determine challenge type from planning_mode and social_goal
  const challengeType = submission.planning_mode === 'personas' 
    ? 'Persona-Based' 
    : submission.social_goal || 'Unknown Type';
  
  const challengeConfig = CHALLENGE_ICONS[challengeType] || CHALLENGE_ICONS['Active Adventure'];
  const ChallengeIcon = challengeConfig.icon;

  return (
    <div 
      onClick={onClick}
      className="p-5 hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-transparent cursor-pointer transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 flex-1 min-w-0">
          {/* Icon */}
          <div className={`w-12 h-12 ${challengeConfig.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <ChallengeIcon className={`w-6 h-6 ${challengeConfig.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-semibold text-gray-900">
                {challengeType}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {statusStyle.label}
              </span>
            </div>

            {/* Subject */}
            <h3 className="text-base font-medium text-gray-800 mb-3 truncate group-hover:text-primary-600 transition-colors">
              {submission.subject || 'No subject'}
            </h3>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-gray-400" />
                {submission.user_email || 'No email'}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" />
                {(submission.user_location_formatted || submission.user_location || submission.location || 'No location').split(',')[0]}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                {formatDate(submission.preferred_date)}
              </span>
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-gray-400" />
                {submission.budget?.split(' ')[0] || 'N/A'}
              </span>
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
              <span>Created {timeAgo(submission.created_at)}</span>
              {submission.admins?.name && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {submission.admins.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center gap-2 text-gray-400 group-hover:text-primary-500 transition-colors">
          <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">View</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
