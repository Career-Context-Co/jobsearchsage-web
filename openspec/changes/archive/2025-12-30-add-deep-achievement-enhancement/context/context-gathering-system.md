# XYZ Resume Bullet Context Gathering System

## Overview

This system uses two AI prompts that work iteratively to gather context and write achievement-focused resume bullets following Google's XYZ method: **"Accomplished [X] as measured by [Y] by doing [Z]"**

The process is:
1. **Prompt 1** (Context Gathering) - Called multiple times to ask questions and gather information
2. **Prompt 2** (Bullet Writing) - Called once with all gathered context to write polished bullets

## Schema Design Philosophy

### Why Two Prompts?

**Prompt 1** needs to be iterative and intelligent:
- Asks clarifying questions based on what's missing
- Decides when it has enough information
- Keeps track of conversation history
- Can be called 2-5 times typically

**Prompt 2** needs to be single-execution and high-quality:
- Takes all gathered context at once
- Writes 3-5 polished bullets
- Called only once per job position
- Focuses on writing quality, not information gathering

### Key Design Decision: Story-Based Context

We group information by **stories** (projects, achievements, initiatives) rather than splitting metrics, methods, and accomplishments into separate arrays. This preserves the coherent narrative and prevents the AI from having to guess which metric belongs to which achievement.

**Bad approach:**
```json
{
  "achievements": ["Built dashboard", "Presented to stakeholders"],
  "metrics": ["50K records", "20 users", "Presented to leadership"],
  "methods": [".NET Core", "Chart.js", "Created presentation"]
}
```
*Problem: Which metrics go with which achievement?*

**Good approach:**
```json
{
  "stories": [
    {
      "accomplishment": "Built dashboard",
      "metrics": ["50K records", "20 users"],
      "methods": [".NET Core", "Chart.js"]
    },
    {
      "accomplishment": "Presented to stakeholders",
      "metrics": ["Presented to leadership"],
      "methods": ["Created live demonstration"]
    }
  ]
}
```
*Clear: Each story is self-contained*

---

## Input Schema (Prompt 1)

```typescript
interface ContextGatheringInput {
  // Core job information
  job: {
    title: string;                    // e.g., "Software Engineering Intern"
    employer: string;                 // e.g., "Citigroup"
    employmentType: "full-time" | "part-time" | "contract" | "internship";
    startDate?: string;               // e.g., "2023-06"
    endDate?: string | null;          // null = current position
    summary?: string;                 // Optional role summary
    highlights?: string[];            // Existing bullets from their resume
  };
  
  // Iteration tracking
  iteration: number;                  // 0 = first call, 1+ = follow-ups
  
  // Conversation history (null on first call)
  previousQA?: {
    questions: string[];              // All questions asked so far
    answers: string[];                // All answers received (parallel array)
  } | null;
  
  // Optional: Job description to tailor towards
  targetJobDescription?: string | null;
}
```

### Input Schema Fields Explained

| Field | Type | Purpose | When Used |
|-------|------|---------|-----------|
| `job.title` | string | User's job title | Always required |
| `job.employer` | string | Company name | Always required |
| `job.employmentType` | enum | Type of work arrangement | Always required |
| `job.startDate` | string | When they started | Optional, useful for timeline context |
| `job.endDate` | string\|null | When they ended (null=current) | Optional |
| `job.summary` | string | Brief role description | Optional, if available |
| `job.highlights` | string[] | Existing resume bullets | Optional, gives starting point |
| `iteration` | number | Which call this is (0, 1, 2...) | Always required |
| `previousQA` | object\|null | Full conversation history | null on first call, populated on subsequent |
| `targetJobDescription` | string\|null | JD they're applying to | Optional, for tailoring |

### Input Example - First Call

```json
{
  "job": {
    "title": "Software Engineering Intern",
    "employer": "Citigroup",
    "employmentType": "internship",
    "startDate": "2023-06",
    "endDate": "2023-08",
    "summary": "",
    "highlights": [
      "Collaborated with Data Analysts and Network Engineers to retrieve specific datasets via SQL",
      "coded a .NET Core single-page application able to retrieve and process telecommunication expense and circuit status data and visualize it as an interactive dashboard of charts and graphs.",
      "showed the benefits and functionalities of the project to all project stakeholders."
    ]
  },
  "iteration": 0,
  "previousQA": null,
  "targetJobDescription": null
}
```

### Input Example - Second Call (Follow-up)

```json
{
  "job": {
    "title": "Software Engineering Intern",
    "employer": "Citigroup",
    "employmentType": "internship",
    "highlights": ["..."]
  },
  "iteration": 1,
  "previousQA": {
    "questions": [
      "How many telecommunication records did your dashboard process?",
      "What specific business problem did this dashboard solve?",
      "Were there any measurable improvements from using your dashboard?",
      "How many people used this dashboard regularly?",
      "Did you work independently on the application or with guidance?"
    ],
    "answers": [
      "About 50,000 records across 200+ office locations",
      "Previously managers had to wait 2-3 days for manual IT reports, this gave them real-time access",
      "Reduced report generation from 2-3 days to real-time, and managers identified cost savings opportunities",
      "About 15 finance managers and 5 IT directors used it regularly",
      "I designed the dashboard layout myself but worked with a senior engineer who reviewed my code"
    ]
  }
}
```

---

## Output Schema (Prompt 1)

```typescript
interface ContextGatheringOutput {
  // Status indicators
  hasEnoughContext: boolean;          // true when ready for writing
  status: "needs_more_context" | "ready";
  
  // Next action
  questions: string[];                // Empty array when ready
  reasoning: string;                  // Why asking these OR why ready
  
  // Progress tracking (when status = "needs_more_context")
  missingElements?: string[] | null;  // What info is still needed
  progressPercentage?: number | null; // 0-100 estimate
  
  // Complete context (when status = "ready")
  readinessNote?: string | null;
  gatheredContext?: {
    // Self-contained stories
    stories: Array<{
      type: "project" | "initiative" | "responsibility" | "achievement";
      summary: string;                // 1-2 sentence overview
      details: {
        accomplishment: string;       // What they did/achieved
        metrics: string[];            // Quantifiable outcomes
        methods: string[];            // How (tools, approaches)
        impact: string;               // Business value
        collaboration?: string;       // Working style, autonomy
        timeline?: string;            // Duration, when
      };
    }>;
    
    // Overall role context
    overallContext: {
      seniorityLevel: "entry-level" | "mid-level" | "senior" | "manager" | "executive";
      confidence: "high" | "medium" | "low";
      reasoning: string;              // Why this level
      workingStyle: string;           // How they operate
      scopeOfInfluence: string;       // Reach/impact
    };
    
    // Cross-cutting information
    skillsUsed: string[];
    domainsOfExpertise?: string[];
  } | null;
}
```

### Output Schema Fields Explained

#### Status Fields (Always Present)

| Field | Type | Purpose |
|-------|------|---------|
| `hasEnoughContext` | boolean | Simple true/false for UI logic |
| `status` | enum | Human-readable status |
| `questions` | string[] | Next questions to ask (empty when done) |
| `reasoning` | string | Explains why asking these questions OR why ready |

#### Progress Fields (When Not Ready)

| Field | Type | Purpose |
|-------|------|---------|
| `missingElements` | string[] | What categories of info still needed |
| `progressPercentage` | number | 0-100 estimate for progress bar |

#### Context Fields (When Ready)

| Field | Type | Purpose |
|-------|------|---------|
| `readinessNote` | string | Summary of what was gathered |
| `gatheredContext` | object | Complete structured context for Prompt 2 |

### The `stories` Array - Core Data Structure

Each story is a **self-contained narrative** about one piece of work:

```typescript
{
  type: "project" | "initiative" | "responsibility" | "achievement",
  summary: "One-sentence overview",
  details: {
    accomplishment: "What they did",
    metrics: ["All metrics for THIS story"],
    methods: ["All tools/approaches for THIS story"],
    impact: "Business value of THIS story",
    collaboration?: "Working relationships for THIS story",
    timeline?: "When/how long for THIS story"
  }
}
```

**Why this structure?**
- ✅ Keeps related information together
- ✅ Prevents confusion about which metric goes with which achievement
- ✅ Easy for Prompt 2 to turn into bullets
- ✅ Can generate 1 bullet per story or combine stories
- ✅ Preserves full context including collaboration and timeline

### The `overallContext` Object

Captures role-level information that applies across all stories:

```typescript
{
  seniorityLevel: "entry-level",      // Determined from all evidence
  confidence: "high",                 // How certain about this assessment
  reasoning: "Why this level",        // Justification
  workingStyle: "Independent with mentorship",
  scopeOfInfluence: "20 users, 2 departments"
}
```

This is critical for Prompt 2 to choose appropriate verbs and framing.

---

## Output Examples

### Example 1: Not Ready (First Call)

```json
{
  "hasEnoughContext": false,
  "status": "needs_more_context",
  "questions": [
    "How many telecommunication records or data points did your dashboard process?",
    "What specific business problem did this dashboard solve for Citigroup?",
    "Were there any measurable improvements from using your dashboard compared to the previous process (e.g., time saved, better decision-making)?",
    "What was the scale of stakeholder usage - how many people or teams used this dashboard?",
    "Did you work independently on the .NET Core application, or were you implementing designs/requirements from senior engineers?"
  ],
  "reasoning": "Need to gather quantifiable metrics (scale, impact), understand business value delivered, and assess the user's level of autonomy to properly scope their contributions for an internship role.",
  "missingElements": [
    "Quantifiable metrics (records processed, users, time savings)",
    "Business impact and value delivered",
    "Level of autonomy and decision-making authority"
  ],
  "progressPercentage": 30
}
```

### Example 2: Not Ready (Second Call - Follow-up)

```json
{
  "hasEnoughContext": false,
  "status": "needs_more_context",
  "questions": [
    "You mentioned managers identified cost savings opportunities - do you know approximately how much money was saved or any specific examples?",
    "What specific technologies did you use beyond .NET Core? (e.g., which charting library, database type, frontend framework)",
    "How long did it take you to build this dashboard from start to finish?"
  ],
  "reasoning": "Have good scale and impact metrics. Need to quantify cost savings if possible, get technical depth for the 'how' component, and understand project timeline. Very close to ready.",
  "missingElements": [
    "Specific cost impact quantification",
    "Complete technical stack details",
    "Project timeline"
  ],
  "progressPercentage": 75
}
```

### Example 3: Ready (Final Call)

```json
{
  "hasEnoughContext": true,
  "status": "ready",
  "questions": [],
  "reasoning": "Sufficient information gathered to write 3-4 strong XYZ bullets with clear metrics, business impact, technical depth, and appropriate scope for an entry-level internship role.",
  "readinessNote": "Ready to write bullets for Software Engineering Intern role with quantified metrics (50K records, 20 users, time savings), business value ($30K cost savings enabled), complete technical stack, and clear collaboration context.",
  "gatheredContext": {
    "stories": [
      {
        "type": "project",
        "summary": "Built real-time telecom expense dashboard that eliminated multi-day reporting delays for 20 stakeholders",
        "details": {
          "accomplishment": "Developed .NET Core single-page application for real-time telecom expense tracking and visualization",
          "metrics": [
            "Processed 50,000 telecom expense records across 200+ office locations",
            "Reduced report generation time from 2-3 days to real-time",
            "Adopted by 20 stakeholders (15 finance managers, 5 IT directors)",
            "Enabled identification of $30K in unused circuit costs",
            "Completed in 8 weeks"
          ],
          "methods": [
            "Built with .NET Core framework",
            "Implemented Chart.js for interactive data visualizations",
            "Integrated React components for dynamic UI",
            "Connected to SQL Server database",
            "Wrote SQL queries in collaboration with Data Analysts",
            "Designed dashboard layout and user experience independently"
          ],
          "impact": "Eliminated waiting period for expense reports, enabling proactive cost management and real-time decision-making for finance team",
          "collaboration": "Worked independently on application development with code reviews from senior engineer. Collaborated with Data Analysts on SQL query optimization and with Network Engineers on data requirements.",
          "timeline": "8 weeks, approximately 25 hours per week"
        }
      },
      {
        "type": "achievement",
        "summary": "Presented technical solution to cross-functional leadership stakeholders",
        "details": {
          "accomplishment": "Demonstrated dashboard functionality and business value to project stakeholders",
          "metrics": [
            "Presented to finance and IT leadership teams"
          ],
          "methods": [
            "Created live demonstration of dashboard features",
            "Explained technical capabilities in business terms",
            "Showcased cost savings potential"
          ],
          "impact": "Successfully communicated technical solution to non-technical audience, leading to stakeholder buy-in and adoption",
          "collaboration": "Solo presentation to senior stakeholders"
        }
      }
    ],
    "overallContext": {
      "seniorityLevel": "entry-level",
      "confidence": "high",
      "reasoning": "Internship role with appropriate level of independent execution on well-defined project scope, combined with mentorship from senior engineers on technical decisions. Implemented solutions rather than architecting system design. Shows strong technical execution within guided parameters.",
      "workingStyle": "Independent contributor on implementation with senior technical mentorship. Comfortable collaborating cross-functionally with Data Analysts and Network Engineers.",
      "scopeOfInfluence": "Individual contributor on single project with direct impact on 20 regular users across Finance and IT departments"
    },
    "skillsUsed": [
      ".NET Core",
      "C#",
      "SQL Server",
      "SQL",
      "Chart.js",
      "React",
      "JavaScript",
      "Data visualization",
      "Single-page applications",
      "Cross-functional collaboration",
      "Stakeholder presentations"
    ],
    "domainsOfExpertise": [
      "Data visualization",
      "Financial reporting systems",
      "Real-time dashboards"
    ]
  }
}
```

---

## How the Schemas Work Together

### Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  User provides job info + existing bullets              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   PROMPT 1 (Call #1)  │
         │   iteration: 0        │
         │   previousQA: null    │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Returns 5-7 questions│
         │  hasEnoughContext: ❌ │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  User answers         │
         │  questions            │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   PROMPT 1 (Call #2)  │
         │   iteration: 1        │
         │   previousQA: filled  │
         └───────────┬───────────┘
                     │
                     ▼
              ┌──────┴──────┐
              │             │
         ┌────▼───┐    ┌────▼────┐
         │More Qs │    │ Ready! ✅│
         │ needed │    │         │
         └────┬───┘    └────┬────┘
              │             │
              │             ▼
              │   ┌──────────────────┐
              │   │  gatheredContext │
              │   │  with stories[]  │
              │   └────────┬─────────┘
              │            │
              ▼            ▼
       ┌──────────────────────────┐
       │   PROMPT 2 (Single Call) │
       │   Takes gatheredContext  │
       │   Returns 3-5 bullets    │
       └──────────────────────────┘
```

### Step-by-Step Process

#### Step 1: Initial Call
```typescript
// UI calls Prompt 1
const input: ContextGatheringInput = {
  job: { /* job data */ },
  iteration: 0,
  previousQA: null
};

const output: ContextGatheringOutput = await callPrompt1(input);

if (!output.hasEnoughContext) {
  // Show questions to user
  displayQuestions(output.questions);
}
```

#### Step 2: User Answers
```typescript
// User provides answers
const answers = getUserAnswers(); // ["Answer 1", "Answer 2", ...]
```

#### Step 3: Follow-up Call
```typescript
// UI calls Prompt 1 again with history
const input2: ContextGatheringInput = {
  job: { /* same job data */ },
  iteration: 1,
  previousQA: {
    questions: output.questions,
    answers: answers
  }
};

const output2: ContextGatheringOutput = await callPrompt1(input2);

if (!output2.hasEnoughContext) {
  // More questions needed, repeat
  displayQuestions(output2.questions);
} else {
  // Ready! Move to writing
  proceedToWriting(output2.gatheredContext);
}
```

#### Step 4: Writing Bullets
```typescript
// UI calls Prompt 2 once
const bulletInput = {
  job: { /* job data */ },
  gatheredContext: output2.gatheredContext, // The complete stories
  targetJobDescription: /* optional JD */
};

const bullets: string[] = await callPrompt2(bulletInput);

// bullets = ["• First bullet", "• Second bullet", ...]
displayBullets(bullets);
```

---


**Handle incomplete answers:**
```typescript
if (answers.some(a => a.trim() === "")) {
  // Prompt 1 will ask more targeted questions
  // Or allow "I don't know" answers
}
```

**Handle LLM errors:**
```typescript
try {
  const output = await callPrompt1(input);
} catch (error) {
  // Retry or show error to user
  // Could fall back to simpler questions
}
```

**Validate output:**
```typescript
if (output.hasEnoughContext) {
  if (!output.gatheredContext?.stories?.length) {
    // Something went wrong, LLM didn't populate context
    throw new Error("Invalid output: missing stories");
  }
}
``

### Cost Optimization

**Cache job data:**
```typescript
// Don't re-send full job.highlights every time
// Prompt 1 can reference "as mentioned in your existing bullets"
```

**Stop early if high quality:**
```typescript
// If progressPercentage hits 90% and user wants to skip
allowEarlyCompletion();
```

**Use cheaper model for Prompt 1:**
```typescript
const prompt1Model = "gpt-4o-mini"; // Cheaper for questions
const prompt2Model = "claude-sonnet-3.5"; // Premium for writing
```

---

## Testing Scenarios

### Test Case 1: Minimal Input
```json
{
  "job": {
    "title": "Marketing Intern",
    "employer": "Startup Inc",
    "employmentType": "internship",
    "highlights": ["Worked on social media"]
  },
  "iteration": 0,
  "previousQA": null
}
```
**Expected:** Many questions (7+), low progress percentage

### Test Case 2: Rich Input
```json
{
  "job": {
    "title": "Senior Product Manager",
    "employer": "Tech Corp",
    "employmentType": "full-time",
    "highlights": [
      "Led product roadmap for authentication platform serving 10M users",
      "Reduced onboarding time by 40% by implementing SSO",
      "Collaborated with engineering team of 8 to deliver 12 features"
    ]
  },
  "iteration": 0,
  "previousQA": null
}
```
**Expected:** Fewer questions (3-5), focus on clarifying metrics, possibly ready after 1 round

### Test Case 3: Vague Answers
```json
{
  "previousQA": {
    "questions": ["How many users?"],
    "answers": ["A lot"]
  }
}
```
**Expected:** Follow-up question: "Can you estimate - was it closer to 100, 1,000, or 10,000 users?"

