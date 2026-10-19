# Account integration and publishing safety

Nexus's Epic and GOG protocol clients contain constants also published by
[Legendary](https://github.com/legendary-gl/legendary/blob/master/legendary/api/egs.py)
and [GOGDL](https://github.com/Heroic-Games-Launcher/heroic-gogdl/blob/main/gogdl/auth.py).
These identify a public desktop OAuth client; they are not a Nexus user's
password, authorization code, access token or refresh token. They were already
present in the published source before the launcher detection changes.

Treat user account data differently:

- Account tokens stay in Electron safeStorage files in the local user-data folder.
- Fail closed when OS encryption is unavailable; no plaintext fallback.
- Renderer IPC returns account status and library data, never tokens.
- Provider passwords are entered on provider pages, not collected by Nexus.
- Do not commit user-data, private keys, API keys, screenshots containing account
  secrets, local environment files or login callbacks.
- Setup diagnostics are read-only, stay on the device and do not authenticate
  accounts, install companions, open launchers or send hardware telemetry.

The earlier publication rejection concerned embedded third-party OAuth client
secrets. On 2026-10-19 these secrets were removed from distributed source and
packages, rather than concealed or fetched indirectly. Production has no injected
OAuth clients: Epic/GOG account sign-in and owned-library sync are explicitly
unavailable. Installed game discovery and launching remain supported. Steam is
unchanged. Existing encrypted account files are preserved but not read/refreshed
through disabled integrations. Protocol tests inject fictional TEST_ONLY clients.

Before publishing, verify that the two previously embedded secret values are
absent from the packaged app.asar. Future account authorization requires a
separately reviewed Nexus-owned integration.
