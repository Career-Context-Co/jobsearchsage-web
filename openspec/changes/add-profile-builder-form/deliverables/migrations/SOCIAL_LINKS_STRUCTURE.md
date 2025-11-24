# Social Links Data Structure

## Overview

The `contact_info.social_links` field stores social media and professional platform links as a JSONB array of objects with typed platforms.

## Structure

```typescript
interface SocialLink {
  platform: SocialPlatform;  // Enum value
  url: string;                // Full URL to profile
}

type SocialPlatform = 
  | 'linkedin'
  | 'github'
  | 'twitter'
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'tiktok'
  | 'behance'
  | 'dribbble'
  | 'medium'
  | 'devto'
  | 'stackoverflow'
  | 'other';
```

## Database Storage (JSONB)

```json
[
  {
    "platform": "linkedin",
    "url": "https://linkedin.com/in/johndoe"
  },
  {
    "platform": "github",
    "url": "https://github.com/johndoe"
  },
  {
    "platform": "twitter",
    "url": "https://twitter.com/johndoe"
  }
]
```

## Platform Use Cases by Profession

### Software Developers
```json
[
  {"platform": "github", "url": "https://github.com/username"},
  {"platform": "stackoverflow", "url": "https://stackoverflow.com/users/12345/username"},
  {"platform": "linkedin", "url": "https://linkedin.com/in/username"},
  {"platform": "devto", "url": "https://dev.to/username"}
]
```

### Designers
```json
[
  {"platform": "behance", "url": "https://behance.net/username"},
  {"platform": "dribbble", "url": "https://dribbble.com/username"},
  {"platform": "instagram", "url": "https://instagram.com/username"},
  {"platform": "linkedin", "url": "https://linkedin.com/in/username"}
]
```

### Content Creators
```json
[
  {"platform": "youtube", "url": "https://youtube.com/@username"},
  {"platform": "tiktok", "url": "https://tiktok.com/@username"},
  {"platform": "instagram", "url": "https://instagram.com/username"},
  {"platform": "twitter", "url": "https://twitter.com/username"}
]
```

### Writers/Bloggers
```json
[
  {"platform": "medium", "url": "https://medium.com/@username"},
  {"platform": "twitter", "url": "https://twitter.com/username"},
  {"platform": "linkedin", "url": "https://linkedin.com/in/username"}
]
```

### Corporate Professionals
```json
[
  {"platform": "linkedin", "url": "https://linkedin.com/in/username"},
  {"platform": "twitter", "url": "https://twitter.com/username"}
]
```

## Querying Social Links

### Find users with LinkedIn
```sql
SELECT * FROM career_id.contact_info
WHERE social_links @> '[{"platform": "linkedin"}]'::jsonb;
```

### Find users with GitHub
```sql
SELECT * FROM career_id.contact_info
WHERE social_links @> '[{"platform": "github"}]'::jsonb;
```

### Get specific social link URL
```sql
SELECT 
  id,
  social_link->>'url' as linkedin_url
FROM career_id.contact_info,
  jsonb_array_elements(social_links) as social_link
WHERE social_link->>'platform' = 'linkedin';
```

### Count users by platform
```sql
SELECT 
  social_link->>'platform' as platform,
  COUNT(*) as user_count
FROM career_id.contact_info,
  jsonb_array_elements(social_links) as social_link
GROUP BY social_link->>'platform'
ORDER BY user_count DESC;
```

## Validation Rules (Application Layer)

1. **Platform validation:**
   - Must be one of the enum values
   - Case-sensitive (lowercase only)

2. **URL validation:**
   - Must be valid URL format
   - Should start with `https://` (or `http://` for legacy)
   - Optional: validate URL matches platform domain (e.g., linkedin.com for linkedin platform)

3. **Uniqueness:**
   - Same platform should not appear twice in one profile's social_links array
   - Enforce at application layer or with CHECK constraint

4. **Other platform:**
   - Use `"platform": "other"` for niche or unlisted platforms
   - Encourage users to request new platform types via feedback

## Migration from Old Schema

If migrating from a schema with separate `linkedin` column:

```sql
-- Example migration (if needed)
UPDATE career_id.contact_info
SET social_links = 
  CASE 
    WHEN linkedin IS NOT NULL 
    THEN jsonb_build_array(
      jsonb_build_object('platform', 'linkedin', 'url', linkedin)
    )
    ELSE '[]'::jsonb
  END
WHERE linkedin IS NOT NULL;
```

## Frontend UI Considerations

1. **Platform selector:** Dropdown/autocomplete with relevant platforms based on user's profession
2. **Dynamic form:** Allow adding multiple social links with platform + URL input pairs
3. **Icons:** Use platform-specific icons for better UX
4. **Validation:** Real-time URL format validation per platform
5. **Suggestions:** Suggest common platforms based on job title or industry

## Why This Approach?

✅ **Flexible** - Supports any profession's relevant platforms  
✅ **Typed** - Platform enum prevents typos and standardizes data  
✅ **Queryable** - JSONB operators enable efficient platform-specific queries  
✅ **Extensible** - Easy to add new platforms by updating enum  
✅ **Professional** - Separates professional networks from personal websites  
✅ **Future-proof** - Can add metadata like `visibility`, `primary`, `verified` to objects later

## Websites vs Social Links

**`websites` array:** Generic URLs (portfolio, personal blog, company site)
```json
["https://johndoe.com", "https://myportfolio.example.com"]
```

**`social_links` array:** Typed social/professional platform profiles
```json
[
  {"platform": "linkedin", "url": "https://linkedin.com/in/johndoe"},
  {"platform": "github", "url": "https://github.com/johndoe"}
]
```

This separation keeps the data model clean and makes platform-specific features easier to implement later (e.g., "Import from LinkedIn", "Verify GitHub contributions").

