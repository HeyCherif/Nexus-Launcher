import { EventEmitter } from 'node:events';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve, sep } from 'node:path';
const exec = promisify(execFile);

async function windowsProcesses() {
  // A launcher started from PowerShell 7 may inherit its incompatible CimCmdlets path.
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.toLowerCase() === 'psmodulepath') delete env[key];
  env.PSModulePath = join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'Modules');
  const { stdout } = await exec('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Get-CimInstance Win32_Process | Select-Object @{n="pid";e={$_.ProcessId}},@{n="parent";e={$_.ParentProcessId}},@{n="executablePath";e={$_.ExecutablePath}} | ConvertTo-Json -Compress'], { env, windowsHide: true, timeout: 6000, maxBuffer: 4 * 1024 * 1024 });
  const parsed = JSON.parse(stdout || '[]');
  return Array.isArray(parsed) ? parsed : [parsed];
}

// Follow descendants: bootstrap executables often exit before the actual game.
export function trackGameSession(child, { listProcesses = process.platform === 'win32' ? windowsProcesses : null, interval = 1500, gameRoot = '', attachTimeout = 30_000 } = {}) {
  const session = new EventEmitter();
  const known = new Set([child.pid]);
  const normalizedRoot = gameRoot ? resolve(gameRoot).toLocaleLowerCase() : '';
  const attachDeadline = Date.now() + attachTimeout;
  let rootExited = false, stopped = false, matchedGame = false, timer;
  const finish = () => { if (stopped) return; stopped = true; clearTimeout(timer); session.emit('exit'); };
  const poll = async () => {
    if (stopped) return;
    try {
      const rows = await listProcesses();
      let changed;
      do {
        changed = false;
        for (const row of rows) if (known.has(row.parent) && !known.has(row.pid)) { known.add(row.pid); changed = true; }
      } while (changed);
      if (normalizedRoot) {
        for (const row of rows) {
          if (typeof row.executablePath !== 'string') continue;
          const executable = resolve(row.executablePath).toLocaleLowerCase();
          if (executable === normalizedRoot || executable.startsWith(`${normalizedRoot}${sep}`)) { known.add(row.pid); matchedGame = true; }
        }
      }
      const alive = rows.some(row => known.has(row.pid));
      if (rootExited && !alive && (!normalizedRoot || matchedGame || Date.now() >= attachDeadline)) { finish(); return; }
    } catch { /* An unavailable snapshot is not evidence that the game exited. Retry. */ }
    if (!stopped) timer = setTimeout(poll, interval);
  };
  child.once('exit', () => { rootExited = true; if (!listProcesses) finish(); });
  child.once('error', () => { stopped = true; clearTimeout(timer); });
  if (listProcesses) void poll();
  return session;
}
