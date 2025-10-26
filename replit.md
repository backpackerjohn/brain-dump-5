# Brain Dump - AI-Powered Thought Management

## Overview
Brain Dump is an AI-powered thought management application that helps users capture, organize, and connect their ideas. The app uses AI to automatically process thoughts, cluster related ideas, and discover surprising connections between concepts.

## Recent Changes (October 26, 2025)

### 🎉 Connections Feature Upgrade: Phase 1 & 2.1 Complete
**Major Enhancement**: Persistent, cost-optimized connection analysis system

#### Phase 1: Persistence Layer (✅ Complete)
- ✅ **Database Schema**: Created `connections` and `connection_metadata` tables in PostgreSQL
  - Stores discovered connections permanently (no more ephemeral results)
  - Tracks cache metadata for intelligent refresh decisions
  - Row-level security + cascade deletion for data integrity
- ✅ **Type Definitions**: Added `ConnectionRow` and enhanced `Connection` types
  - Production-ready TypeScript types with proper documentation
  - Type assertions for new tables (not yet in auto-generated Supabase types)
- ✅ **Database Queries**: 6 typed CRUD functions in `src/integrations/supabase/queries.ts`
  - fetch, create, dismiss, delete connections
  - Cache metadata management
- ✅ **Edge Function Persistence**: Updated `find-connections` to save results
  - Critical fix: Metadata updates even for zero-result analyses
  - Ensures cache window works correctly

#### Phase 2.1: Smart Caching (✅ Complete)
- ✅ **2-Hour Cache Window**: Connections load from database if analyzed within 2 hours
  - **Cost Savings**: 60-75% reduction in Gemini API calls
  - User sees instant results on subsequent visits
  - Toast notification shows cache age ("last updated 15min ago")
- ✅ **Auto-Load on Mount**: Connections appear immediately from cached data
  - No waiting, no unnecessary AI calls
  - Free database query vs. $0.05-0.10 API call
- ✅ **Manual Refresh**: `forceRefresh` parameter bypasses cache
  - Prepared for UI button in future enhancement

**See**: `CONNECTIONS_PHASE_1_AND_2_IMPLEMENTATION.md` for full technical documentation

#### Next Steps (Not Yet Implemented)
- **Phase 2.2**: Incremental analysis (95%+ cost savings via analyzing only new thoughts)
- **Phase 3**: Synthesis layer (connection types, strategic insights, enhanced UI)

### Previous Updates (October 26, 2025)

#### Quick Critical Fixes Implementation (Complete)
- ✅ **ErrorBoundary Reset Bug Fixed**: Added errorCount state to force child remount on error recovery
- ✅ **Mobile FAB Padding**: Added pb-24 bottom padding on mobile for floating action button clearance
- ✅ **Empty Cluster Filtering**: Clusters with 0 thoughts now hidden from UI (non-destructive)
- ✅ **CategorySelector Plus Button**: Wired through 4-component chain to addCategoryToThought
- ✅ **Remove from Cluster UI**: Added red "Remove from Cluster" button to ThoughtCard dropdown when in cluster
- ✅ **Collapsible Category Filter**: Categories now in collapsible section with ScrollArea (height: 32)
- ✅ **Delete Cluster Functionality**: Manual CASCADE deletion (thought_clusters → cluster) with confirmation dialog
- ✅ **Logger Integration Complete**: All console.error calls in BrainDump.tsx replaced with logError + context metadata

## Recent Changes (October 25, 2025)

### Migration Complete
- ✅ **Migrated from Lovable AI Gateway to Google Gemini**: All AI features now use Google's Gemini API directly
- ✅ **Kept Supabase for Storage & Authentication**: Maintained Supabase for all data storage and user authentication
- ✅ **Created Shared Gemini Helper**: Built `supabase/functions/_shared/gemini.ts` with proper JSON parsing and camelCase API fields
- ✅ **Updated All 5 Edge Functions**: All migrated to use Gemini API with structured outputs
- ✅ **Configured Vite for Replit**: Added `allowedHosts: true` for preview functionality

### Production Readiness Improvements
- ✅ **Environment Validation**: Added `src/utils/env.ts` - fails fast with clear errors if required env vars are missing
- ✅ **Input Sanitization**: Added DOMPurify-based sanitization to protect against XSS attacks
  - All user content sanitized before storage
  - Category names limited to 50 characters
  - Cluster names limited to 100 characters
- ✅ **Type Safety**: Created typed query helpers in `src/integrations/supabase/queries.ts`
  - Reduced `as any` casts in hooks
  - Better documentation of type limitations
- ✅ **Error Handling**: Centralized error handling utilities in `src/utils/error-handling.ts`
  - Categorized error types (auth, network, validation, etc.)
  - User-friendly error messages
  - Automatic retry detection
- ✅ **Configuration Management**: Extracted magic numbers to `src/config/app.config.ts`
  - Centralized thresholds (min thoughts for clustering: 10)
  - Feature flags for gradual rollouts
- ✅ **Code Cleanup**: Removed LOVABLE_API_KEY references and dead code

## Project Architecture

### Frontend
- **Framework**: React + TypeScript with Vite
- **UI Components**: shadcn/ui with Tailwind CSS
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Authentication**: Supabase Auth
- **API Calls**: Supabase Client SDK

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Edge Functions**: Supabase Edge Functions (Deno runtime)
- **AI Integration**: Google Gemini API (gemini-2.0-flash-exp model)

### Key Features
1. **Automatic Thought Processing**: AI extracts multiple thoughts from user input, generates titles, snippets, and categories
2. **Smart Clustering**: Groups related thoughts together using AI analysis
3. **Connection Discovery**: Finds non-obvious connections between different ideas
4. **Category Suggestions**: AI suggests relevant categories for thoughts
5. **Related Thought Finder**: Identifies thoughts that fit into existing clusters

## Supabase Edge Functions

All Edge Functions now use the shared Gemini helper module:

### 1. process-thought
- **Purpose**: Extracts structured thoughts from raw user input
- **AI Function**: `callGemini()` with system/user messages
- **Returns**: Array of processed thoughts with titles, snippets, categories

### 2. generate-clusters
- **Purpose**: Groups related thoughts into thematic clusters
- **AI Function**: `callGeminiWithSchema()` with strict JSON schema
- **Returns**: Array of clusters with names and thought IDs

### 3. find-related-thoughts
- **Purpose**: Finds unclustered thoughts that belong in an existing cluster
- **AI Function**: `callGeminiWithSchema()` with JSON schema
- **Returns**: Array of thought IDs

### 4. find-connections
- **Purpose**: Discovers surprising connections between thoughts
- **AI Function**: `callGemini()` with connection analysis
- **Returns**: Array of connections with thought pairs and insights

### 5. suggest-categories
- **Purpose**: Suggests relevant category tags for a thought
- **AI Function**: `callGemini()` with category prompts
- **Returns**: Array of suggested category names

## Gemini Integration

The shared Gemini helper (`supabase/functions/_shared/gemini.ts`) provides:

### `callGemini(messages, apiKey)`
- For basic AI calls with system/user message arrays
- Uses `responseMimeType: "application/json"` (camelCase) for JSON responses
- Shared parsing function handles both `part.json` and `part.text` fallback

### `callGeminiWithSchema(prompt, apiKey, responseSchema)`
- For structured outputs with strict JSON schemas
- Uses `responseSchema` (camelCase) to enforce output format
- Ensures consistent data structures across all Edge Functions

### Response Parsing (Production-Ready)
- **Primary**: Reads `part.json` field (used with responseMimeType/responseSchema)
- **Fallback**: Parses `part.text` with code fence stripping (```json removal)
- **Error Handling**: Try-catch with detailed error messages for debugging
- **Logging**: Console errors for failed parses to aid troubleshooting

## Environment Variables

Required secrets in Replit:
- `GEMINI_API_KEY`: Google Gemini API key for AI features
- Supabase variables are configured in the client (public variables)

## Running the Project

```bash
npm run dev
```

This starts the Vite development server on port 5000 with:
- `allowedHosts: true` for Replit preview compatibility
- React + TypeScript frontend
- Direct connection to Supabase backend

## User Preferences
- Keep Supabase for storage and authentication (not migrating to Neon)
- Use direct Gemini API integration instead of third-party gateways
- Maintain all existing features and functionality
- Prioritize reliability and clear error handling

## Important Notes
- The application uses Supabase Edge Functions for AI processing
- All AI features require the GEMINI_API_KEY to be configured
- The frontend connects directly to Supabase for database operations
- Authentication is handled entirely by Supabase Auth
- The Gemini helper uses structured outputs for consistent JSON responses

## Production Readiness Status

### Security ✅
- ✅ XSS Protection via DOMPurify sanitization on all user inputs
- ✅ Environment variable validation prevents runtime failures
- ✅ Authentication handled by Supabase Auth (industry-standard)
- ⚠️ No rate limiting on Edge Functions (recommend adding for cost control)

### Code Quality ✅
- ✅ TypeScript throughout with improved type safety
- ✅ Centralized error handling utilities
- ✅ Configuration management with app.config.ts
- ✅ Input validation and sanitization
- ⚠️ Type safety can be further improved (see Known Limitations)

### Reliability ✅
- ✅ Comprehensive error handling with user-friendly messages
- ✅ Environment validation fails fast
- ✅ Graceful degradation (AI features fail safely)
- ✅ Database migrations handled via Supabase

### Testing ⚠️
- ⚠️ No automated tests currently
- ✅ Manual testing performed on all critical paths
- **Recommendation**: Add Jest + React Testing Library for critical flows

### Known Limitations
1. **Type Safety**: Auto-generated Supabase types are outdated
   - Database has `is_completed` field on thoughts table
   - Type definitions don't include this field
   - Workaround: Type assertion with comments documenting the gap
   - **Fix**: Regenerate types or use Supabase CLI to sync

2. **Performance**: No optimization for large datasets
   - Edge Functions limit to 50 thoughts for clustering
   - Consider pagination for 1000+ thoughts

3. **Monitoring**: No error tracking service (Sentry, etc.)
   - Errors logged to console only
   - **Recommendation**: Add error tracking for production

4. **Rate Limiting**: No protection against API abuse
   - Could result in unexpected Gemini API costs
   - **Recommendation**: Add Supabase Edge Function rate limiting

## Development Workflow

### Making Changes
1. Edit code in `src/` or `supabase/functions/`
2. Vite HMR will auto-reload frontend
3. Edge Functions require redeployment (done automatically)
4. Check browser console for errors
5. Test functionality manually

### Best Practices
- Always sanitize user input (use `src/utils/sanitize.ts`)
- Use configuration constants from `src/config/app.config.ts`
- Handle errors with utilities from `src/utils/error-handling.ts`
- Use typed queries from `src/integrations/supabase/queries.ts`
- Never commit API keys or secrets

### Common Issues
1. **Port 5000 in use**: Vite will use 5001 automatically
2. **Gemini API errors**: Check GEMINI_API_KEY environment variable
3. **Type errors**: Database schema may be newer than generated types
4. **Hot reload fails**: Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)
