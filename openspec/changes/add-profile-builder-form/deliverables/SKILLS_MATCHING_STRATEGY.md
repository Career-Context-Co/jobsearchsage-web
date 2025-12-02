# Skills Matching Strategy

## Architecture: "Accept Anything, Match Later"

### User Flow

1. **User adds skills** → Free-form text input (e.g., "React.js", "ReactJS", "react")
2. **Immediate insert** → Stored in `profile_skills` with `skill_id = NULL`
3. **Background job** → Matches to canonical skills in `reference.skills` later
4. **Display** → Always shows `name` field (what user typed)

### Why This Approach?

✅ **Fast UX** - User doesn't wait for validation/matching  
✅ **No blocking errors** - User never sees "skill not found"  
✅ **Handles variants** - "React", "React.js", "ReactJS" all accepted  
✅ **Better matching** - Background job has time for fuzzy matching, AI, etc.  
✅ **Resume imports** - Bulk import skills from parsed resumes easily

### Schema Design

```sql
CREATE TABLE career_id.profile_skills (
  id INTEGER PRIMARY KEY,
  profile_id TEXT REFERENCES profiles(id),
  skill_id INTEGER REFERENCES reference.skills(id) NULL,  -- NULL until matched
  name TEXT NOT NULL,  -- What user typed, always displayed
  proficiency_level TEXT,
  years_experience NUMERIC(4,1),
  display_order INTEGER DEFAULT 0
);

-- Unique constraint only applies when matched (skill_id NOT NULL)
CREATE UNIQUE INDEX idx_profile_skills_unique 
  ON career_id.profile_skills(profile_id, skill_id) 
  WHERE skill_id IS NOT NULL;
```

### Duplicate Prevention

**Checked on insert:**
- Duplicates within request (case-insensitive)
- Duplicates against existing `name` in profile (case-insensitive)

**Example:**
```json
POST /api/career-id/profile/:profileId/skills
[
  { "skillName": "React" },
  { "skillName": "react" }  // ❌ Rejected: duplicate in request
]
```

If profile already has "React", adding "REACT" will be rejected.

### Background Matching Job (Future Implementation)

**File:** `server/jobs/match-skills.ts` (to be created)

**Logic:**
1. Find unmatched skills (`WHERE skill_id IS NULL`)
2. For each skill:
   - Try exact match (case-insensitive)
   - Try fuzzy match using `pg_trgm` extension
   - Try alias match
   - Create new canonical skill if no match
3. Update `skill_id` when matched

**Example:**
```typescript
// Pseudo-code for background job
async function matchUnlinkedSkills() {
  const unmatched = await db.profile_skills
    .select()
    .whereNull('skill_id')
    .limit(100);
  
  for (const profileSkill of unmatched) {
    // 1. Try exact match
    let match = await db.reference_skills
      .where('skill_name', 'ilike', profileSkill.name)
      .first();
    
    // 2. Try fuzzy match
    if (!match) {
      match = await db.rpc('fuzzy_skill_match', {
        search: profileSkill.name,
        threshold: 0.8
      });
    }
    
    // 3. Create new canonical skill
    if (!match) {
      match = await db.reference_skills.insert({
        skill_name: normalizeSkillName(profileSkill.name),
        category: inferCategory(profileSkill.name)
      }).returning('*');
    }
    
    // 4. Link it
    await db.profile_skills
      .update({ skill_id: match.id })
      .where('id', profileSkill.id);
  }
}
```

### API Endpoints

#### Profile Skills (User-facing)
- `GET /api/career-id/profile/:profileId/skills` - Returns all skills (uses `name` field)
- `POST /api/career-id/profile/:profileId/skills` - Accepts free-form text, inserts with `skill_id=NULL`
- `PATCH /api/career-id/profile/:profileId/skills` - Partial update of metadata only (only updates provided fields)
- `DELETE /api/career-id/profile/:profileId/skills` - Bulk delete by IDs

#### Reference Skills (Internal)
- `GET /api/reference/skills/search?q=react` - Autocomplete suggestions (optional UX)
- `POST /api/reference/skills/lookup` - Used by background job for matching

### Display Logic

Frontend always displays `name` field:

```typescript
// API returns:
{
  "id": 123,
  "skill_id": null,  // Not yet matched
  "name": "React.js",  // ← Display this
  "proficiency_level": "advanced"
}

// Later, after background job:
{
  "id": 123,
  "skill_id": 42,  // Now matched to canonical skill
  "name": "React.js",  // ← Still display this (preserves user input)
  "proficiency_level": "advanced"
}
```

### Future Enhancements

1. **Fuzzy matching** - PostgreSQL `pg_trgm` extension
2. **AI categorization** - Use LLM to infer skill category
3. **Alias detection** - "JS" → "JavaScript", "k8s" → "Kubernetes"
4. **Analytics** - Track which skills need manual review
5. **Admin review queue** - Human review of unmatched skills

### Migration Notes

Schema supports this pattern:
- `skill_id` is nullable ✅
- `name` stores user input ✅
- Unique constraint only applies when `skill_id IS NOT NULL` ✅

**Column rename:** `skill_name_cache` was renamed to `name` in migration 012 for clarity, since it's the primary display field, not a cache.

