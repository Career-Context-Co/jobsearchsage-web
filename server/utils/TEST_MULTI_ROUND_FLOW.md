# Multi-Round Context Gathering Flow - Test Guide

## Overview

This guide demonstrates how to test the refactored multi-round context gathering and bullet generation flow.

## API Changes Summary

### 1. `POST /api/career-id/profile/:profileId/experience/:id/gather-context`

**Request (Initial Call):**
```json
{
  "experience": {
    "title": "Software Engineer",
    "employer": "Acme Corp",
    "employmentType": "full_time",
    "startDate": "2022-01-01",
    "endDate": "2023-12-31",
    "currentPosition": false,
    "highlights": [
      "Built a dashboard",
      "Improved performance"
    ],
    "summary": "Worked on customer-facing applications"
  }
}
```

**Response (Initial):**
```json
{
  "success": true,
  "data": {
    "questions": [
      { "id": "q1", "text": "What were your primary responsibilities..." },
      { "id": "q2", "text": "How many users did the dashboard serve?" },
      ...
    ],
    "notes": []
  }
}
```

**Request (Follow-up Call):**
```json
{
  "experience": {
    "title": "Software Engineer",
    "employer": "Acme Corp",
    "employmentType": "full_time"
  },
  "context": {
    "notes": [],
    "answeredQuestions": [
      { "id": "q1", "answer": "I was responsible for building customer dashboards and optimizing performance" },
      { "id": "q2", "answer": "About 500 users across 20 departments" },
      ...
    ]
  }
}
```

**Response (Follow-up):**
```json
{
  "success": true,
  "data": {
    "questions": [
      { "id": "q8", "text": "What specific metrics improved from your performance work?" },
      { "id": "q9", "text": "What technologies did you use for the dashboard?" },
      ...
    ],
    "notes": [
      {
        "title": "Customer Dashboard Project",
        "text": "Built analytics dashboard [ACCOMPLISHMENT] serving 500 users across 20 departments [SCOPE]...",
        "type": "project"
      }
    ]
  }
}
```

**Final Response (When context is complete):**
```json
{
  "success": true,
  "data": {
    "questions": [],
    "notes": [
      {
        "title": "Customer Dashboard Project",
        "text": "Built analytics dashboard [ACCOMPLISHMENT] for 500 users across 20 departments [SCOPE]. Used React and Node.js [METHODS]. Reduced load time from 5s to 1s [METRICS], improving user productivity by 40% [IMPACT]. Led 3-person team [COLLABORATION/AUTONOMY]. Completed in 4 months [TIMELINE].",
        "type": "project"
      },
      {
        "title": "Performance Optimization Initiative",
        "text": "Optimized database queries [ACCOMPLISHMENT]...",
        "type": "initiative"
      }
    ]
  }
}
```

### 2. `POST /api/career-id/profile/:profileId/experience/:id/enhance-achievements`

**Request:**
```json
{
  "experience": {
    "title": "Software Engineer",
    "employer": "Acme Corp",
    "employmentType": "full_time"
  },
  "notes": [
    {
      "title": "Customer Dashboard Project",
      "text": "Built analytics dashboard [ACCOMPLISHMENT] for 500 users across 20 departments [SCOPE]. Used React and Node.js [METHODS]. Reduced load time from 5s to 1s [METRICS], improving user productivity by 40% [IMPACT].",
      "type": "project"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bullets": [
      {
        "primary": "Built React-based analytics dashboard serving 500 users across 20 departments, improving productivity by 40% through 80% load time reduction (5s to 1s) using Node.js backend optimization",
        "secondary": "Developed customer analytics dashboard with React and Node.js, reducing page load times by 80% and serving 500 cross-departmental users"
      }
    ]
  }
}
```

## Test Scenarios

### Scenario 1: Single Round (User provides complete answers)

1. Call `gather-context` with experience data (no context)
2. Receive initial questions
3. Call `gather-context` with all answered questions
4. Receive complete notes with empty questions array
5. Call `enhance-achievements` with final notes
6. Receive structured bullet pairs

### Scenario 2: Multi-Round (Iterative refinement)

1. Call `gather-context` with experience data (no context)
2. Receive initial questions
3. Call `gather-context` with partial answers
4. Receive follow-up questions + partial notes
5. Call `gather-context` with more answers
6. Receive final notes with empty questions array
7. Call `enhance-achievements` with final notes
8. Receive structured bullet pairs

### Scenario 3: Minimal Highlights

1. Call `gather-context` with experience having empty highlights array
2. Verify questions focus on general role context and discovery
3. Continue multi-round flow normally

## Manual Testing with curl

### Round 1: Initial Questions
```bash
curl -X POST http://localhost:3000/api/career-id/profile/[profileId]/experience/[id]/gather-context \
  -H "Content-Type: application/json" \
  -d '{
    "experience": {
      "title": "Software Engineer",
      "employer": "Acme Corp",
      "employmentType": "full_time",
      "highlights": ["Built dashboard", "Improved performance"]
    }
  }'
```

### Round 2: Follow-up Questions
```bash
curl -X POST http://localhost:3000/api/career-id/profile/[profileId]/experience/[id]/gather-context \
  -H "Content-Type: application/json" \
  -d '{
    "experience": {
      "title": "Software Engineer",
      "employer": "Acme Corp",
      "employmentType": "full_time"
    },
    "context": {
      "notes": [],
      "answeredQuestions": [
        { "id": "q1", "answer": "I built customer-facing dashboards" },
        { "id": "q2", "answer": "About 500 users" }
      ]
    }
  }'
```

### Generate Bullets
```bash
curl -X POST http://localhost:3000/api/career-id/profile/[profileId]/experience/[id]/enhance-achievements \
  -H "Content-Type: application/json" \
  -d '{
    "experience": {
      "title": "Software Engineer",
      "employer": "Acme Corp",
      "employmentType": "full_time"
    },
    "notes": [
      {
        "title": "Customer Dashboard Project",
        "text": "Built analytics dashboard [ACCOMPLISHMENT] for 500 users [SCOPE]. Used React [METHODS]. Reduced load time by 80% [METRICS].",
        "type": "project"
      }
    ]
  }'
```

## Expected Behavior

### Context Gathering
- **First call**: Returns comprehensive questions across all tiers (general, deep dive, discovery)
- **Follow-up calls**: Returns targeted questions to fill gaps + updated story notes
- **Final call**: Returns empty questions array + complete story notes with inline tags

### Bullet Generation
- Accepts story notes with inline tags
- Returns array of `{ primary, secondary }` pairs
- Each pair offers two variations of the same story
- Primary emphasizes strongest metrics/impact
- Secondary emphasizes different angle (technical depth, scope, etc.)

## Validation Tests

1. ✅ Empty highlights allowed in experience
2. ✅ Context object validates notes and answeredQuestions structure
3. ✅ Notes must be non-empty array for bullet generation
4. ✅ Question IDs are sequential and never reused (q1, q2, q3...)
5. ✅ Story notes include proper inline tags
6. ✅ Bullet pairs have both primary and secondary fields

## Breaking Changes for Frontend

⚠️ **Frontend must be updated to handle:**
1. `gather-context` now returns `{ questions, notes }` instead of just `{ questions }`
2. Frontend must track and send context object on follow-up calls
3. `enhance-achievements` expects `{ notes }` instead of `{ answers }`
4. `enhance-achievements` returns `{ bullets: [{ primary, secondary }] }` instead of `{ bullets: string[] }`
5. Multi-round conversation flow requires state management for context

