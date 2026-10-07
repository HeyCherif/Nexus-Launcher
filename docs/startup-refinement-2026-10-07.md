# Startup refinement — 2026-10-07

## Changes

- Settings → Interface offers an explicit persisted startup-film switch (enabled by default).
- Film replay and first-time setup are separate controls. Replaying the film does not clear setup completion.
- Startup focuses Skip. Replay restores its existing trigger on unmount when connected and outside an inert tree.
- Home selection receives focus after the film or setup closes and after the initial library becomes available.
- First-time setup opens only once the film closes and uses its existing focusStep callback.
- UI text is provided in French and English. Film assets, reduced motion, sound preferences and gamepad skip remain intact.

## Verification

- Full UI suite: 63 tests passed before two additional regression cases.
- Targeted tests additionally cover replay focus restoration and failed setting persistence.
- Typecheck and production build passed. Existing HLS size warning remains.
- Prior native observation: desktop Home opened in full screen with 15 detected games.
- Current native visual verification blocked: Computer Use kernel cannot initialize (Windows sandbox helper setup refresh error), even after reset. Shell tests succeeded with approved execution.
- No new native screenshot or claimed visual validation of the new settings controls.
