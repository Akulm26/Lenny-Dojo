# Lenny's Dojo - Technical Documentation

> **Version:** 1.1.0  
> **Last Updated:** January 2026  
> **Repository:** [ChatPRD/lennys-podcast-transcripts](https://github.com/ChatPRD/lennys-podcast-transcripts)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Core Features](#core-features)
6. [Backend Services](#backend-services)
7. [Edge Functions](#edge-functions)
8. [Data Models](#data-models)
9. [State Management](#state-management)
10. [Authentication](#authentication)
11. [Data Ingestion Pipeline](#data-ingestion-pipeline)
12. [AI Integration](#ai-integration)
13. [Database Schema](#database-schema)
14. [Security Model](#security-model)
15. [Environment Configuration](#environment-configuration)
16. [Deployment](#deployment)
17. [API Reference](#api-reference)

---

## Overview

**Lenny's Dojo** is an AI-powered Product Manager interview preparation application that extracts intelligence from Lenny's Podcast transcripts and simulates realistic PM interviews across 9 interview types.

### Key Capabilities

- **Interview Simulator**: AI-driven practice sessions with personalized feedback
- **Company Intelligence**: Deep-dive analysis of 180+ companies discussed on the podcast
- **Framework Library**: 80+ PM frameworks extracted from podcast discussions
- **Progress Tracking**: Comprehensive dashboard with readiness scoring
- **Automated Sync**: Daily synchronization with podcast transcript repository
- **Dual-Layer Caching**: localStorage for instant loads + database cache for persistence

### Problem Statement

Product Manager candidates lack access to real-world case studies and authentic decision-making scenarios. Lenny's Dojo bridges this gap by mining insights from 303+ podcast episodes featuring top product leaders.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                  │
├─────────────────────────────────────────────────────────────────┤
│  Pages          │  Components       │  Hooks & Contexts         │
│  - Index        │  - Layout         │  - useDojoSync            │
│  - Practice     │  - UI (shadcn)    │  - DojoDataContext        │
│  - Companies    │  - Auth           │  - AuthContext            │
│  - Frameworks   │  - SpotlightSearch│  - useProgressStore       │
│  - Evaluation   │                   │  - useSyncStore           │
│  - Settings     │                   │                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Lovable Cloud (Backend)                      │
├─────────────────────────────────────────────────────────────────┤
│  Edge Functions                │  Database                      │
│  - generate-question           │  - episode_intelligence_cache  │
│  - evaluate-answer             │                                │
│  - extract-intelligence        │  Auth                          │
│  - seed-intelligence-cache     │  - Supabase Auth               │
│  - sync-new-episodes           │  - Email/Password              │
│  - get-cache-status            │                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
├─────────────────────────────────────────────────────────────────┤
│  - GitHub API (transcript repository)                           │
│  - Lovable AI Gateway (Google Gemini models)                    │
│  - Google Gemini API (for sync operations)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | ^18.3.1 | UI Framework |
| Vite | Latest | Build Tool & Dev Server |
| TypeScript | Latest | Type Safety |
| Tailwind CSS | Latest | Styling |
| shadcn/ui | Latest | Component Library |
| React Router | ^6.30.1 | Client-side Routing |
| Zustand | ^5.0.10 | State Management |
| React Query | ^5.83.0 | Server State Management |
| Framer Motion | N/A (CSS) | Animations |

### Backend (Lovable Cloud)

| Technology | Purpose |
|------------|---------|
| Supabase | Database, Auth, Edge Functions |
| PostgreSQL | Data Storage |
| Deno | Edge Function Runtime |
| pg_cron | Scheduled Jobs |

### AI Services

| Model | Use Case |
|-------|----------|
| google/gemini-3-flash-preview | Question generation, Answer evaluation |
| google/gemini-2.5-pro | Complex intelligence extraction |
| Lovable AI Gateway | API abstraction layer |

---

## Project Structure

```
lenny-dojo/
├── public/                     # Static assets
├── src/
│   ├── components/
│   │   ├── auth/               # Authentication components
│   │   │   └── ProtectedRoute.tsx
│   │   ├── layout/             # Layout components
│   │   │   ├── Footer.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   ├── SplashScreen.tsx
│   │   │   ├── SyncIndicator.tsx
│   │   │   └── SyncStatusBar.tsx
│   │   └── ui/                 # shadcn/ui components
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Authentication state
│   │   └── DojoDataContext.tsx # Application data context
│   ├── hooks/
│   │   ├── use-mobile.tsx      # Mobile detection
│   │   ├── use-toast.ts        # Toast notifications
│   │   └── useDojoSync.ts      # Data synchronization
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts       # Supabase client (auto-generated)
│   │       └── types.ts        # Database types (auto-generated)
│   ├── lib/
│   │   └── utils.ts            # Utility functions
│   ├── pages/
│   │   ├── Companies.tsx       # Company directory
│   │   ├── CompanyDetail.tsx   # Company deep-dive
│   │   ├── Evaluation.tsx      # Answer evaluation
│   │   ├── FrameworkDetail.tsx # Framework detail
│   │   ├── Frameworks.tsx      # Framework library
│   │   ├── Index.tsx           # Home page
│   │   ├── Login.tsx           # Authentication
│   │   ├── NotFound.tsx        # 404 page
│   │   ├── Practice.tsx        # Session configuration
│   │   ├── PracticeSession.tsx # Active practice
│   │   ├── Progress.tsx        # Progress dashboard
│   │   ├── Settings.tsx        # App settings
│   │   └── Signup.tsx          # Registration
│   ├── services/
│   │   ├── ai.ts               # AI service layer
│   │   ├── github.ts           # GitHub API integration
│   │   ├── intelligence.ts     # Intelligence aggregation
│   │   ├── intelligenceCache.ts# Cache operations
│   │   ├── practiceService.ts  # Practice session logic
│   │   └── seedCache.ts        # Demo data seeding
│   ├── stores/
│   │   ├── progressStore.ts    # User progress state
│   │   └── syncStore.ts        # Sync metadata state
│   ├── types/
│   │   └── index.ts            # TypeScript definitions
│   ├── App.tsx                 # Root component
│   ├── App.css                 # Global styles
│   ├── index.css               # Tailwind & design tokens
│   └── main.tsx                # Entry point
├── supabase/
│   ├── config.toml             # Supabase configuration
│   └── functions/
│       ├── evaluate-answer/    # Answer evaluation function
│       ├── extract-intelligence/# AI intelligence extraction
│       ├── generate-question/  # Question generation
│       ├── seed-intelligence-cache/ # Demo data seeding
│       └── sync-new-episodes/  # GitHub sync automation
├── .env                        # Environment variables
├── tailwind.config.ts          # Tailwind configuration
├── vite.config.ts              # Vite configuration
└── package.json                # Dependencies
```

---

## Core Features

### 1. Interview Simulator

**Flow:**
1. User configures session (interview types, difficulty, company focus)
2. System fetches random company context from intelligence cache
3. AI generates contextual interview question
4. User submits answer
5. AI evaluates against model answer and guest insights
6. Results displayed with dimensional scoring

**Interview Types (9 total):**
- Behavioral
- Product Sense
- Product Design
- Root Cause Analysis (RCA)
- Guesstimate
- Technical
- AI/ML
- Strategy
- Metrics

**Difficulty Levels:**
- Medium
- Hard
- Expert

### 2. Company Intelligence ("Success Autopsy")

Aggregates insights per company:
- Key decisions and outcomes
- Expert opinions
- Metrics mentioned
- Source episodes
- Question seeds for practice

### 3. Framework Library

Catalogs PM frameworks with:
- TL;DR summary
- Complete overview
- When to use
- Real-world examples
- Source quotes
- Related frameworks

### 4. Progress Tracking

Tracks:
- Questions attempted by type
- Average scores per dimension
- Score trends over time
- Companies practiced
- Readiness score (weighted algorithm)

---

## Backend Services

### Supabase Client

```typescript
// src/integrations/supabase/client.ts (auto-generated)
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```

### Service Layer

#### `services/github.ts`
- Fetches episode list from GitHub repository
- Parses YAML frontmatter from transcripts
- Manages localStorage caching
- Handles sync status tracking

#### `services/intelligence.ts`
- Aggregates company and framework data
- Orchestrates AI extraction
- Manages cache-first loading strategy

#### `services/practiceService.ts`
- Fetches random company contexts
- Invokes question generation
- Handles answer evaluation

#### `services/intelligenceCache.ts`
- CRUD operations on `episode_intelligence_cache`
- Batch fetch/store operations
- Cache statistics

---

## Edge Functions

### 1. `generate-question`

**Purpose:** Generates interview questions based on company context.

**Endpoint:** `POST /functions/v1/generate-question`

**Authentication:** JWT (user token)

**Request:**
```typescript
interface GenerateRequest {
  interviewType: string;
  difficulty: string;
  companyName: string;
  companyContext: string;
  decisions: string[];
  quotes: string[];
  guestName: string;
  episodeTitle: string;
}
```

**Response:**
```typescript
interface GeneratedQuestion {
  id: string;
  type: string;
  difficulty: string;
  company: string;
  question: string;
  situation_brief: string;
  suggested_time_minutes: number;
  follow_ups: string[];
  model_answer: {
    what_happened: string;
    key_reasoning: string;
    key_quote: string;
    frameworks_mentioned: string[];
    full_answer: string;
  };
  source: {
    guest_name: string;
    episode_title: string;
  };
}
```

### 2. `evaluate-answer`

**Purpose:** Evaluates user answers against model answers.

**Endpoint:** `POST /functions/v1/evaluate-answer`

**Authentication:** JWT (user token)

**Request:**
```typescript
interface EvaluateRequest {
  question: string;
  situationBrief: string;
  userAnswer: string;
  modelAnswer: ModelAnswer;
  interviewType: string;
  guestName: string;
  episodeTitle: string;
}
```

**Response:**
```typescript
interface AnswerEvaluation {
  overall_score: number;
  dimension_scores: {
    structure: { score: number; feedback: string };
    insight: { score: number; feedback: string };
    framework_usage: { score: number; feedback: string };
    communication: { score: number; feedback: string };
    outcome_orientation: { score: number; feedback: string };
  };
  strengths: string[];
  improvements: string[];
  missed_from_podcast: string[];
  quote_to_remember: {
    text: string;
    why_it_matters: string;
  };
  encouragement: string;
}
```

### 3. `extract-intelligence`

**Purpose:** Extracts structured intelligence from transcripts using AI.

**Endpoint:** `POST /functions/v1/extract-intelligence`

**Authentication:** Service Role Key

**Request:**
```typescript
interface ExtractRequest {
  transcript: string;
  episodeId: string;
  guestName: string;
  episodeTitle: string;
}
```

### 4. `seed-intelligence-cache`

**Purpose:** Seeds demo data without AI calls.

**Endpoint:** `POST /functions/v1/seed-intelligence-cache`

**Authentication:** Service Role Key

### 5. `sync-new-episodes`

**Purpose:** Automated GitHub sync and AI extraction.

**Endpoint:** `POST /functions/v1/sync-new-episodes`

**Authentication:** Service Role Key OR CRON_SECRET header

**Trigger:** pg_cron job at 2:00 AM UTC daily

### 6. `get-cache-status`

**Purpose:** Returns the count of cached episodes in the database.

**Endpoint:** `POST /functions/v1/get-cache-status`

**Authentication:** None (public read)

**Response:**
```typescript
interface CacheStatus {
  cached: number;      // Number of episodes in cache
  timestamp: string;   // ISO timestamp of check
}
```

---

## Data Models

### Episode

```typescript
interface Episode {
  id: string;
  guest: string;
  title: string;
  youtube_url: string;
  video_id: string;
  description: string;
  duration: string;
  duration_seconds: number;
  view_count: number;
  channel: string;
  transcript: string;
  word_count: number;
  fetched_at: string;
}
```

### CompanyIntelligence

```typescript
interface CompanyIntelligence {
  name: string;
  episode_count: number;
  total_decisions: number;
  total_opinions: number;
  decisions: Decision[];
  opinions: ExpertOpinion[];
  metrics: string[];
  question_seeds: string[];
  episodes: Array<{
    episode_id: string;
    guest_name: string;
    episode_title: string;
    is_guest_company: boolean;
  }>;
}
```

### Framework

```typescript
interface Framework {
  name: string;
  category: FrameworkCategory;
  explanation?: string;
  when_to_use?: string;
  example?: string;
  creator?: string;
  quote?: string;
  mentioned_in: Array<{
    episode_id: string;
    guest_name: string;
    episode_title: string;
  }>;
}
```

### UserProgress

```typescript
interface UserProgress {
  total_questions_attempted: number;
  scores_by_type: Record<InterviewType, TypeProgress>;
  companies_practiced: string[];
  last_practice_at: string | null;
  sessions: PracticeSession[];
}
```

---

## State Management

### Zustand Stores

#### `progressStore.ts`
- Persisted to localStorage as `lenny-dojo-progress`
- Tracks user practice history
- Computes readiness scores
- Generates recommendations

#### `syncStore.ts`
- Persisted to localStorage as `lenny-dojo-sync`
- Tracks sync metadata
- Manages syncing state

### React Context

#### `AuthContext`
- Wraps Supabase Auth
- Provides user/session state
- Exposes signIn/signUp/signOut methods

#### `DojoDataContext`
- Orchestrates data loading via `useDojoSync` hook
- Provides companies/frameworks/episodes
- Manages sync operations
- **Dual-layer loading strategy:**
  1. First renders from localStorage for instant display
  2. Background-refreshes from database cache to ensure freshness
  3. Overwrites localStorage with authoritative database data

---

## Authentication

### Implementation

- **Provider:** Supabase Auth
- **Method:** Email/Password
- **Auto-confirm:** Enabled (non-production)

### Protected Routes

```typescript
// src/components/auth/ProtectedRoute.tsx
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  
  return children;
}
```

### Protected Pages

- `/practice` - Interview simulator
- `/practice/session` - Active practice
- `/practice/evaluate` - Evaluation results
- `/companies` - Company directory
- `/companies/:slug` - Company detail
- `/frameworks` - Framework library
- `/frameworks/:slug` - Framework detail

---

## Data Ingestion Pipeline

### Source Repository

**GitHub:** `ChatPRD/lennys-podcast-transcripts`

**Structure:**
```
episodes/
├── episode-001/
│   └── transcript.md
├── episode-002/
│   └── transcript.md
└── ...
```

### Transcript Format

```yaml
---
guest: "Guest Name"
title: "Episode Title"
youtube_url: "https://youtube.com/..."
video_id: "abc123"
description: "Episode description"
duration: "1:23:45"
duration_seconds: 5025
view_count: 123456
channel: "Lenny's Podcast"
---

[Transcript content...]
```

### Sync Process

1. **Check for updates** - Compare latest commit SHA
2. **Fetch episode list** - List `episodes/` directory
3. **Identify new episodes** - Compare with cached IDs
4. **Process new episodes:**
   - Fetch transcript content
   - Parse YAML frontmatter
   - Extract intelligence via AI
   - Cache results in database
5. **Update sync metadata**

### Automated Sync (pg_cron)

```sql
SELECT cron.schedule(
  'sync-new-episodes-daily',
  '0 2 * * *',  -- 2:00 AM UTC daily
  $$
  SELECT net.http_post(
    url := 'https://[project].supabase.co/functions/v1/sync-new-episodes',
    headers := '{"x-cron-secret": "[CRON_SECRET]"}'::jsonb
  );
  $$
);
```

---

## AI Integration

### Lovable AI Gateway

**Endpoint:** `https://ai.gateway.lovable.dev/v1/chat/completions`

**Authentication:** `LOVABLE_API_KEY` (server-side only)

**Supported Models:**
- `google/gemini-3-flash-preview` (primary)
- `google/gemini-2.5-pro`
- `google/gemini-2.5-flash`

### Direct Gemini API

Used by `sync-new-episodes` function for:
- Cost efficiency on batch operations
- Independent rate limiting

**Authentication:** `GOOGLE_GEMINI_API_KEY`

### Error Handling

| Code | Meaning | Action |
|------|---------|--------|
| 402 | Credits exhausted | Inform user, pause operations |
| 429 | Rate limited | Exponential backoff retry |
| 500 | Server error | Retry with backoff |

---

## Database Schema

### Table: `episode_intelligence_cache`

```sql
CREATE TABLE public.episode_intelligence_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id TEXT NOT NULL UNIQUE,
  guest_name TEXT NOT NULL,
  episode_title TEXT NOT NULL,
  intelligence JSONB NOT NULL,
  extracted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for episode lookups
CREATE INDEX idx_episode_id ON episode_intelligence_cache(episode_id);
```

### Intelligence JSONB Structure

```typescript
interface CachedIntelligence {
  companies: Array<{
    name: string;
    is_guest_company: boolean;
    decisions: Decision[];
    opinions: ExpertOpinion[];
    metrics: string[];
  }>;
  frameworks: Array<{
    name: string;
    category: string;
    explanation: string;
    when_to_use: string;
    example: string;
    creator: string;
    quote: string;
  }>;
  question_seeds: string[];
  memorable_quotes: Array<{
    text: string;
    context: string;
    speaker: string;
  }>;
  _source: {
    episode_id: string;
    guest_name: string;
    episode_title: string;
    extraction_method: string;
    extracted_at: string;
  };
}
```

---

## Security Model

### Row Level Security (RLS)

```sql
-- Authenticated users can read
CREATE POLICY "Authenticated users can read intelligence cache"
ON episode_intelligence_cache FOR SELECT
USING (auth.role() = 'authenticated');

-- Service role for writes
CREATE POLICY "Service role can insert intelligence cache"
ON episode_intelligence_cache FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update intelligence cache"
ON episode_intelligence_cache FOR UPDATE
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete intelligence cache"
ON episode_intelligence_cache FOR DELETE
USING (auth.role() = 'service_role');
```

### Edge Function Authentication

| Function | Auth Method |
|----------|-------------|
| generate-question | JWT (user token) |
| evaluate-answer | JWT (user token) |
| extract-intelligence | Service Role Key |
| seed-intelligence-cache | Service Role Key |
| sync-new-episodes | Service Role Key OR CRON_SECRET |
| get-cache-status | None (public read) |

### Input Validation

All edge functions implement:
- String length limits
- Type validation
- Control character sanitization
- Array size limits

---

## Environment Configuration

### Frontend (.env)

```env
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[anon-key]
VITE_SUPABASE_PROJECT_ID=[project-id]
```

### Backend Secrets (Supabase)

| Secret | Purpose |
|--------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin database access |
| `SUPABASE_ANON_KEY` | Public API key |
| `LOVABLE_API_KEY` | Lovable AI Gateway |
| `GOOGLE_GEMINI_API_KEY` | Direct Gemini API |
| `CRON_SECRET` | Cron job authentication |
| `ANTHROPIC_API_KEY` | (Reserved) |

---

## Deployment

### Lovable Platform

1. **Automatic Deployment:** All commits trigger deployment
2. **Preview URL:** `https://id-preview--[project-id].lovable.app`
3. **Published URL:** `https://[custom-domain].lovable.app`

### Edge Function Deployment

Edge functions deploy automatically when:
- Code is committed to `supabase/functions/`
- Manual deployment triggered via Lovable

### Database Migrations

Managed via Lovable migration tool:
- Creates SQL migration files
- Requires user approval
- Auto-updates TypeScript types

---

## API Reference

### GitHub Service

```typescript
// Fetch list of episode IDs
fetchEpisodeList(): Promise<string[]>

// Fetch and parse single episode
fetchAndParseEpisode(episodeId: string): Promise<Episode>

// Check for repository updates
checkForUpdates(): Promise<{ hasUpdates: boolean; sha: string; date: string }>

// Local storage operations
getSyncStatus(): SyncStatus
updateSyncStatus(updates: Partial<SyncStatus>): void
getStoredCompanies<T>(): T[]
storeCompanies<T>(companies: T[]): void
getStoredFrameworks<T>(): T[]
storeFrameworks<T>(frameworks: T[]): void
```

### Intelligence Service

```typescript
// Extract intelligence from episodes
extractAllIntelligence(
  episodes: Episode[],
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{ companies: CompanyIntelligence[]; frameworks: Framework[] }>

// Load from cache only
loadCachedCompaniesAndFrameworks(): Promise<{
  companies: CompanyIntelligence[];
  frameworks: Framework[];
}>
```

### Practice Service

```typescript
// Get random company context for practice
getRandomCompanyContext(config: SessionConfig): Promise<CompanyContext | null>

// Generate question via edge function
generateQuestion(
  interviewType: InterviewType,
  difficulty: Difficulty,
  context: CompanyContext
): Promise<GeneratedQuestion>

// Evaluate answer via edge function
evaluateAnswer(params: EvaluateParams): Promise<AnswerEvaluation>
```

---

## Appendix

### Interview Type Metadata

```typescript
const INTERVIEW_TYPE_INFO = {
  behavioral: { label: 'Behavioral', icon: '💬', color: '...' },
  product_sense: { label: 'Product Sense', icon: '🎯', color: '...' },
  product_design: { label: 'Design', icon: '✏️', color: '...' },
  rca: { label: 'RCA', icon: '🔍', color: '...' },
  guesstimate: { label: 'Guesstimate', icon: '📊', color: '...' },
  tech: { label: 'Technical', icon: '⚙️', color: '...' },
  ai_ml: { label: 'AI/ML', icon: '🤖', color: '...' },
  strategy: { label: 'Strategy', icon: '♟️', color: '...' },
  metrics: { label: 'Metrics', icon: '📈', color: '...' },
};
```

### Framework Categories

```typescript
type FrameworkCategory =
  | 'prioritization'
  | 'strategy'
  | 'growth'
  | 'metrics'
  | 'design'
  | 'execution'
  | 'leadership'
  | 'ai_ml';
```

### Readiness Score Algorithm

```typescript
function getReadinessScore(): number {
  const coverage = typesWithAttempts / 9;           // 30% weight
  const depth = questionsAttempted / 50;            // 20% weight
  const performance = averageScore / 10;            // 35% weight
  const trend = improvingTypes / 9;                 // 15% weight
  
  return Math.round(
    (coverage * 0.3 + depth * 0.2 + performance * 0.35 + trend * 0.15) * 100
  );
}
```

---

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

---

## License

This project is proprietary software. All rights reserved.

---

*Documentation generated for Lenny's Dojo v1.1.0*
