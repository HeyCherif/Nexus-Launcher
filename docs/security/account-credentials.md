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

Publication was rejected by automatic approval review because the existing OAuth
constants were classified as private credentials. The constants were checked
against the existing published commit and the upstream public code. No attempt
is made to hide, encode, move or indirectly publish the rejected values to bypass
that decision. Continue development locally; resolve publication approval before
a later GitHub update or release.
