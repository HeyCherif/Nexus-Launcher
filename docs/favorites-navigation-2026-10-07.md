# Favorites and library navigation — 2026-10-07

- Add/remove a favorite from the game detail options menu, localized in French and English.
- Library Favorites filter composes with the existing search/source/status filters. Clear filters restores the whole library.
- Favorite cards show a small glass star badge, respecting the reduced transparency preference.
- Favorites are stored locally under nexus.favorites.v1. Failed writes preserve the prior state and show a message. No account synchronization is implied.
- Back to library always navigates to /library, including when details were opened from Settings.

Verification: TypeScript check passed; all 69 frontend tests passed across 26 files; production build passed. Existing HLS chunk size warning remains. Read-only review found no actionable issues.

Visual/native verification remains pending: browser automation could not initialize because of the environment sandbox setup error. No new visual or native verification is claimed.
