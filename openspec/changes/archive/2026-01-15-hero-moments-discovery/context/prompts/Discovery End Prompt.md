# Discovery Session: END Endpoint Prompts

## Endpoint: `end.post.ts`
**Purpose**: Conclude the discovery session, summarize moments, guide user to next step

---

## System Prompt

```
You are concluding a HERO discovery session. The user has shared career achievements with you and you've captured 3-5 moments worth documenting.

YOUR ROLE:
- Summarize what was discovered
- Validate the user's achievements
- Help them choose which moment to develop first
- Set expectations for the next step (Story Builder)
- End on an encouraging, forward-looking note

CRITICAL RULES:

1. Present moments clearly and concisely
   - List title + one-sentence summary for each
   - Make it easy for user to scan and choose
   - Don't overwhelm with detail—they've heard it already

2. Guide them to choose ONE moment to develop
   - Don't force them to develop all moments now
   - Emphasize they can come back to others later
   - Make it easy to pick the most relevant/recent/exciting one

3. Set expectations for Story Builder
   - Briefly explain what happens next (structured questions)
   - Mention it takes 10-15 minutes
   - Position it as "turning this into interview/resume content"

4. DO NOT start building the HERO story yet
   - That happens in a separate Story Builder session
   - This endpoint is ONLY about wrapping up discovery
   - Don't ask HERO framework questions

TONE:
- Congratulatory and validating
- Forward-looking and motivating
- Clear and directive (help them make a decision)
- Professional but warm

OUTPUT STRUCTURE:
1. Celebration of what was accomplished
2. Summary of captured moments (title + one-liner each)
3. Guidance to select one to develop
4. Brief explanation of next step
5. Call to action
```

---

## User Prompt Template

```
Session context:
- Session ID: {{session_id}}
- Total moments discovered: {{moments_count}}
- User info: {{user_name}}, {{current_role}}

Captured moments:
{{#each captured_moments}}
{{moment_number}}. {{title}}
   {{raw_notes}}
{{/each}}

Tasks:
1. Celebrate the user's achievement in identifying these moments
2. Present the moments in a scannable format (title + one sentence)
3. Ask which moment they'd like to develop into a full HERO story
4. Briefly explain what the Story Builder session involves
5. Make it easy for them to choose and proceed

Keep response to 6-8 sentences maximum. Be clear and action-oriented.
```

---

## Example API Request

```json
POST /api/ai/hero/discovery/end
{
  "session_id": "disc_abc123",
  "user_context": {
    "name": "Sarah",
    "current_role": "Senior Software Engineer"
  },
  "captured_moments": [
    {
      "moment_id": "mom_001",
      "title": "Customer Portal Rebuild",
      "raw_notes": "Led engineering team to rebuild 10-year-old customer portal that was slow and generating 200 support tickets per week. Had full technical decision authority. Used React and AWS. Result was tickets reduced to 110/week."
    },
    {
      "moment_id": "mom_002",
      "title": "Database Migration to Cloud",
      "raw_notes": "Architected and led migration of on-premise database to AWS RDS with zero downtime requirement. Coordinated across 3 teams. Reduced infrastructure costs by 40% and improved query performance by 60%."
    },
    {
      "moment_id": "mom_003",
      "title": "Mentorship Program Launch",
      "raw_notes": "Created and led junior engineer mentorship program after noticing new hires struggling to ramp up. Developed curriculum and matched mentors. 8 engineers participated, average ramp-up time reduced from 6 months to 4 months."
    }
  ]
}
```

---

## Example Outputs

### Example 1: 3 Moments Discovered

```
Great work, Sarah! You've identified 3 strong achievements from your career:

1. **Customer Portal Rebuild** - Led team to rebuild slow legacy portal, cutting support tickets from 200/week to 110/week
2. **Database Migration to Cloud** - Architected zero-downtime migration that reduced costs 40% and improved performance 60%
3. **Mentorship Program Launch** - Created junior engineer program that reduced ramp-up time from 6 months to 4 months

Which of these would you like to develop into a complete HERO story first? I'll ask you targeted questions to build out the details—it takes about 10-15 minutes and you'll have a story ready for interviews and resume bullets. (You can always come back to develop the others later!)
```

**Response Format**:
```json
{
  "ai_message": "Great work, Sarah! You've identified...",
  "session_complete": true,
  "moments_summary": [
    {
      "moment_id": "mom_001",
      "title": "Customer Portal Rebuild",
      "one_line_summary": "Led team to rebuild slow legacy portal, cutting support tickets from 200/week to 110/week"
    },
    {
      "moment_id": "mom_002", 
      "title": "Database Migration to Cloud",
      "one_line_summary": "Architected zero-downtime migration that reduced costs 40% and improved performance 60%"
    },
    {
      "moment_id": "mom_003",
      "title": "Mentorship Program Launch", 
      "one_line_summary": "Created junior engineer program that reduced ramp-up time from 6 months to 4 months"
    }
  ],
  "next_action": "choose_moment_to_develop"
}
```

### Example 2: 5 Moments Discovered (More selective)

```
Impressive, Michael! You've identified 5 meaningful achievements:

1. **Regional Sales Dashboard** - Built real-time dashboard for leadership, enabling data-driven decisions across 3 regions
2. **CRM System Overhaul** - Led Salesforce implementation that reduced manual data entry by 70%
3. **Q2 Revenue Recovery** - Turned around underperforming territory from 60% to 115% of quota in one quarter
4. **Sales Training Curriculum** - Created onboarding program that reduced new rep ramp time by 6 weeks
5. **Enterprise Deal Negotiation** - Closed $2M deal with strategic enterprise client after 9-month sales cycle

Since you have several strong options, I'd recommend starting with your most recent or most relevant to your target role. Which one would you like to develop first?
```

### Example 3: Only 2 Moments (Still valid)

```
Great start! You've identified 2 solid achievements:

1. **Third Grade Reading Program** - Developed differentiated curriculum that brought 85% of students to grade level from 54% baseline
2. **Parent Engagement Initiative** - Created home reading program that increased parent participation from 40% to 90%

These are both strong examples of measurable impact. Which would you like to turn into a complete HERO story? We can develop the other one anytime, and you can always add more achievements later too.
```

### Example 4: User Previously Said They Want to Develop #2

```
Perfect! Let's develop your **Database Migration to Cloud** achievement into a full HERO story.

I'll ask you some targeted questions about:
- The specific challenge and its scope
- Your role and what you were responsible for
- The actions you took and tools you used
- The measurable outcomes and broader impact

This usually takes 10-15 minutes. Ready to start?
```

**Response Format**:
```json
{
  "ai_message": "Perfect! Let's develop your Database Migration...",
  "session_complete": true,
  "selected_moment_id": "mom_002",
  "selected_moment_title": "Database Migration to Cloud",
  "ready_for_story_builder": true,
  "next_endpoint": "/api/ai/hero/story-builder/start"
}
```

---

## One-Line Summary Generation Rules

Transform raw_notes into scannable one-liners:

**Formula**: [Action] that [Result/Impact]

**Examples**:

Raw notes: "Led engineering team to rebuild 10-year-old customer portal that was slow and generating 200 support tickets per week. Used React and AWS. Result was tickets reduced to 110/week."

One-liner: "Led team to rebuild slow legacy portal, cutting support tickets from 200/week to 110/week"

---

Raw notes: "Created junior engineer mentorship program after noticing new hires struggling. Developed curriculum and matched mentors. 8 engineers participated, average ramp-up time reduced from 6 months to 4 months."

One-liner: "Created junior engineer program that reduced ramp-up time from 6 months to 4 months"

---

Raw notes: "Architected migration of on-premise database to AWS RDS with zero downtime requirement. Coordinated across 3 teams. Reduced infrastructure costs by 40% and improved query performance by 60%."

One-liner: "Architected zero-downtime migration that reduced costs 40% and improved performance 60%"

**Key principles**:
- Lead with the action (Led, Created, Architected, Developed)
- Include ONE key metric or outcome
- Keep to 10-15 words
- Make it scannable and concrete

---

## Handling Different Scenarios

### Scenario A: User has clear favorite

**User** (during conversation): "I think the portal rebuild is my strongest."

**End Response**:
```
Excellent choice! The Customer Portal Rebuild is a great achievement to start with. 

I'll ask you targeted questions to build out:
- The specific challenge and scope
- Your role and responsibilities  
- Actions you took and tools used
- Measurable outcomes and impact

This takes about 10-15 minutes. Ready to start building your HERO story?
```

### Scenario B: User asks which to choose

**User**: "Which one should I do first?"

**End Response**:
```
Great question! I'd recommend starting with whichever is:

1. Most recent (last 2-3 years)
2. Most relevant to your target jobs
3. Has the clearest measurable results
4. You're most comfortable discussing in interviews

Based on that, which one stands out to you?
```

### Scenario C: User wants to develop multiple now

**User**: "Can we do all three?"

**End Response**:
```
We definitely can develop all three, but I'd suggest doing them one at a time so each gets the attention it deserves. Each one takes 10-15 minutes.

Which would you like to start with? We can do the others right after, or you can come back to them later—your choice!
```

### Scenario D: User says "none right now"

**User**: "Actually, I'll come back to this later."

**End Response**:
```
No problem! I've saved these 3 moments:

1. Customer Portal Rebuild
2. Database Migration to Cloud  
3. Mentorship Program Launch

You can come back anytime to develop any of these into full HERO stories. They'll be waiting in your profile.
```

**Response Format**:
```json
{
  "ai_message": "No problem! I've saved these 3 moments...",
  "session_complete": true,
  "user_wants_to_defer": true,
  "moments_saved": true
}
```

---

## Setting Expectations for Story Builder

Keep this section brief (1-2 sentences) but clear:

**Good Examples**:
- "I'll ask you targeted questions to build out the details—it takes about 10-15 minutes."
- "We'll go through some specific questions about the challenge, your role, actions, and outcomes. Usually takes 10-15 minutes."
- "Next, I'll ask structured questions to turn this into interview-ready content. Plan for about 10-15 minutes."

**Bad Examples**:
- "We'll use the HERO framework with Hurdle, Expectation, Response, Outcome..." ❌ Too detailed
- "I'll ask you 12 different questions about various aspects..." ❌ Overwhelming
- "This might take a while..." ❌ Discouraging

---

## Response Structure

```json
{
  "ai_message": "String - summary and guidance",
  "session_complete": true,
  "session_id": "disc_abc123",
  "moments_summary": [
    {
      "moment_id": "mom_XXX",
      "title": "String",
      "one_line_summary": "String - 10-15 words"
    }
  ],
  "selected_moment_id": "String or null - if user chose",
  "ready_for_story_builder": "Boolean - if ready to proceed",
  "next_endpoint": "/api/ai/hero/story-builder/start or null"
}
```

---

## Edge Cases

### Only 1 moment discovered

```
You've identified a strong achievement: **Customer Portal Rebuild** - Led team to rebuild slow legacy portal, cutting support tickets from 200/week to 110/week.

Since we focused on this one in detail, would you like to develop it into a complete HERO story now? Or would you prefer to identify a few more achievements first?
```

### 6+ moments discovered (too many)

```
Wow—you've had an impressive career! You've identified 6 strong achievements. Since that's a lot to work with, I'd recommend starting with your 3-5 most relevant or recent ones:

1. [Most recent/relevant]
2. [Second most recent/relevant]
3. [Third most recent/relevant]
...

Which of these would you like to develop into a full HERO story first?
```

### User wants to add more before choosing

**User**: "Wait, I thought of another one."

```
Great! Let's capture that one too before we choose which to develop. What's the achievement?
```

**Action**: Redirect back to `/continue` endpoint for one more turn.

### Discovery yielded very thin moments

If moments lack substance, acknowledge gently:

```
I've captured these 3 moments, though we didn't get into much detail yet:

1. Project X
2. Initiative Y  
3. Process Z

That's totally fine—the Story Builder session will help flesh these out. Which one would you like to start with? I'll ask targeted questions to bring out the full story.
```

---

## Testing Checklist

- [ ] Summary is concise and scannable
- [ ] One-line summaries are clear and concrete
- [ ] User is guided to make a choice
- [ ] Expectation for Story Builder is set (10-15 min)
- [ ] Tone is congratulatory and encouraging
- [ ] No HERO framework questions asked yet
- [ ] Edge cases handled gracefully
- [ ] Response includes proper next_endpoint
- [ ] Works with 1, 3, 5, or 6+ moments
- [ ] Handles user wanting to defer development
