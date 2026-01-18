# Frontend Data Flow - Social Concierge Admin Dashboard

## Overview
Complete data flow from API calls through React components to UI rendering.

---

## 1. AUTHENTICATION FLOW

**File:** `src/contexts/AuthContext.jsx`

### Context Provider: `AuthProvider`

**State:**
```javascript
{
  user: { id, email, name } | null,
  loading: boolean
}
```

**Functions:**
- `login(email, password)` → POST `/api/admin/auth/login`
- `logout()` → POST `/api/admin/auth/logout`
- `checkAuth()` → GET `/api/admin/auth/me`

**Protected Route Wrapper:** `src/components/ProtectedRoute.jsx`
- Redirects to `/login` if not authenticated
- Shows loading spinner during auth check

---

## 2. API SERVICES

### 2a. Base API Client

**File:** `src/services/api.js`

**Axios Instance:**
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true, // Sends cookies
  headers: { 'Content-Type': 'application/json' }
});
```

**Interceptors:**
- Response 401 → Redirect to login
- Error handling

### 2b. Submissions API

**File:** `src/services/submissions.js`

**Functions:**

1. **`getSubmissions({ status, challengeType, search, page, limit })`**
   - GET `/api/admin/submissions?[params]`
   - Returns: `{ submissions: [...], page, totalPages, total }`

2. **`getSubmission(id)`**
   - GET `/api/admin/submissions/:id`
   - Returns: Full submission object

3. **`updateSubmission(id, data)`**
   - PATCH `/api/admin/submissions/:id`
   - Allowed fields: `subject`, `recipient_email`, `persona_bridge`, `invitation_script`, `activities`
   - Returns: Updated submission

4. **`approveSubmission(id)`**
   - POST `/api/admin/submissions/:id/approve`
   - Triggers email send
   - Returns: Success/error

5. **`rejectSubmission(id)`**
   - POST `/api/admin/submissions/:id/reject`
   - Returns: Success/error

6. **`getStats()`**
   - GET `/api/admin/submissions/stats`
   - Returns: `{ total, processing, sent, rejected, failed }`

---

## 3. DASHBOARD PAGE

**File:** `src/pages/Dashboard.jsx`

### State Management

**URL Parameters (via `useSearchParams`):**
- `status` - Filter by status (all/processing/sent/rejected/failed)
- `challengeType` - Filter by type (all/Persona-Based/Active Adventure/etc.)
- `search` - Search term
- `page` - Page number

**Component State:**
```javascript
{
  submissions: [], // Array of submission objects
  stats: { total, processing, sent, rejected, failed },
  loading: boolean,
  pagination: { page, totalPages, total }
}
```

### Data Fetching

**Effect Hook:** Triggers on filter/page change
```javascript
useEffect(() => {
  fetchData();
}, [status, challengeType, search, page]);
```

**`fetchData()` Flow:**
1. Call `getSubmissions()` with filters
2. Call `getStats()` for counts
3. Update state with results
4. Handle loading states

### Submission Card Display

**Expected Submission Object Structure:**
```javascript
{
  id: "uuid",
  status: "processing" | "pending_approval" | "sent" | "rejected" | "failed",
  challenge_type: "Persona-Based" | "Active Adventure" | etc.,
  user_persona: "Spark",
  friend_persona: "Confidant",
  user_email: "user@example.com",
  recipient_email: "recipient@example.com",
  budget: "Moderate ($15 - $30)",
  preferred_date: "2026-01-28",
  location: "...", // May be null
  user_location: "...",
  user_location_formatted: "...",
  created_at: "2026-01-17T07:12:07Z",
  processing_completed_at: "...",
  error_message: "..." // If status='failed'
}
```

### ⚠️ CRITICAL FIELDS FOR RENDERING

**Status Badge:**
- Expects: `submission.status`
- Maps to: `STATUS_STYLES[status]`
- Valid values: `processing`, `pending_approval`, `sent`, `rejected`, `failed`

**Challenge Type Icon:**
- Expects: `submission.challenge_type`
- Maps to: `CHALLENGE_ICONS[challenge_type]`
- Valid values: `Persona-Based`, `Active Adventure`, `Creative Collab`, etc.

**Display Fields:**
- Location: `submission.location || submission.user_location_formatted || submission.user_location`
- Email: `submission.recipient_email || submission.user_email`
- Date: `submission.preferred_date`
- Budget: `submission.budget`

### Click Handler
```javascript
onClick={() => navigate(`/submissions/${submission.id}`)}
```

---

## 4. EMAIL EDIT PAGE

**File:** `src/pages/EmailEdit.jsx`

### Route
`/submissions/:id`

### Data Fetching

**`fetchSubmission()` on mount:**
1. Call `getSubmission(id)`
2. Destructure response into editable fields
3. Store in component state

### Expected Submission Object

**Full Structure from Backend:**
```javascript
{
  // Metadata
  id: "uuid",
  status: "pending_approval",
  challenge_type: "Persona-Based",
  planning_mode: "personas",
  social_goal: "Active Adventure",
  
  // Form data
  user_persona: "Spark",
  friend_persona: "Confidant",
  user_email: "user@example.com",
  recipient_email: "recipient@example.com",
  user_location: "11747 Mordor Ln Frisco, TX 75035",
  friend_location: "11747 Mordor Ln Frisco Texas 75035",
  user_location_formatted: "11747 Mordor Lane, Frisco, TX 75035, United States",
  friend_location_formatted: "11747 Mordor Lane, Frisco, TX 75035, United States",
  budget: "Moderate ($15 - $30)",
  preferred_date: "2026-01-28",
  max_travel_time: 35,
  
  // Geocoding
  midpoint_lat: 33.175155,
  midpoint_lng: -96.788324,
  
  // AI-generated (editable)
  subject: "Catching Up: Fun & Real Talk!",
  persona_bridge: "This plan brings together...",
  invitation_script: "Hey! I was thinking...",
  activities: [
    {
      name: "Craftway Kitchen Frisco",
      link: "https://maps.google.com/?cid=11943025176142866823",
      rating: "4.7 ⭐",
      hours: "Open 11:00 AM – 9:00 PM on Wednesday, Jan 28, 2026",
      address: "5729 Lebanon Rd #100, Frisco, TX 75034, USA"
    },
    // ... more venues
  ],
  email_html: "<html>...</html>",
  
  // Tracking
  created_at: "2026-01-17T07:12:07Z",
  processing_started_at: "2026-01-17T07:12:08Z",
  processing_completed_at: "2026-01-17T07:12:15Z",
  processing_duration_ms: 7000,
  error_message: null,
  
  // Approval
  approved_by: null,
  approved_at: null,
  admins: null // Populated if approved_by exists
}
```

### ⚠️ CRITICAL: Activities Field

**Database Type:** `JSONB`
**Expected Frontend Type:** Array of objects

**Each Activity Object:**
```javascript
{
  name: string,      // Required
  link: string,      // Google Maps URL
  rating: string,    // e.g., "4.7 ⭐"
  hours: string,     // e.g., "Open 11:00 AM – 9:00 PM..."
  address: string    // Full address
}
```

**Rendering Code (lines 450-520):**
```jsx
{activities.map((activity, index) => (
  <div key={index}>
    <input value={activity.name || ''} />
    <input value={activity.rating || ''} />
    <input value={activity.hours || ''} />
    <input value={activity.address || ''} />
    <input value={activity.link || ''} />
  </div>
))}
```

**Empty State (lines 519-523):**
```jsx
{activities.length === 0 && (
  <div>
    <p>No activities in this plan</p>
  </div>
)}
```

### Component State

**Editable Fields:**
```javascript
{
  subject: string,
  recipientEmail: string,
  personaBridge: string,
  invitationScript: string,
  activities: Array<ActivityObject>
}
```

**UI State:**
```javascript
{
  loading: boolean,
  saving: boolean,
  approving: boolean,
  rejecting: boolean,
  error: string,
  success: string,
  autoSaving: boolean,
  lastSaved: Date,
  hasUnsavedChanges: boolean,
  showPreview: boolean
}
```

### Auto-Save Logic

**Trigger:** 2 seconds after any editable field changes
**Effect Hook:** Watches `[subject, recipientEmail, personaBridge, invitationScript, activities]`
**Function:** `performAutoSave()`
**API Call:** `updateSubmission(id, { subject, recipient_email, personaBridge, invitation_script, activities })`

### Approval Validation (lines 215-225)

**Required Before Approve:**
1. `recipientEmail` must be valid email
2. `subject` must not be empty
3. `invitationScript` must not be empty
4. `activities.length > 0` ← **CRITICAL**

**Error if activities empty:**
```javascript
if (!activities || activities.length === 0) {
  setError('At least one activity is required');
  return;
}
```

### Status-Based Rendering

**Editable States:**
- `processing`
- `pending`
- `pending_approval`

**Read-Only States:**
- `sent`
- `rejected`
- `failed`

**Conditional Rendering:**
```javascript
const isPending = ['pending', 'pending_approval', 'processing'].includes(submission.status);

<input disabled={!isPending} />
```

---

## 5. FIELD MAPPING: Backend ↔ Frontend

### ✅ Correct Mappings

| Backend Field (DB) | Frontend Variable | Component |
|-------------------|------------------|-----------|
| `id` | `submission.id` | Both |
| `status` | `submission.status` | Both |
| `challenge_type` | `submission.challenge_type` | Both |
| `user_persona` | `submission.user_persona` | Dashboard |
| `friend_persona` | `submission.friend_persona` | Dashboard |
| `subject` | `subject` (state) | EmailEdit |
| `recipient_email` | `recipientEmail` (state) | EmailEdit |
| `persona_bridge` | `personaBridge` (state) | EmailEdit |
| `invitation_script` | `invitationScript` (state) | EmailEdit |
| `activities` | `activities` (state) | EmailEdit |
| `budget` | `submission.budget` | Dashboard |
| `preferred_date` | `submission.preferred_date` | Dashboard |
| `created_at` | `submission.created_at` | Both |

### ⚠️ POTENTIAL MISMATCHES

#### 1. Location Fields

**Backend has 4 location fields:**
- `location` (legacy, may be null)
- `user_location` (raw input)
- `user_location_formatted` (from geocoding)
- `friend_location` (raw input)

**Frontend Dashboard (line ~300):**
```javascript
{submission.location || 'N/A'}
```

**❌ Problem:** Should check formatted fields first:
```javascript
{submission.user_location_formatted || submission.user_location || submission.location || 'N/A'}
```

#### 2. Email Fields

**Backend has 2 email fields:**
- `user_email` (from form)
- `recipient_email` (editable, may be null initially)

**Frontend EmailEdit:**
```javascript
setRecipientEmail(data.recipient_email || '');
```

**⚠️ Issue:** Should fall back to user_email:
```javascript
setRecipientEmail(data.recipient_email || data.user_email || '');
```

#### 3. Challenge Type Casing

**Backend writes:** `challenge_type` (snake_case in DB)
**Frontend expects:** `submission.challenge_type` ✅ Correct

**Valid values:**
- "Persona-Based"
- "Active Adventure"
- "Discovery & Culture"
- "Casual Hangout"
- etc.

#### 4. Activities Array Structure

**❌ CRITICAL BUG IF:**
- Backend stores HTML string instead of array
- Frontend receives: `activities: "<a href='...'>...</a>..."`
- Expected: `activities: [{name: "...", ...}, ...]`

**Fix:** Backend now parses HTML to array (implemented in aiService.js)

---

## 6. RENDERING ISSUES & FIXES

### Issue #1: "Only renders src=main.jsx"

**Symptom:** Clicking a ticket shows blank page or only main.jsx

**Possible Causes:**

1. **Missing `id` in submission object**
   - Check: Does `submission.id` exist?
   - Fix: Verify backend returns `id` field

2. **Invalid route parameter**
   - Check: Is URL `/submissions/:id` or `/submissions/undefined`?
   - Fix: Ensure `navigate()` receives valid ID

3. **API returns 404 or error**
   - Check: Browser Network tab for failed API call
   - Fix: Verify submission exists in database

4. **React Router not configured**
   - Check: Is route defined in App.jsx?
   - Fix: Ensure `<Route path="/submissions/:id" element={<EmailEdit />} />`

5. **Missing error boundary**
   - Cause: Component crashes during render
   - Fix: Add error logging in useEffect

### Issue #2: "Dashboard renders nothing after back navigation"

**Symptom:** After viewing submission and clicking back, dashboard is blank

**Possible Causes:**

1. **React state not preserved**
   - Cause: Component unmounts and remounts
   - Fix: Dashboard should refetch data on mount

2. **Authentication state lost**
   - Cause: Auth cookie expired or cleared
   - Fix: Check AuthContext state, may need re-login

3. **URL params lost**
   - Cause: Navigate without preserving search params
   - Fix: Use `navigate(-1)` or preserve params

4. **API call fails silently**
   - Cause: No error handling in catch block
   - Fix: Add error logging and user feedback

### Issue #3: "Submission fields not displaying"

**Symptom:** EmailEdit page loads but fields are empty or undefined

**Possible Causes:**

1. **Field name mismatch**
   - Check: `activities` vs `activity_suggestion`
   - Fix: Use correct field names from API response

2. **Activities is HTML string not array**
   - Check: Type of `submission.activities`
   - Fix: Backend must store parsed array, not HTML

3. **Null/undefined values**
   - Check: Does API return null for optional fields?
   - Fix: Add fallbacks: `submission.field || ''`

4. **Async state issue**
   - Cause: Component renders before data loads
   - Fix: Show loading spinner while `loading === true`

---

## 7. DATA FLOW SUMMARY

```
User clicks "Login"
  ↓
auth.login(email, password) → POST /api/admin/auth/login
  ↓
AuthContext.user = { id, email, name }
  ↓
Navigate to /dashboard
  ↓
Dashboard.useEffect() triggers fetchData()
  ↓
submissions.getSubmissions() → GET /api/admin/submissions?[filters]
submissions.getStats() → GET /api/admin/submissions/stats
  ↓
Backend: submissionService.getSubmissions()
  ↓
Backend: Supabase query with filters
  ↓
Backend: Returns { submissions: [...], page, totalPages, total }
  ↓
Frontend: setState({ submissions, stats, pagination })
  ↓
Dashboard renders submission cards
  ↓
User clicks submission card
  ↓
navigate(`/submissions/${submission.id}`)
  ↓
EmailEdit.useEffect() triggers fetchSubmission()
  ↓
submissions.getSubmission(id) → GET /api/admin/submissions/:id
  ↓
Backend: submissionService.getSubmissionById(id)
  ↓
Backend: Supabase query with .single()
  ↓
Backend: Returns full submission object
  ↓
Frontend: setState({ submission, subject, recipientEmail, activities, ... })
  ↓
EmailEdit renders form with populated fields
  ↓
User edits field
  ↓
Auto-save after 2 seconds
  ↓
submissions.updateSubmission(id, { ...changes }) → PATCH /api/admin/submissions/:id
  ↓
Backend: submissionService.updateSubmission(id, updates)
  ↓
Backend: Supabase update with filtered fields
  ↓
Frontend: Success message, lastSaved timestamp updated
```

---

## 8. DEBUGGING CHECKLIST

### When submission doesn't display:

1. ✅ **Check Network Tab**
   - Is GET request succeeding?
   - What status code? (200/401/404/500)
   - What data is returned?

2. ✅ **Check Console Logs**
   - Any errors during fetch?
   - Is `submission` object populated?
   - Type of `activities` field?

3. ✅ **Check Component State**
   - Use React DevTools
   - Inspect `submission` state
   - Check `loading` boolean

4. ✅ **Verify Field Names**
   - Does backend return `challenge_type`?
   - Does backend return `activities` as array?
   - Are all expected fields present?

5. ✅ **Check Status Value**
   - Is `status` one of valid enum values?
   - Does `STATUS_STYLES[status]` exist?

6. ✅ **Verify Activities Structure**
   ```javascript
   // Correct:
   activities: [{name: "...", link: "...", ...}]
   
   // Wrong:
   activities: "<a href='...'>...</a>"
   activities: null
   activities: undefined
   ```

### When auto-save fails:

1. ✅ Check editable fields match API expectations
2. ✅ Verify `activities` is valid JSON array
3. ✅ Check authentication (401 error?)
4. ✅ Look for validation errors in response

---

## 9. COMPONENT HIERARCHY

```
App.jsx
├── AuthProvider (Context)
├── Router
    ├── /login → Login.jsx
    ├── /register → Register.jsx
    └── ProtectedRoute
        ├── Layout
        │   ├── Header.jsx
        │   └── [children]
        ├── /dashboard → Dashboard.jsx
        │   ├── StatCard (x5)
        │   ├── FilterBar
        │   └── SubmissionCard (map)
        └── /submissions/:id → EmailEdit.jsx
            ├── StatusBadge
            ├── Alerts (error/success)
            ├── SubjectInput
            ├── RecipientEmailInput
            ├── PersonaBridgeTextarea
            ├── ActivitiesSection
            │   └── ActivityCard (map)
            ├── InvitationScriptTextarea
            ├── Sidebar
            │   ├── MetadataCard
            │   ├── ActionsCard
            │   └── PreviewButton
            └── EmailPreviewModal
```

---

## 10. REQUIRED FIXES

### Priority 1 (Critical):

1. ✅ **Backend: Parse activity_suggestion to venues array** - DONE
2. ✅ **Backend: Store parsed array in activities field** - DONE
3. ❌ **Frontend: Add fallback for recipient_email**
   ```javascript
   setRecipientEmail(data.recipient_email || data.user_email || '');
   ```

### Priority 2 (High):

4. ❌ **Frontend: Improve location display**
   ```javascript
   {submission.user_location_formatted || submission.user_location || 'N/A'}
   ```

5. ❌ **Frontend: Add error boundary for EmailEdit**
6. ❌ **Frontend: Add loading state checks before rendering fields**

### Priority 3 (Medium):

7. ❌ **Frontend: Add null checks for activities rendering**
   ```javascript
   {activities && activities.length > 0 ? activities.map(...) : <EmptyState />}
   ```

8. ❌ **Frontend: Log errors in console for debugging**
9. ❌ **Frontend: Show user-friendly error messages**
