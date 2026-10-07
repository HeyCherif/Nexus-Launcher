# Extensions verification — 2026-10-07

- Replaced the sixth download destination with Extensions and a puzzle icon.
- Added canonical /extensions; /downloads redirects with replacement. Controller route order retains six sections.
- Catalog integrates existing Replay/Saves installation backends and real Steam Achievement Notifier activation. Viewing/filtering never installs or connects accounts. Hidden cards stay mounted while operations progress.
- Search, category selection, empty reset, preview limitation and activation tested with controlled desktop IPC.
- Full npm test: 123 backend tests + 51 UI tests passed. TypeScript and production build passed; existing HLS chunk warning remains.
- Browser confirmed legacy redirect, three entries, success filter, no-result reset, FR/EN and Solaris, and no horizontal overflow at 640/1440 px.
- Browser screenshot APIs returned capture unavailable; visual screenshot comparison and physical controller/native installation were not performed this turn.
- Independent final review: no actionable findings. Local commit only; GitHub publication and release remain deferred.
