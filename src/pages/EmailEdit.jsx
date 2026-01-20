/**
 * Email Edit Page
 * View and edit submission details with modern styling
 * Updated: Auto-save, validation, and 4-status system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmission, updateSubmission, approveSubmission, rejectSubmission } from '../services/submissions';
import Layout from '../components/layout/Layout';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Target,
  Users,
  Clock,
  Star,
  Link as LinkIcon,
  AlertCircle,
  FileText,
  MessageSquare,
  Sparkles,
  Send,
  Eye,
  User,
  X,
  ExternalLink,
  Check
} from 'lucide-react';

const STATUS_CONFIG = {
  processing: { 
    bg: 'bg-blue-50', 
    border: 'border-blue-200', 
    text: 'text-blue-700',
    icon: Loader2,
    label: 'Processing'
  },
  pending_approval: { 
    bg: 'bg-amber-50', 
    border: 'border-amber-200', 
    text: 'text-amber-700',
    icon: Clock,
    label: 'Pending Approval'
  },
  sent: { 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-200', 
    text: 'text-emerald-700',
    icon: Mail,
    label: 'Sent'
  },
  rejected: { 
    bg: 'bg-red-50', 
    border: 'border-red-200', 
    text: 'text-red-700',
    icon: XCircle,
    label: 'Rejected'
  },
  failed: { 
    bg: 'bg-gray-50', 
    border: 'border-gray-200', 
    text: 'text-gray-700',
    icon: AlertCircle,
    label: 'Failed'
  },
};

const CHALLENGE_ICONS = {
  'Persona-Based': { icon: Users, color: 'text-purple-500', bg: 'bg-purple-100' },
  'Active Adventure': { icon: Target, color: 'text-primary-500', bg: 'bg-primary-100' },
  'Discovery & Culture': { icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-100' },
  'Creative Collab': { icon: Sparkles, color: 'text-pink-500', bg: 'bg-pink-100' },
  'Foodie Quest': { icon: Target, color: 'text-orange-500', bg: 'bg-orange-100' },
  'Chill Hangout': { icon: Target, color: 'text-teal-500', bg: 'bg-teal-100' },
  'Learning Together': { icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-100' },
};

export default function EmailEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Editable fields
  const [subject, setSubject] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [personaBridge, setPersonaBridge] = useState('');
  const [invitationScript, setInvitationScript] = useState('');
  const [activities, setActivities] = useState([]);
  
  // Auto-save state
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialLoadRef = useRef(true);
  const autoSaveTimeoutRef = useRef(null);
  
  // Preview modal
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const fetchSubmission = async () => {
    setLoading(true);
    try {
      const data = await getSubmission(id);
      console.log('Fetched submission:', data);
      setSubmission(data);
      
      // Set editable fields
      setSubject(data.subject || '');
      // Use user_email (new schema)
      setRecipientEmail(data.user_email || '');
      setPersonaBridge(data.persona_bridge || '');
      setInvitationScript(data.invitation_script || '');
      
      // Ensure activities is an array
      let activitiesArray = [];
      if (Array.isArray(data.activities)) {
        activitiesArray = data.activities;
      } else if (typeof data.activities === 'string') {
        console.error('Activities is a string, expected array:', data.activities);
        setError('Invalid activities format - backend returned string instead of array');
      } else if (data.activities) {
        console.error('Activities is not an array:', typeof data.activities, data.activities);
      }
      console.log('Activities array:', activitiesArray);
      setActivities(activitiesArray);
      
      // Mark initial load complete after a brief delay
      setTimeout(() => {
        initialLoadRef.current = false;
      }, 500);
    } catch (err) {
      setError('Failed to load submission: ' + (err.message || 'Unknown error'));
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-save effect: triggers 2 seconds after any change
  useEffect(() => {
    // Skip during initial load
    if (initialLoadRef.current || !submission) return;
    
    // Skip if not in editable state
    const isPendingStatus = ['processing', 'pending', 'pending_approval'].includes(submission.status);
    if (!isPendingStatus) return;
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
    
    // Clear any existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save (2 seconds after last change)
    autoSaveTimeoutRef.current = setTimeout(async () => {
      await performAutoSave();
    }, 2000);
    
    // Cleanup
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [subject, recipientEmail, personaBridge, invitationScript, activities]);

  // Auto-save function
  const performAutoSave = async () => {
    setAutoSaving(true);
    try {
      await updateSubmission(id, {
        subject,
        user_email: recipientEmail,
        persona_bridge: personaBridge,
        invitation_script: invitationScript,
        activities
      });
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      console.log('✓ Auto-saved');
    } catch (err) {
      console.error('Auto-save failed:', err);
      // Don't show error for auto-save failures, just log it
    } finally {
      setAutoSaving(false);
    }
  };

  // Manual save handler (still available but less prominent)
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await updateSubmission(id, {
        subject,
        user_email: recipientEmail,
        persona_bridge: personaBridge,
        invitation_script: invitationScript,
        activities
      });
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setSuccess('Changes saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Improved approve handler with validation and auto-save before send
  const handleApprove = async () => {
    // Frontend validation first
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setError('Please enter a valid recipient email address');
      return;
    }
    if (!subject || subject.trim() === '') {
      setError('Please enter an email subject');
      return;
    }
    if (!invitationScript || invitationScript.trim() === '') {
      setError('Please enter an invitation script');
      return;
    }
    if (!activities || activities.length === 0) {
      setError('At least one activity is required');
      return;
    }
    
    if (!confirm(`Approve and send this email to ${recipientEmail}?`)) return;
    
    setApproving(true);
    setError('');
    
    try {
      // Step 1: Force save any pending changes
      setSuccess('Saving changes...');
      await updateSubmission(id, {
        subject,
        user_email: recipientEmail,
        persona_bridge: personaBridge,
        invitation_script: invitationScript,
        activities
      });
      
      // Step 2: Wait for save to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 3: Approve and send
      setSuccess('Sending email...');
      await approveSubmission(id);
      
      setSuccess(`✓ Email sent to ${recipientEmail}!`);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Reject this email?')) return;
    
    setRejecting(true);
    setError('');
    
    try {
      await rejectSubmission(id);
      setSuccess('Email rejected');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject');
    } finally {
      setRejecting(false);
    }
  };

  const updateActivity = (index, field, value) => {
    const newActivities = [...activities];
    newActivities[index] = { ...newActivities[index], [field]: value };
    setActivities(newActivities);
  };

  function formatDateLocal(dateStr) {
    if (!dateStr) return '';
    
    // Parse date components from ISO string (YYYY-MM-DD)
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Create date in local timezone
    const date = new Date(year, month - 1, day);
    
    // Format without timezone conversion
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-3" />
          <p className="text-gray-500">Loading submission...</p>
        </div>
      </Layout>
    );
  }

  if (!submission) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Submission Not Found</h2>
          <p className="text-gray-500 mb-6">The submission you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  // Derive challenge type from planning_mode and social_goal (matching Dashboard logic)
  const challengeType = submission.planning_mode === 'personas' 
    ? 'Persona-Based' 
    : submission.social_goal || submission.challenge_type || 'Unknown Type';
  const isPersonaBased = challengeType === 'Persona-Based';
  const isPending = ['pending', 'pending_approval', 'processing'].includes(submission.status);
  const statusConfig = STATUS_CONFIG[submission.status] || STATUS_CONFIG.processing;
  const StatusIcon = statusConfig.icon;

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Email</h1>
            <p className="text-sm text-gray-500">Submission #{id}</p>
          </div>
        </div>
        
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
          <StatusIcon className="w-4 h-4" />
          <span className="text-sm font-semibold">{statusConfig.label}</span>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-4 rounded-xl mb-6">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800">Email Subject</label>
                <p className="text-xs text-gray-500">The subject line recipients will see</p>
              </div>
            </div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={!isPending}
              className="input"
              placeholder="Enter email subject..."
            />
          </div>

          {/* Recipient Email */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-secondary-100 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-secondary-600" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800">Recipient Email</label>
                <p className="text-xs text-gray-500">Where the email will be sent</p>
              </div>
            </div>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              disabled={!isPending}
              className="input"
              placeholder="recipient@example.com"
            />
          </div>

          {/* Persona Bridge */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800">Persona Bridge</label>
                <p className="text-xs text-gray-500">Connection message between personas</p>
              </div>
            </div>
            <textarea
              value={personaBridge}
              onChange={(e) => setPersonaBridge(e.target.value)}
              disabled={!isPending}
              rows={4}
              className="input resize-none"
              placeholder="Enter persona bridge text..."
            />
          </div>

          {/* Activities */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Activities</h3>
                  <p className="text-xs text-gray-500">{activities.length} activities planned</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-gray-800">{activity.name || `Activity ${index + 1}`}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Name</label>
                      <input
                        type="text"
                        value={activity.name || ''}
                        onChange={(e) => updateActivity(index, 'name', e.target.value)}
                        disabled={!isPending}
                        className="input py-2.5"
                        placeholder="Activity name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Rating</label>
                      <div className="relative">
                        <Star className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
                        <input
                          type="text"
                          value={activity.rating || ''}
                          onChange={(e) => updateActivity(index, 'rating', e.target.value)}
                          disabled={!isPending}
                          className="input-icon py-2.5"
                          placeholder="4.5"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Hours</label>
                      <div className="relative">
                        <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={activity.hours || ''}
                          onChange={(e) => updateActivity(index, 'hours', e.target.value)}
                          disabled={!isPending}
                          className="input-icon py-2.5"
                          placeholder="2-3 hours"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={activity.address || ''}
                          onChange={(e) => updateActivity(index, 'address', e.target.value)}
                          disabled={!isPending}
                          className="input-icon py-2.5"
                          placeholder="123 Main St"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Google Maps Link</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          value={activity.link || ''}
                          onChange={(e) => updateActivity(index, 'link', e.target.value)}
                          disabled={!isPending}
                          className="input-icon py-2.5"
                          placeholder="https://maps.google.com/..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {activities.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Target className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No activities in this plan</p>
                </div>
              )}
            </div>
          </div>

          {/* Invitation Script */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800">Invitation Script</label>
                <p className="text-xs text-gray-500">Personalized message for the recipient</p>
              </div>
            </div>
            <textarea
              value={invitationScript}
              onChange={(e) => setInvitationScript(e.target.value)}
              disabled={!isPending}
              rows={6}
              className="input resize-none font-mono text-sm"
              placeholder="Enter invitation script..."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              Form Details
            </h3>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isPersonaBased ? 'bg-purple-100' : 'bg-primary-100'}`}>
                  {isPersonaBased ? (
                    <Users className="w-4 h-4 text-purple-600" />
                  ) : (
                    <Target className="w-4 h-4 text-primary-600" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Challenge Type</p>
                  <p className="text-sm font-semibold text-gray-900">{challengeType}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {submission.user_location_formatted || submission.user_location || submission.location || 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Preferred Date</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDateLocal(submission.preferred_date)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Budget</p>
                  <p className="text-sm font-semibold text-gray-900">{submission.budget || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {isPending && (
            <div className="card p-6 space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Actions</h3>
                {/* Auto-save status indicator */}
                <div className="text-xs">
                  {autoSaving ? (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Saving...
                    </span>
                  ) : hasUnsavedChanges ? (
                    <span className="text-amber-500">Unsaved changes</span>
                  ) : lastSaved ? (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <Check className="w-3 h-3" />
                      Saved {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  ) : null}
                </div>
              </div>
              
              {/* Manual save - now secondary action */}
              {hasUnsavedChanges && (
                <button
                  onClick={handleSave}
                  disabled={saving || autoSaving}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 transition-all text-sm"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Now
                </button>
              )}
              
              <button
                onClick={handleApprove}
                disabled={approving || autoSaving}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/25"
              >
                {approving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Approve & Send
              </button>
              
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 py-3 px-4 rounded-xl font-semibold hover:bg-red-100 disabled:opacity-50 transition-all"
              >
                {rejecting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                Reject
              </button>
            </div>
          )}

          {/* Approval Info */}
          {submission.status !== 'pending' && submission.admins?.name && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${submission.status === 'sent' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  {submission.status === 'sent' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    {submission.status === 'sent' ? 'Approved' : 'Rejected'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {submission.approved_at || submission.updated_at 
                      ? new Date(submission.approved_at || submission.updated_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {submission.admins.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{submission.admins.name}</p>
                  <p className="text-xs text-gray-500">{submission.admins.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Email Preview Link */}
          <div className="card p-6">
            <button 
              onClick={() => setShowPreview(true)}
              className="w-full flex items-center justify-center gap-2 text-primary-600 py-3 px-4 rounded-xl font-semibold border border-primary-200 bg-primary-50 hover:bg-primary-100 transition-all"
            >
              <Eye className="w-5 h-5" />
              Preview Email
            </button>
          </div>
        </div>
      </div>

      {/* Email Preview Modal */}
      {showPreview && (
        <EmailPreviewModal
          submission={submission}
          subject={subject}
          recipientEmail={recipientEmail}
          personaBridge={personaBridge}
          invitationScript={invitationScript}
          activities={activities}
          onClose={() => setShowPreview(false)}
        />
      )}
    </Layout>
  );
}

/**
 * Email Preview Modal Component
 */
function EmailPreviewModal({ submission, subject, recipientEmail, personaBridge, invitationScript, activities, onClose }) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  function formatDateLocal(dateStr) {
    if (!dateStr) return '';
    
    // Parse date components from ISO string (YYYY-MM-DD)
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Create date in local timezone
    const date = new Date(year, month - 1, day);
    
    // Format without timezone conversion
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-500 to-secondary-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Email Preview</h2>
              <p className="text-sm text-white/80">This is how the email will appear</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Metadata */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">To:</span>
              <span className="ml-2 font-medium text-gray-800">{recipientEmail || 'No recipient'}</span>
            </div>
            <div>
              <span className="text-gray-500">Subject:</span>
              <span className="ml-2 font-medium text-gray-800">{subject || 'No subject'}</span>
            </div>
          </div>
        </div>

        {/* Email Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-gray-50 rounded-xl p-6" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            {/* Header */}
            <div className="border-b-4 pb-5 mb-6" style={{ borderColor: '#2433A7' }}>
              <h1 className="text-2xl font-semibold mb-2" style={{ color: '#2433A7' }}>
                Your Connection Plan is Ready! ✨
              </h1>
              <p className="text-gray-500 text-sm">Personalized activities curated just for you</p>
            </div>

            {/* Info Table */}
            <div className="mb-6 rounded-lg overflow-hidden border-l-4" style={{ borderColor: '#2433A7', backgroundColor: '#F9FAFB' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#2433A7' }}>
                    <th className="text-left text-white text-xs font-semibold uppercase tracking-wider py-3 px-4">Detail</th>
                    <th className="text-left text-white text-xs font-semibold uppercase tracking-wider py-3 px-4">Information</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-4 text-gray-600">Challenge Type</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{submission?.planning_mode === 'personas' ? 'Persona-Based' : submission?.social_goal || submission?.challenge_type || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-4 text-gray-600">Location</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{submission?.location || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-4 text-gray-600">Date</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{formatDateLocal(submission?.preferred_date)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-600">Budget</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{submission?.budget || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Persona Bridge */}
            {personaBridge && (
              <div className="mb-6 p-5 rounded-lg border-l-4" style={{ borderColor: '#2433A7', backgroundColor: '#F9FAFB' }}>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#2433A7' }}>
                  🌉 Connection Bridge
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{personaBridge}</p>
              </div>
            )}

            {/* Activities */}
            {activities && activities.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#2433A7' }}>
                  📍 Suggested Activities
                </h3>
                <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(155, 179, 229, 0.5)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: '#2433A7' }}>
                        <th className="text-left text-white text-xs font-semibold uppercase tracking-wider py-3 px-4">Activity</th>
                        <th className="text-left text-white text-xs font-semibold uppercase tracking-wider py-3 px-4">Details</th>
                        <th className="text-left text-white text-xs font-semibold uppercase tracking-wider py-3 px-4">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((activity, index) => (
                        <tr key={index} className="border-b border-gray-200 last:border-b-0">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-800">{activity.name || `Activity ${index + 1}`}</div>
                            {activity.link && (
                              <a 
                                href={activity.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs flex items-center gap-1 mt-1"
                                style={{ color: '#527AD3' }}
                              >
                                <ExternalLink className="w-3 h-3" />
                                View on Maps
                              </a>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            <div>{activity.address || 'No address'}</div>
                            {activity.hours && <div className="text-xs text-gray-400 mt-1">⏰ {activity.hours}</div>}
                          </td>
                          <td className="py-3 px-4">
                            {activity.rating && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                                ⭐ {activity.rating}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Invitation Script */}
            {invitationScript && (
              <div className="mb-6 p-5 rounded-lg border-l-4" style={{ borderColor: '#2433A7', backgroundColor: '#F9FAFB' }}>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#2433A7' }}>
                  💬 Invitation Script
                </h3>
                <div className="bg-white p-4 rounded-lg border border-gray-200 italic text-gray-700 whitespace-pre-wrap">
                  "{invitationScript}"
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-500 text-sm">Generated by Stratstone Concierge</p>
              <p className="text-xs text-gray-400 mt-1">This email was crafted with AI assistance</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
