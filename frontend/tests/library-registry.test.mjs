import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtemp, mkdir, readFile, realpath, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { LibraryRegistry, titleFromExecutable } from "../backend/libraryRegistry.mjs";

test("manual executable proposes a title, refreshes metadata after correction, and persists Nexus playtime", async () => {
  const profile = await mkdtemp(join(tmpdir(), "nexus-registry-"));
  const folder = join(profile, "The Great Game");
  await mkdir(folder);
  const exe = join(folder, "Game.exe");
  await writeFile(exe, "test");
  assert.equal(titleFromExecutable(exe), "The Great Game");
  const searched = [];
  const scan = async (root, _force, _direct, title) => {
    searched.push(title);
    return { games: [{ id: "local-game", title, folderPath: root, steamMetadata: { title, description: `${title} metadata` } }] };
  };
  const registry = new LibraryRegistry(profile, scan);
  await registry.load();
  const added = await registry.addExecutable(exe);
  const id = added.games[0].id;
  assert.equal(added.games[0].steamMetadata.description, "The Great Game metadata");
  const updated = await registry.setTitle(id, "Corrected Game");
  assert.equal(updated.games[0].title, "Corrected Game");
  assert.equal(updated.games[0].steamMetadata.description, "Corrected Game metadata");
  assert.deepEqual(searched, ["The Great Game", "Corrected Game"]);
  await registry.recordPlaytime(id, 125);
  const child = new EventEmitter();
  const updatedPlaytime = new Promise((resolve) => registry.trackLaunchedProcess(id, child, resolve));
  child.emit("exit", 0);
  await updatedPlaytime;
  const reopened = new LibraryRegistry(profile, scan);
  await reopened.load(); await reopened.scan();
  assert.equal(reopened.snapshot().games[0].playtimeSeconds, 126);
  assert.ok(reopened.snapshot().games[0].lastPlayedAt);
});

test("multiple sources persist, same game names have distinct IDs, and removal leaves files intact", async () => {
  const profile = await mkdtemp(join(tmpdir(), "nexus-registry-"));
  const first = join(profile, "one");
  const second = join(profile, "two");
  await mkdir(join(first, "Same"), { recursive: true });
  await mkdir(join(second, "Same"), { recursive: true });
  const standalone = join(profile, "standalone.exe");
  await writeFile(standalone, "test");
  const scan = async (root) => ({ games: [{ id: "local-same", title: "Same", folderPath: join(root, "Same"), executablePath: join(root, "Same", "game.exe") }] });
  const registry = new LibraryRegistry(profile, scan);
  await registry.load();
  await registry.addFolder(first);
  await registry.addFolder(second);
  await registry.addExecutable(standalone);
  assert.equal(registry.snapshot().roots.length, 2);
  assert.equal(registry.snapshot().games.length, 3);
  assert.equal(new Set(registry.snapshot().games.map((game) => game.id)).size, 3);
  await registry.addFolder(first);
  assert.equal(registry.snapshot().roots.length, 2);
  const reopened = new LibraryRegistry(profile, scan);
  await reopened.load();
  await reopened.scan();
  assert.equal(reopened.snapshot().games.length, 3);
  await reopened.remove(reopened.snapshot().manualGames[0].id);
  assert.equal((await stat(standalone)).isFile(), true);
  assert.equal(reopened.snapshot().manualGames.length, 0);
  const disk = JSON.parse(await readFile(join(profile, "library-registry.json"), "utf8"));
  assert.equal(disk.version, 1);
});

test("missing source does not erase another source", async () => {
  const profile = await mkdtemp(join(tmpdir(), "nexus-registry-"));
  const first = join(profile, "one");
  const second = join(profile, "two");
  await mkdir(first); await mkdir(second);
  const registry = new LibraryRegistry(profile, async (root) => {
    if (root === await realpath(first)) throw new Error("Source indisponible");
    return { games: [{ id: "local-okay", title: "Okay", folderPath: join(root, "Okay") }] };
  });
  await registry.load();
  await registry.addFolder(first);
  await registry.addFolder(second);
  const snapshot = await registry.scan();
  assert.equal(snapshot.games.length, 1);
  assert.match(snapshot.scanErrors[snapshot.roots[0].id], /indisponible/);
});

test("a direct game folder is scanned as one source", async () => {
  const profile = await mkdtemp(join(tmpdir(), "nexus-registry-"));
  const folder = join(profile, "My Game");
  await mkdir(folder);
  const calls = [];
  const registry = new LibraryRegistry(profile, async (root, _force, direct) => {
    calls.push({ root, direct });
    return { games: [{ id: "local-my-game", title: "My Game", folderPath: root }] };
  });
  await registry.load();
  await registry.addFolder(folder, "game");
  assert.equal(calls[0].direct, true);
  assert.equal(registry.snapshot().games.length, 1);
});

test("store launch metadata survives discovery and scanning", async () => {
  const profile = await mkdtemp(join(tmpdir(), "nexus-registry-"));
  const folder = join(profile, "Steam Game");
  await mkdir(folder);
  const registry = new LibraryRegistry(profile, async (root) => ({ games: [{ id: "local-game", title: "Steam Game", folderPath: root }] }));
  await registry.load();
  await registry.syncAutoSources([{ path: folder, title: "Steam Game", platform: "Steam", storeId: "12345", launch: { provider: "steam", appId: "12345" } }]);
  const game = (await registry.scan()).games[0];
  assert.deepEqual(game.launch, { provider: "steam", appId: "12345" });
  assert.deepEqual(await registry.authorizedLaunch(game.id), { type: "store", provider: "steam", appId: "12345", folderPath: await realpath(folder) });
});

test("Epic manifest launch resolves only its registered executable and arguments", async () => {
  const profile = await mkdtemp(join(tmpdir(), "nexus-registry-"));
  const folder = join(profile, "Epic Game");
  const executable = join(folder, "Binaries", "EpicGame.exe");
  await mkdir(dirname(executable), { recursive: true });
  await writeFile(executable, "game");
  const registry = new LibraryRegistry(profile, async (root) => ({ games: [{ id: "local-game", title: "Epic Game", folderPath: root }] }));
  await registry.load();
  await registry.syncAutoSources([{ path: folder, title: "Epic Game", platform: "Epic", storeId: "EpicGame", launch: { provider: "epic", executable: "Binaries\\EpicGame.exe", arguments: "-windowed -locale=fr" } }]);
  const game = (await registry.scan()).games[0];
  assert.deepEqual(await registry.authorizedLaunch(game.id), { type: "executable", file: await realpath(executable), arguments: "-windowed -locale=fr", folderPath: await realpath(folder), provider: "epic" });
});

test("store rediscovery upgrades an existing automatic source with launch metadata", async () => {
  const profile = await mkdtemp(join(tmpdir(), "nexus-registry-"));
  const folder = join(profile, "Existing Steam Game");
  await mkdir(folder);
  const registry = new LibraryRegistry(profile, async (root) => ({ games: [{ id: "local-game", title: "Existing Steam Game", folderPath: root }] }));
  await registry.load();
  await registry.syncAutoSources([{ path: folder, title: "Existing Steam Game", platform: "Steam", storeId: "987" }]);
  await registry.syncAutoSources([{ path: folder, title: "Existing Steam Game", platform: "Steam", storeId: "987", launch: { provider: "steam", appId: "987" } }]);
  assert.deepEqual(registry.snapshot().roots[0].launch, { provider: "steam", appId: "987" });
});

test("store rediscovery removes automatic sources whose installation folder disappeared", async () => {
  const profile = await mkdtemp(join(tmpdir(), "nexus-registry-"));
  const removed = join(profile, "Removed Steam Game");
  const current = join(profile, "Current Steam Game");
  await mkdir(removed); await mkdir(current);
  const registry = new LibraryRegistry(profile, async (root) => ({ games: [{ title: "Game", folderPath: root }] }));
  await registry.load();
  await registry.syncAutoSources([
    { path: removed, title: "Removed", platform: "Steam", storeId: "111" },
    { path: current, title: "Current", platform: "Steam", storeId: "222" },
  ]);
  await rm(removed, { recursive: true });
  await registry.syncAutoSources([{ path: current, title: "Current", platform: "Steam", storeId: "222" }]);
  assert.deepEqual(registry.snapshot().roots.map((root) => root.path), [await realpath(current)]);
});

test("a folder containing several game folders is repaired from game to collection", async () => {
  const profile = await mkdtemp(join(tmpdir(), "nexus-registry-"));
  const collection = join(profile, "Games");
  for (const name of ["Alpha", "Beta"]) {
    const game = join(collection, name, "Binaries");
    await mkdir(game, { recursive: true });
    await writeFile(join(game, `${name}.exe`), "game");
  }
  const calls = [];
  const registry = new LibraryRegistry(profile, async (root, _force, direct) => {
    calls.push({ root, direct });
    return { games: direct ? [{ title: "Games", folderPath: root }] : [
      { title: "Alpha", folderPath: join(root, "Alpha") },
      { title: "Beta", folderPath: join(root, "Beta") },
    ] };
  });
  await registry.load();
  const result = await registry.addFolder(collection, "game");
  assert.equal(result.roots[0].kind, "collection");
  assert.equal(calls.at(-1).direct, false);
  assert.deepEqual(result.games.map((game) => game.title), ["Alpha", "Beta"]);
});

test("a manual executable inside a scanned game refines that game without creating a duplicate", async () => {
  const profile = await mkdtemp(join(tmpdir(), "nexus-registry-"));
  const collection = join(profile, "Games");
  const gameFolder = join(collection, "Alpha");
  const executable = join(gameFolder, "Binaries", "Alpha.exe");
  await mkdir(dirname(executable), { recursive: true });
  await writeFile(executable, "game");
  const registry = new LibraryRegistry(profile, async (root, _force, direct) => ({ games: direct
    ? [{ title: "Alpha", folderPath: root }]
    : [{ title: "Alpha", folderPath: gameFolder, executablePath: executable }]
  }));
  await registry.load();
  await registry.addFolder(collection, "collection");
  const result = await registry.addExecutable(executable);
  assert.equal(result.games.length, 1);
  assert.equal(result.games[0].folderPath, gameFolder);
  assert.equal(result.games[0].executablePath, executable);
});

test("launch only resolves scanned game IDs and explicitly registered executables", async () => {
  const profile = await mkdtemp(join(tmpdir(), "nexus-registry-"));
  const exe = join(profile, "game.exe");
  await writeFile(exe, "test");
  const registry = new LibraryRegistry(profile, async () => ({ games: [] }));
  await registry.load();
  await assert.rejects(registry.authorizedExecutable(exe), /non autorisé/);
  const snapshot = await registry.addExecutable(exe);
  assert.equal(await registry.authorizedExecutable(snapshot.manualGames[0].id), await realpath(exe));
  await writeFile(exe, "changed after scan");
  await assert.rejects(registry.authorizedExecutable(snapshot.manualGames[0].id), /modifié/);
});

test("changing a scanned game's executable cannot escape its registered folder", async () => {
  const profile = await mkdtemp(join(tmpdir(), "nexus-registry-"));
  const root = join(profile, "library");
  const gameFolder = join(root, "Game");
  await mkdir(gameFolder, { recursive: true });
  const safe = join(gameFolder, "safe.exe");
  const outside = join(profile, "outside.exe");
  await writeFile(safe, "safe"); await writeFile(outside, "outside");
  const registry = new LibraryRegistry(profile, async () => ({ games: [{ id: "local-game", title: "Game", folderPath: gameFolder }] }));
  await registry.load();
  const snapshot = await registry.addFolder(root);
  const id = snapshot.games[0].id;
  await assert.rejects(registry.setExecutable(id, outside), /hors du dossier/);
  await registry.setExecutable(id, safe);
  assert.equal(await registry.authorizedExecutable(id), await realpath(safe));
});

test("manual artwork accepts only a real supported image and persists its override", async () => {
  const profile = await mkdtemp(join(tmpdir(), "nexus-registry-"));
  const exe = join(profile, "game.exe");
  const fake = join(profile, "fake.png");
  const image = join(profile, "real.png");
  await writeFile(exe, "exe"); await writeFile(fake, "not an image");
  await writeFile(image, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]));
  const registry = new LibraryRegistry(profile, async () => ({ games: [] }));
  await registry.load();
  const id = (await registry.addExecutable(exe)).games[0].id;
  await assert.rejects(registry.setArtwork(id, "gridArtwork", fake), /format réel/);
  const result = await registry.setArtwork(id, "gridArtwork", image);
  assert.match(result.games[0].artworkUrl, /nexus-artwork/);
  const reopened = new LibraryRegistry(profile, async () => ({ games: [] }));
  await reopened.load(); await reopened.scan();
  assert.match(reopened.snapshot().games[0].artworkUrl, /nexus-artwork/);
});
