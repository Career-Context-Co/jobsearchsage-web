# Change: Add Profile Page

## Why
The JobSearchSage application needs a dedicated Profile page to house the Career Sage Profile features, which are central to the application's purpose. This page will serve as the foundation for building profile management, resume generation, and related career context features. By establishing this page early using the template's established patterns, we create a clear entry point for future profile-related development.

## What Changes
- Add new `/profile` route with dedicated page component
- Add "Profile" link to sidebar navigation (positioned above "Home")
- Scaffold page using established UDashboardPanel pattern from template
- Follow existing component structure and naming conventions

## Impact
- Affected specs: `navigation`
- Affected code:
  - `app/layouts/default.vue` - Add profile link to sidebar navigation array
  - `app/pages/profile.vue` - New page component (to be created)
- User-facing: New "Profile" menu item appears in sidebar, clicking navigates to `/profile` route
- Development: Establishes clean foundation for future profile-related features

