# Extension download check — 2026-10-07

- Actual PluginManager downloads completed in isolated QA profiles: Replay 0.1.0 (8,942,365 bytes, 21,122,087 extracted bytes) and Saves 0.1.1 (2,442,141 bytes, 5,825,224 extracted bytes). Both reached ready after archive and per-file verification. Downloaded binaries were not executed.
- SAN 1.9.47 release metadata advertises a 162,166,532-byte installer with a SHA-256 digest. An HTTP 200 response and initial bytes were confirmed. Full transfer exceeded both 120-second and 300-second QA limits, so SAN installation and real in-game unlock notifications remain unverified.
- Failed catalog reads now produce an explicit releaseError and can be retried without waiting for the normal cache cooldown. Existing installations remain available offline.
- User rejected browser ZIP downloads. Preview now displays verified availability, version/size and a Windows installation badge only. No preview endpoint installs or executes software. Actual integrated installation/progress/activation uses trusted desktop IPC.
- Replay and Saves share Installer/Install and À propos/About labels. Cards use explicit gaps, stacked preview text and separated help rows.
- Full regression suite: 125 backend and 54 UI tests passed. Final three UI suites: 8 tests passed. Typecheck and production build passed. Existing HLS build size warning remains.
- Browser AX and screenshot confirmed final preview, no archive links, accurate sizes, consistent help labels and separated text. Native GUI verification was not completed: launch attempts showed cache access errors and no visible main window. A compiled build alone is not proof of an end-to-end desktop session.
- Independent final review found no actionable regressions. Publication remains deferred.
