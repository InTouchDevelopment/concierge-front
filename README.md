# Frontend Documentation

## Overview
React + Vite admin dashboard for reviewing and editing AI-generated connection plans before sending emails to users.

---

## Data Flow Architecture

### 1. **Authentication Flow** (`AuthContext.jsx`)

#### **Login Process:**
```
Login Page → POST /api/auth/login → Receive JWT token → Store in localStorage → Set AuthContext → Redirect to Dashboard
```

**State Management:**
```javascript
AuthContext provides:
- admin: { id, name, email } | null
- token: string | null
- login(email, password) → Authenticates and stores token
- logout() → Clears token and redirects to login
```

**Protected Routes:**
```javascript
<ProtectedRoute> wrapper checks:
  if (!admin || !token) → Redirect to /login
  else → Render children components
```

**Persistence:**
- Token stored in `localStorage.getItem('token')`
- On app load → Check for token → Auto-login if valid
- On logout → Clear localStorage → Redirect to login

---

### 2. **API Communication** (`services/`)

#### **API Client Setup** (`api.js`)
```javascript
// Axios instance with base URL and interceptors
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000'
});

// Request interceptor: Attach JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: Handle 401 errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token'); // Clear invalid token
      window.location.href = '/login'; // Force re-login
    }
    return Promise.reject(error);
  }
);
```

#### **Submission API** (`submissions.js`)
**Functions:**
- `getSubmissions({ status, challengeType, search, page })` → GET `/api/admin/submissions`
- `getSubmission(id)` → GET `/api/admin/submissions/:id`
- `updateSubmission(id, data)` → PATCH `/api/admin/submissions/:id`
- `approveSubmission(id)` → POST `/api/admin/submissions/:id/approve`
- `rejectSubmission(id)` → POST `/api/admin/submissions/:id/reject`
- `getStats()` → GET `/api/admin/submissions/stats`

**Auto-Retry Logic:**
```javascript
// If 401 error → Interceptor clears token and redirects
// Other errors → Return to component for handling
```

---

### 3. **Dashboard Page** (`Dashboard.jsx`)

#### **Data Fetching Flow:**
```
Component Mount → fetchData()
  ↓
Parallel API calls:
  - getSubmissions({ status, challengeType, search, page })
  - getStats()
  ↓
Update state:
  - submissions: array
  - stats: { total, processing, sent, rejected, failed }
  - pagination: { page, totalPages, total }
```

#### **Filter System:**

**Status Filter:**
```javascript
if (status === 'all') → Fetch all submissions
if (status === 'processing') → Backend includes ['processing', 'pending', 'pending_approval']
if (status === 'sent') → Exact match 'sent'
if (status === 'rejected') → Exact match 'rejected'
if (status === 'failed') → Exact match 'failed'
```

**Challenge Type Filter:**
```javascript
if (challengeType === 'all') → Fetch all types
if (challengeType === 'Persona-Based') → Backend filters: planning_mode = 'personas'
else → Backend filters: planning_mode = 'social_challenge' AND social_goal = challengeType
```

**Search Filter:**
- Searches both `user_email` and `recipient_email`
- Case-insensitive partial match
- Handled by backend

**Filter State Management:**
```javascript
// URL params drive filter state
const status = searchParams.get('status') || 'all';
const challengeType = searchParams.get('challengeType') || 'all';

// Update filters → Update URL → Trigger re-fetch
const updateFilter = (key, value) => {
  const params = new URLSearchParams(searchParams);
  params.set(key, value);
  params.set('page', '1'); // Reset to page 1
  setSearchParams(params);
};

// useEffect watches URL params → Calls fetchData()
```

#### **Stats Cards:**
```javascript
// 5 cards displayed:
1. Total Emails (all submissions)
2. Processing (awaiting review) - highlights if > 0
3. Sent (successfully delivered)
4. Failed (errors during send) - highlights if > 0
5. Rejected (manually rejected)
```

#### **Submission Card Display:**
```javascript
// Determines challenge type from data:
const challengeType = submission.planning_mode === 'personas' 
  ? 'Persona-Based' 
  : submission.social_goal || 'Unknown Type';

// Shows:
- Challenge type badge (with icon)
- Status badge (with icon and color)
- Subject line (or "No subject")
- Recipient email
- Time ago (relative time)
```

---

### 4. **Email Edit Page** (`EmailEdit.jsx`)

#### **Data Flow:**
```
Component Mount → fetchSubmission()
  ↓
GET /api/admin/submissions/:id
  ↓
Set local state for editable fields:
  - subject
  - recipientEmail
  - personaBridge
  - invitationScript
  - activities (array)
  ↓
Mark initialLoadRef = false after 500ms
  ↓
Enable auto-save system
```

#### **Auto-Save System:**

**State Management:**
```javascript
const [autoSaving, setAutoSaving] = useState(false);
const [lastSaved, setLastSaved] = useState(null);
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
const initialLoadRef = useRef(true);
const autoSaveTimeoutRef = useRef(null);
```

**Auto-Save Logic:**
```javascript
useEffect(() => {
  // Skip conditions:
  if (initialLoadRef.current) return; // Don't save on initial load
  if (!submission) return; // No data yet
  
  const isPendingStatus = ['processing', 'pending', 'pending_approval'].includes(submission.status);
  if (!isPendingStatus) return; // Don't auto-save sent/rejected/failed
  
  // Mark as unsaved
  setHasUnsavedChanges(true);
  
  // Clear existing timeout
  if (autoSaveTimeoutRef.current) {
    clearTimeout(autoSaveTimeoutRef.current);
  }
  
  // Set 2-second debounce
  autoSaveTimeoutRef.current = setTimeout(async () => {
    await performAutoSave();
  }, 2000);
  
  // Cleanup on unmount
  return () => clearTimeout(autoSaveTimeoutRef.current);
}, [subject, recipientEmail, personaBridge, invitationScript, activities]);
```

**Auto-Save Function:**
```javascript
const performAutoSave = async () => {
  setAutoSaving(true);
  try {
    await updateSubmission(id, {
      subject,
      recipient_email: recipientEmail,
      persona_bridge: personaBridge,
      invitation_script: invitationScript,
      activities
    });
    // Backend regenerates HTML automatically
    setLastSaved(new Date());
    setHasUnsavedChanges(false);
  } catch (err) {
    console.error('Auto-save failed:', err);
    // Don't show error - just log it
  } finally {
    setAutoSaving(false);
  }
};
```

**Why 2-Second Debounce?**
- Prevents excessive API calls while typing
- Balances responsiveness with server load
- User sees "Saving..." indicator briefly

**Status Indicator:**
```javascript
{autoSaving ? (
  <span>Saving...</span> // Shows spinner
) : hasUnsavedChanges ? (
  <span>Unsaved changes</span> // Amber text
) : lastSaved ? (
  <span>Saved {lastSaved.toLocaleTimeString()}</span> // Green checkmark
) : null}
```

#### **Manual Save:**
```javascript
// "Save Now" button only shows when hasUnsavedChanges = true
const handleSave = async () => {
  // Same as auto-save but shows success message
  await updateSubmission(id, { ... });
  setSuccess('Changes saved successfully');
};
```

#### **Approve & Send Flow:**

**Frontend Validation:**
```javascript
const handleApprove = async () => {
  // Validate before sending
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
  
  // Confirm with admin
  if (!confirm(`Approve and send this email to ${recipientEmail}?`)) return;
  
  setApproving(true);
  
  try {
    // Step 1: Force save any pending changes
    setSuccess('Saving changes...');
    await updateSubmission(id, { ... });
    
    // Step 2: Brief delay to ensure save completes
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 3: Approve and send
    setSuccess('Sending email...');
    await approveSubmission(id);
    
    // Step 4: Success feedback and redirect
    setSuccess(`✓ Email sent to ${recipientEmail}!`);
    setTimeout(() => navigate('/dashboard'), 2000);
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to approve');
  } finally {
    setApproving(false);
  }
};
```

**Backend Validation (Redundant Safety):**
- Backend re-validates all fields in approve endpoint
- Regenerates HTML if missing
- Returns detailed error if validation fails
- Updates status to 'failed' if email send fails

#### **Reject Flow:**
```javascript
const handleReject = async () => {
  if (!confirm('Are you sure you want to reject this submission?')) return;
  
  setRejecting(true);
  try {
    await rejectSubmission(id);
    setSuccess('Submission rejected');
    setTimeout(() => navigate('/dashboard'), 2000);
  } catch (err) {
    setError('Failed to reject');
  } finally {
    setRejecting(false);
  }
};
```

#### **Editable Fields:**
- **Subject** - Text input
- **Recipient Email** - Text input (critical: determines who receives email)
- **Persona Bridge** - Textarea (only shown for persona-based)
- **Invitation Script** - Textarea
- **Activities** - Array of objects (read-only display, future feature: inline editing)

#### **Status-Based UI:**
```javascript
const isPending = ['pending', 'pending_approval', 'processing'].includes(submission.status);

// Conditional rendering:
if (isPending) {
  → Show editable fields
  → Show "Save Now" button (if unsaved changes)
  → Show "Approve & Send" button
  → Show "Reject" button
  → Enable auto-save
} else {
  → Disable all fields
  → Hide action buttons
  → Show approval info (who approved/rejected and when)
}
```

#### **Email Preview:**
Shows formatted HTML preview of the email that will be sent:
- Gradient header
- Persona bridge (if applicable)
- Activities table with ratings, hours, addresses
- Invitation script in callout box
- Stratstone footer

---

## Component Hierarchy

```
App.jsx
├── AuthContext.Provider
│   ├── <Router>
│   │   ├── / → Redirect to /dashboard
│   │   ├── /login → Login.jsx
│   │   ├── /register → Register.jsx
│   │   └── <ProtectedRoute>
│   │       ├── /dashboard → Dashboard.jsx
│   │       │   └── <Layout>
│   │       │       ├── <Header />
│   │       │       ├── StatCard (×5)
│   │       │       ├── Filters (status, challenge type, search)
│   │       │       └── SubmissionCard (×N) → Click → Navigate to /email/:id
│   │       └── /email/:id → EmailEdit.jsx
│   │           └── <Layout>
│   │               ├── <Header />
│   │               ├── Editable fields
│   │               ├── Auto-save indicator
│   │               ├── Action buttons (Save, Approve, Reject)
│   │               └── Email preview
```

---

## Styling & UI

### **Tailwind CSS Configuration:**
- Custom color palette (primary: blue, secondary: purple)
- Gradient backgrounds for visual hierarchy
- Responsive grid layouts (mobile-first)
- Hover states for interactivity

### **Design Patterns:**
- **Cards**: Elevated surfaces with rounded corners and shadows
- **Badges**: Status and challenge type indicators with icons
- **Buttons**: Gradient backgrounds for primary actions, outline for secondary
- **Loading States**: Spinner animations during API calls
- **Empty States**: Friendly messages when no data

### **Icons:** Lucide React
- Semantic icons for status (Clock, Mail, XCircle, AlertTriangle)
- Challenge type icons (Users, Target, etc.)
- Action icons (Send, Save, ArrowLeft, etc.)

---

## Conditional Rendering Patterns

### **Challenge Type Display:**
```javascript
// Determines display based on data structure
const challengeType = submission.planning_mode === 'personas' 
  ? 'Persona-Based' 
  : submission.social_goal || 'Unknown Type';
```

### **Status Badge:**
```javascript
// 4-status system with legacy support
const STATUS_CONFIG = {
  processing: { icon: Clock, label: 'Processing', color: 'amber' },
  pending: { icon: Clock, label: 'Processing', color: 'amber' }, // Legacy
  pending_approval: { icon: Clock, label: 'Processing', color: 'amber' }, // Legacy
  sent: { icon: Mail, label: 'Sent', color: 'emerald' },
  rejected: { icon: XCircle, label: 'Rejected', color: 'red' },
  failed: { icon: AlertTriangle, label: 'Failed', color: 'orange' }
};
```

### **Persona Bridge Display:**
```javascript
// Only show for persona-based plans
{submission.planning_mode === 'personas' && personaBridge && (
  <div className="persona-bridge-section">
    {personaBridge}
  </div>
)}
```

### **Activities Display:**
```javascript
// Show activities if they exist
{activities && activities.length > 0 && (
  <table>
    {activities.map((activity, index) => (
      <tr key={index}>
        <td>{activity.name}</td>
        <td>{activity.address}</td>
        <td>{activity.rating}</td>
      </tr>
    ))}
  </table>
)}
```

---

## State Management Strategy

### **Why No Redux/Zustand?**
- Small app with limited shared state
- AuthContext sufficient for authentication
- Component-level state for UI interactions
- URL params for filter state (enables bookmarking)

### **State Types:**

**Global State:**
- `AuthContext` - User authentication and token

**Component State:**
- `Dashboard.jsx` - submissions, stats, pagination, loading
- `EmailEdit.jsx` - editable fields, auto-save state, loading states

**URL State:**
- Filters (status, challengeType, search, page)
- Enables shareable URLs and browser back/forward

---

## Error Handling

### **API Errors:**
```javascript
try {
  await apiCall();
} catch (err) {
  setError(err.response?.data?.message || 'Generic error message');
  // Show error alert to user
}
```

### **401 Unauthorized:**
- Interceptor catches globally
- Clears token from localStorage
- Redirects to /login
- Forces re-authentication

### **User Feedback:**
- Error alerts (red) for failures
- Success alerts (green) for confirmations
- Loading spinners during async operations
- Disabled buttons during processing

---

## Performance Optimizations

### **Debounced Auto-Save:**
- Prevents excessive API calls
- Uses setTimeout with cleanup
- 2-second delay after last change

### **Pagination:**
- Default 10 submissions per page
- Reduces initial load time
- Enables infinite scroll in future

### **Parallel API Calls:**
```javascript
// Dashboard fetches stats and submissions simultaneously
const [submissionsData, statsData] = await Promise.all([
  getSubmissions({ ... }),
  getStats()
]);
```

### **Lazy Loading:**
- Email preview only renders when page loaded
- Images not lazy-loaded (no images in MVP)

---

## Environment Configuration

### **.env:**
```bash
VITE_API_URL=http://localhost:3000  # Backend API base URL
```

### **Development:**
```bash
npm run dev  # Vite dev server on port 5173
```

### **Production:**
```bash
npm run build  # Builds to dist/
npm run preview  # Preview production build
```

---

## Key Business Logic

### **Why Auto-Save?**
- Prevents data loss
- Reduces cognitive load on admins
- No explicit "Save" needed in most cases
- Smooth UX similar to Google Docs

### **Why Manual "Save Now" Button?**
- Provides control when needed
- Shows only when unsaved changes exist
- Useful before closing browser
- Gives immediate feedback

### **Why Validate Before Send?**
- Prevents sending incomplete emails
- Catches missing required fields
- Provides clear error messages
- Protects against user mistakes

### **Why Force Save Before Approve?**
- Ensures latest changes are included
- Prevents race conditions
- Guarantees email reflects current state
- Backend also validates (defense in depth)

### **Why URL Params for Filters?**
- Enables bookmarking filtered views
- Browser back/forward works naturally
- Shareable links (e.g., "show me all failed")
- Persists filters across page refreshes

### **Why Show Challenge Type from Data?**
- `challenge_type` column is redundant
- `planning_mode` + `social_goal` are source of truth
- Conditional logic reflects actual data structure
- Enables accurate filtering by backend
