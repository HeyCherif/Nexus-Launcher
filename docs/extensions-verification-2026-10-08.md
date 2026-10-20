# Extensions verification — 2026-10-08

Verified in Codex's integrated browser against the local development server:
- Category filtering and empty search/reset.
- Free games dialog opens, loads 13 real offers and closes.
- FR/EN language changes and Steam notification help disclosure.
- Replay catalog unavailable state was observed; explicit retry recovered version 0.1.0 (8.9 MB). Saves exposes version 0.1.1 (2.4 MB).

Real download/install verification used an isolated QA folder, not the user's live installation or save destination. Both Replay and Saves initially returned download-unavailable; subsequent attempts installed successfully. Every installed file passed the existing SHA256 verification. No security checks were bypassed. The precise reason for the initial transfer failures has not been established.

Remaining: native Electron install UI/progress, capture during an actual game, protected save/restore round trip, and SAN notification from an actual Steam unlock. Browser tests do not prove these native functions.

Evidence (local ignored artifacts):
- frontend/artifacts/qa/extensions-integrated/extensions.png
- frontend/artifacts/qa/plugin-install-V94JnW/report.json
