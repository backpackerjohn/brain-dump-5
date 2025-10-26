# Connections Feature Testing Guide

## Pre-Test Verification ✅

### Database Schema Verified
- ✅ `connections` table exists with all 9 columns
- ✅ `connection_metadata` table exists with all 6 columns  
- ✅ 6 performance indexes created
- ✅ Code properly wired up (ConnectionsTab → BrainDump → useClusters)

---

## Manual Test Plan

### Test 1: First-Time Connection Analysis
**Purpose**: Verify AI analysis runs and saves to database

**Steps**:
1. Log in to Brain Dump (or create account)
2. Add at least 10-15 thoughts with varied content (required for clustering)
   - Example thoughts:
     - "Need to learn React hooks for the new project"
     - "Thinking about starting a morning meditation routine"
     - "The new project deadline is next Friday"
     - "Want to improve my sleep schedule"
     - "Need to refactor the authentication code"
     - "Meditation helps with stress management"
     - "Should set up automated testing"
     - "Morning routines impact productivity"
     - "Code review process needs improvement"
     - "Need to prioritize health and work balance"
3. Navigate to **Connections** tab
4. Click "Find Surprising Connections" button

**Expected Results**:
- ✅ Button shows "Finding Connections..." state
- ✅ AI analysis runs (Edge Function called)
- ✅ Connections display in UI (if any found)
- ✅ Toast notification shows: "Found X surprising connections" OR no message if zero found

**Database Verification**:
```sql
-- Check connections were saved
SELECT COUNT(*) as connection_count FROM connections 
WHERE user_id = '<your-user-id>';

-- Check metadata was updated
SELECT 
    last_full_analysis_at,
    thoughts_analyzed_count,
    EXTRACT(EPOCH FROM (NOW() - last_full_analysis_at)) / 60 AS minutes_ago
FROM connection_metadata 
WHERE user_id = '<your-user-id>';
```

**Expected Database State**:
- `connections` table has 0-10 rows (depending on AI analysis)
- `connection_metadata.last_full_analysis_at` is set to current timestamp
- `connection_metadata.thoughts_analyzed_count` matches your thought count

---

### Test 2: Cache Hit (< 2 Hours)
**Purpose**: Verify connections load from cache without re-running AI

**Steps**:
1. After completing Test 1, **refresh the page** (F5)
2. Navigate back to **Connections** tab
3. Observe what happens (connections should appear instantly)

**Expected Results**:
- ✅ Connections appear **immediately** without clicking any button
- ✅ Toast notification shows: "Loaded saved connections (last updated Xmin ago)"
- ✅ Network tab shows **NO** call to `find-connections` Edge Function

**Verification**:
- Open browser DevTools (F12) → Network tab
- Filter by "find-connections"
- Should see **NO new requests** to the Edge Function
- Connections loaded purely from database query (free!)

**Cost Savings**:
- Without cache: $0.05-0.10 Gemini API call
- With cache: ~$0.0001 database query
- **Savings**: 99.9% on this request

---

### Test 3: Manual Refresh (Force Re-run)
**Purpose**: Verify manual refresh bypasses cache

**Steps**:
1. On Connections tab with cached data loaded
2. Click "Find Surprising Connections" button again
3. Watch for API call

**Expected Results**:
- ✅ AI analysis re-runs (new API call)
- ✅ Fresh results saved to database
- ✅ `connection_metadata.last_full_analysis_at` updated to current time

**Database Verification**:
```sql
SELECT 
    last_full_analysis_at,
    updated_at,
    EXTRACT(EPOCH FROM (updated_at - last_full_analysis_at)) AS seconds_diff
FROM connection_metadata 
WHERE user_id = '<your-user-id>';
```
- `seconds_diff` should be near 0 (both timestamps recently updated)

---

### Test 4: Cache Miss (> 2 Hours)
**Purpose**: Verify cache expires after 2 hours

**Steps**:
1. Manually update the cache timestamp to be 3 hours old:
```sql
UPDATE connection_metadata 
SET last_full_analysis_at = NOW() - INTERVAL '3 hours'
WHERE user_id = '<your-user-id>';
```
2. Navigate to Connections tab
3. Click "Find Surprising Connections"

**Expected Results**:
- ✅ Cache check detects stale data (> 2 hours old)
- ✅ AI analysis re-runs automatically
- ✅ Fresh results saved with new timestamp
- ✅ Toast shows "Found X connections" (not "Loaded saved connections")

**Verification**:
- Network tab should show new `find-connections` API call
- Database timestamp should update to current time

---

### Test 5: Zero Connections Found
**Purpose**: Verify metadata updates even when AI finds nothing

**Steps**:
1. Delete all thoughts except 2-3 unrelated ones:
```sql
-- Keep only a few thoughts
DELETE FROM thoughts 
WHERE user_id = '<your-user-id>' 
AND id NOT IN (
    SELECT id FROM thoughts WHERE user_id = '<your-user-id>' LIMIT 3
);
```
2. Click "Find Surprising Connections"
3. AI likely won't find connections (too few thoughts)

**Expected Results**:
- ✅ AI analysis completes successfully
- ✅ Zero connections returned
- ✅ Empty state message: "No connections found yet"
- ✅ **CRITICAL**: `connection_metadata` still updates with current timestamp

**Database Verification**:
```sql
-- Verify metadata updated despite zero results
SELECT 
    last_full_analysis_at,
    thoughts_analyzed_count
FROM connection_metadata 
WHERE user_id = '<your-user-id>';
```
- `last_full_analysis_at` should be current timestamp
- `thoughts_analyzed_count` should be 2-3

**Why This Matters**:
- Without this fix, cache window wouldn't work for zero-result analyses
- User would re-run AI on every page visit (expensive!)
- **This was the critical bug the architect found and we fixed**

---

### Test 6: Persistence Across Sessions
**Purpose**: Verify connections persist after logout/login

**Steps**:
1. Generate connections (Test 1)
2. Log out
3. Close browser tab
4. Open new browser tab
5. Log back in
6. Navigate to Connections tab

**Expected Results**:
- ✅ Connections appear immediately (loaded from database)
- ✅ Cache status shows time since last analysis
- ✅ No data lost

---

### Test 7: Connection Deletion When Thought Deleted
**Purpose**: Verify CASCADE deletion works

**Steps**:
1. Generate connections between thoughts
2. Note which thoughts are connected
3. Delete one of the connected thoughts
4. Check database

**Database Verification**:
```sql
-- Should show NO orphaned connections
SELECT c.* 
FROM connections c
LEFT JOIN thoughts t1 ON c.thought1_id = t1.id
LEFT JOIN thoughts t2 ON c.thought2_id = t2.id
WHERE t1.id IS NULL OR t2.id IS NULL;
```
- Result should be empty (0 rows)
- CASCADE deletion automatically removed the connection

---

## Edge Cases to Test

### Edge Case 1: New User (No Metadata)
- First-time user with no `connection_metadata` row
- Should create metadata on first analysis
- Cache check treats missing metadata as "no cache"

### Edge Case 2: Database Save Failure
- If database save fails, AI results still returned to user
- Error logged but doesn't crash the app
- User sees connections even if persistence fails

### Edge Case 3: Completed Thoughts
- Connections involving completed thoughts are filtered out in UI
- Database still stores them (non-destructive)
- If thought unmarked as complete, connection reappears

---

## Performance Testing

### Cache Effectiveness Measurement

**Scenario**: User checks connections 5 times in one session

**Without Cache** (before Phase 2.1):
- 5 API calls @ $0.08 each = $0.40
- Total time: ~30 seconds (5 × 6 sec per analysis)

**With Cache** (after Phase 2.1):
- 1 API call @ $0.08 = $0.08
- 4 cache hits @ $0.0001 each = $0.0004
- Total cost: $0.0804 (80% savings)
- Total time: ~7 seconds (1 × 6 sec + 4 × 0.2 sec)

**Efficiency Gains**:
- 💰 80% cost reduction
- ⚡ 76% time reduction
- 🌱 95% reduction in AI API load

---

## Test Data Queries

### Create Sample Thoughts (SQL)
```sql
-- Insert sample thoughts for testing
INSERT INTO thoughts (user_id, title, snippet, content, status)
VALUES 
    ('<your-user-id>', 'Learn React Hooks', 'Study useEffect and useState', 'Need to master React hooks for the new project', 'active'),
    ('<your-user-id>', 'Morning Meditation', 'Start meditation routine', 'Want to begin daily meditation practice', 'active'),
    ('<your-user-id>', 'Project Deadline', 'Next Friday deadline', 'The big project is due next Friday', 'active'),
    ('<your-user-id>', 'Improve Sleep', 'Better sleep schedule', 'Need to establish consistent sleep routine', 'active'),
    ('<your-user-id>', 'Refactor Auth Code', 'Clean up authentication', 'Authentication code needs refactoring', 'active'),
    ('<your-user-id>', 'Stress Management', 'Meditation for stress', 'Using meditation to manage work stress', 'active'),
    ('<your-user-id>', 'Automated Testing', 'Set up test suite', 'Need to implement automated testing', 'active'),
    ('<your-user-id>', 'Morning Routine', 'Optimize morning habits', 'Morning routine impacts daily productivity', 'active'),
    ('<your-user-id>', 'Code Review Process', 'Improve reviews', 'Code review process needs improvement', 'active'),
    ('<your-user-id>', 'Work-Life Balance', 'Health and productivity', 'Need to balance health and work better', 'active');
```

### Check Cache Status
```sql
SELECT 
    user_id,
    last_full_analysis_at,
    thoughts_analyzed_count,
    CASE 
        WHEN last_full_analysis_at IS NULL THEN 'No cache'
        WHEN EXTRACT(EPOCH FROM (NOW() - last_full_analysis_at)) / 3600 < 2 THEN 'Cache valid'
        ELSE 'Cache expired'
    END as cache_status,
    ROUND(EXTRACT(EPOCH FROM (NOW() - last_full_analysis_at)) / 60) AS minutes_ago
FROM connection_metadata
WHERE user_id = '<your-user-id>';
```

### View Connections
```sql
SELECT 
    c.id,
    c.description,
    c.created_at,
    t1.title as thought1_title,
    t2.title as thought2_title
FROM connections c
JOIN thoughts t1 ON c.thought1_id = t1.id
JOIN thoughts t2 ON c.thought2_id = t2.id
WHERE c.user_id = '<your-user-id>'
ORDER BY c.created_at DESC;
```

---

## Success Criteria

✅ **Phase 1 (Persistence) is successful if**:
- Connections save to database after AI analysis
- Connections persist across page refreshes
- Metadata tracks analysis timestamps
- CASCADE deletion removes orphaned connections

✅ **Phase 2.1 (Caching) is successful if**:
- Cache hit: No API call within 2-hour window
- Cache miss: API re-runs after 2 hours
- Zero-result analyses update metadata (critical fix)
- Toast notifications show cache status

✅ **Cost optimization is successful if**:
- 60-75% reduction in API calls for typical usage
- Database queries are fast (< 200ms)
- No unnecessary re-analyses

---

## Troubleshooting

### Issue: Connections don't persist
**Check**:
1. Browser console for errors
2. Network tab for failed API calls
3. Database connection status
4. Edge Function logs

### Issue: Cache not working
**Check**:
1. `connection_metadata.last_full_analysis_at` is set
2. Timestamp is within 2 hours
3. No console errors in `loadConnectionsFromDB()`
4. Browser console shows "Loading cached connections" log

### Issue: Zero connections always re-run AI
**Check**:
1. Verify the metadata update fix is deployed
2. Check Edge Function code line 156-163
3. Metadata should update BEFORE the `if (connections.length > 0)` check

---

## Next Steps After Testing

Once all tests pass:
- ✅ Mark Phase 1 & 2.1 as production-ready
- 📋 Document any issues found
- 🚀 Proceed with Phase 2.2 (incremental analysis)
- 🎨 Proceed with Phase 3 (synthesis layer + enhanced UI)

---

## Quick Reference

**Cache Window**: 2 hours  
**Location**: `src/hooks/useClusters.ts` line 309  
**Modify**: Change `< 2` to adjust cache duration  

**Database Tables**:
- `connections` - Stores connection data
- `connection_metadata` - Tracks cache timestamps

**Key Files**:
- Edge Function: `supabase/functions/find-connections/index.ts`
- Hook: `src/hooks/useClusters.ts`
- Types: `src/types/thought.types.ts`
- Queries: `src/integrations/supabase/queries.ts`
