# Hero Story Session Data Structure

This document defines the structure of the `session_data` JSONB column in the `hero_story_sessions` table.

## Overview

Each hero story session tracks a conversational AI enhancement for **one section** of a HERO story. The session data contains the full conversation history, context, and final output.

## JSONB Schema

```typescript
interface HeroStorySessionData {
  conversation_history: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  
  moment_context?: {
    title: string
    description?: string | null
  }
  
  source_experience?: {
    id: number
    title: string
    employer: string
    employment_type: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship'
    start_date: string
    end_date?: string | null
    current_position: boolean
    summary?: string | null
    highlights: string[]
    context_notes?: string | null
    location?: string
    location_type?: 'on_site' | 'remote' | 'hybrid'
  }
  
  current_field_values: {
    field1: string | null
    field2: string | null
    field3: string | null
  }
  
  final_output?: {
    field1: string
    field2: string
    field3: string
  }
}
```

## Field Mappings by Section

### Hurdle Section
- `field1` = `problem`
- `field2` = `scope`
- `field3` = `stakes`

### Expectation Section
- `field1` = `role`
- `field2` = `goals`
- `field3` = `constraints`

### Response Section
- `field1` = `actions`
- `field2` = `tools`
- `field3` = `challenges`

### Outcome Section
- `field1` = `deliverable`
- `field2` = `metrics`
- `field3` = `impact`

## Example Session Data

### Active Session (Hurdle Enhancement)

```json
{
  "conversation_history": [
    {
      "role": "assistant",
      "content": "I see you're working on 'Reduced authentication latency by 80%' from your role as Senior Backend Engineer. Let's start with the PROBLEM. What specific issue with authentication were you seeing?"
    },
    {
      "role": "user",
      "content": "Login was taking 8-10 seconds and users were complaining"
    },
    {
      "role": "assistant",
      "content": "Got it - 8-10 second login times. What was causing this? Was it database queries, API calls, network issues, or were you still diagnosing?"
    }
  ],
  "moment_context": {
    "title": "Reduced authentication latency by 80%",
    "description": "Optimized slow login system that was blocking team productivity"
  },
  "source_experience": {
    "id": 123,
    "title": "Senior Backend Engineer",
    "employer": "TechCorp",
    "employment_type": "full_time",
    "start_date": "2022-03-01",
    "end_date": null,
    "current_position": true,
    "summary": "Led backend infrastructure improvements for core authentication services",
    "highlights": [
      "Reduced API response time by 60%",
      "Implemented caching layer serving 1M+ requests/day"
    ],
    "context_notes": "Focus on performance optimization and scalability. Work often involved database query optimization and distributed caching strategies.",
    "location": "San Francisco, CA",
    "location_type": "hybrid"
  },
  "current_field_values": {
    "field1": null,
    "field2": null,
    "field3": null
  }
}
```

### Completed Session (Hurdle Enhancement)

```json
{
  "conversation_history": [
    {
      "role": "assistant",
      "content": "I see you're working on 'Reduced authentication latency by 80%'..."
    },
    {
      "role": "user",
      "content": "Login was taking 8-10 seconds..."
    },
    {
      "role": "assistant",
      "content": "Great, I have a clear picture. Here's what I learned: [summary]"
    },
    {
      "role": "user",
      "content": "Yes that's good"
    }
  ],
  "moment_context": {
    "title": "Reduced authentication latency by 80%",
    "description": "Optimized slow login system"
  },
  "source_experience": {
    "id": 123,
    "title": "Senior Backend Engineer",
    "employer": "TechCorp",
    "employment_type": "full_time",
    "start_date": "2022-03-01",
    "end_date": null,
    "current_position": true,
    "summary": "Led backend infrastructure improvements",
    "highlights": ["Reduced API response time by 60%"],
    "context_notes": "Performance optimization focus",
    "location": "San Francisco, CA",
    "location_type": "hybrid"
  },
  "current_field_values": {
    "field1": null,
    "field2": null,
    "field3": null
  },
  "final_output": {
    "field1": "Authentication system took 8-10 seconds per login due to inefficient database queries and lack of caching",
    "field2": "Affected entire 25-person engineering team plus all internal tools users, occurring on every login attempt multiple times daily",
    "field3": "Blocked daily development workflows and significantly reduced team productivity across the organization"
  }
}
```

## Usage Notes

1. **Conversation History**: Append-only array. New messages are pushed to the end as the conversation progresses.

2. **Moment Context**: Populated from the hero moment if the story was created from "Develop into HERO Story" flow.

3. **Source Experience**: Full experience object provides rich context for the AI to ask informed questions. Includes summary, highlights, and context_notes from previous enhancement sessions.

4. **Current Field Values**: Captured at session start to know what the user had already filled in (may all be null if starting from scratch).

5. **Final Output**: Only populated when `session_status` is 'completed'. Contains the three extracted fields that can be accepted into the form.

## Querying Examples

### Get active sessions for a story
```sql
SELECT * FROM public.hero_story_sessions
WHERE story_id = 'story_abc123'
  AND session_status = 'active';
```

### Get conversation history for a session
```sql
SELECT session_data->'conversation_history' as conversation
FROM public.hero_story_sessions
WHERE id = 42;
```

### Get all completed Hurdle enhancements for a profile
```sql
SELECT * FROM public.hero_story_sessions
WHERE profile_id = 'profile_xyz'
  AND section_type = 'hurdle'
  AND session_status = 'completed';
```
