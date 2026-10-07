# Console setup and game hub implementation plan

> Execution: native in this session; review before completion.

**Goal:** Make first-run setup discover the real PC and launchers, and make game details feel like the existing Nexus console interface.

**Architecture:** Read-only device diagnostics share the existing store executable detection. Onboarding requests diagnostics through desktop IPC or the local preview API, while real game discovery stays in LibraryRegistry. Existing glass tokens, game artwork, dialogs and controller navigation remain the visual foundation.

**Tech stack:** Electron, Node, React, Motion, Radix, shared FR/EN copy.

**Reference:** User screenshot and approved Home glass direction in frontend/AGENTS.md; PS5 Welcome hub and Apple's Liquid Glass presentation.

## Constraints

- No fake hardware, progress, account connection or achievement synchronization.
- No launcher opened, account authenticated or optional plugin installed by diagnostics.
- CPU, memory, GPU/OS/display and Steam/Epic/GOG executable presence remain local.
- Keyboard/controller navigation, narrow windows, Solaris, reduced motion and reduced transparency must remain usable.
- Continue locally; no new release or retry of blocked credential publication.

## Tasks

- [x] Test diagnostics: installed/missing launchers, failed GPU query, no spawning, safe result fields.
- [x] Implement backend diagnostics and IPC/local preview endpoint; reuse store detection.
- [x] Test onboarding: real scan, cancellation, retry, stale responses, backward navigation.
- [x] Implement a glass setup cockpit with discovery while choosing games/preferences; preserve opt-in notifications.
- [x] Restyle game details with a cinematic header, focused actions, compact real facts, overview/media/achievements and artwork previews.
- [x] Verify FR/EN, wide/narrow, reduced motion/transparency; run focused tests, typecheck and build.
- [x] Review, fix findings and commit locally.

## Verification

- 11 focused backend tests and 6 UI tests passed; TypeScript and production build passed.
- Native read-only probe returned Ryzen CPU, two GPUs, 1920 x 1080 and Windows caption. Restricted preview had unavailable CIM values; verified with the local server allowed to read system characteristics.
- UI: actual 14-game scan, backward navigation, three steps, FR/EN, Solaris and Obsidienne, 640/1440 px without horizontal overflow, ArrowRight tab switching.
- Fixed narrow grid overlap after visual inspection. Reduced motion/transparency rules reviewed in source; no physical controller gameplay test in this turn.
- Independent review finding about swallowed registry errors fixed with a regression; final review found no blocker.
- Production bundle retains the existing large HLS chunk warning.
- GitHub push and release deferred.
