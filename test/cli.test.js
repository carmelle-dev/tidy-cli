import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const run = promisify(execFile);
const CLI = fileURLToPath(new URL('../bin/tidy.js', import.meta.url));

describe('CLI tidy', () => {
  let dir;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tidy-cli-test-'));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('affiche la version du package.json', async () => {
    const pkg = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), 'utf8'));

    const { stdout } = await run(process.execPath, [CLI, '--version']);

    expect(stdout.trim()).toBe(pkg.version);
  });

  it('range les fichiers et affiche le résultat', async () => {
    await fs.writeFile(path.join(dir, 'photo.jpg'), '');

    const { stdout } = await run(process.execPath, [CLI, dir]);

    expect(stdout).toContain(`photo.jpg  →  ${path.join('Images', 'photo.jpg')}`);
    expect(stdout).toContain('1 fichier(s) rangé(s).');
    await expect(fs.access(path.join(dir, 'Images', 'photo.jpg'))).resolves.toBeUndefined();
  });

  it("indique quand il n'y a rien à ranger", async () => {
    const { stdout } = await run(process.execPath, [CLI, dir]);

    expect(stdout).toContain('Rien à ranger');
  });

  it('ne déplace rien avec --dry-run', async () => {
    await fs.writeFile(path.join(dir, 'photo.jpg'), '');

    const { stdout } = await run(process.execPath, [CLI, dir, '--dry-run']);

    expect(stdout).toContain('[simulation] photo.jpg');
    expect(stdout).toContain('seraient rangé(s)');
    await expect(fs.access(path.join(dir, 'photo.jpg'))).resolves.toBeUndefined();
  });

  it("sort avec le code 1 si le dossier n'existe pas", async () => {
    const missing = path.join(dir, 'inexistant');

    await expect(run(process.execPath, [CLI, missing])).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining('Erreur'),
    });
  });

  it('annule un rangement avec --undo', async () => {
    await fs.writeFile(path.join(dir, 'photo.jpg'), '');

    await run(process.execPath, [CLI, dir]);
    const { stdout } = await run(process.execPath, [CLI, dir, '--undo']);

    expect(stdout).toContain('1 fichier(s) remis à leur place.');
    await expect(fs.access(path.join(dir, 'photo.jpg'))).resolves.toBeUndefined();
    await expect(fs.access(path.join(dir, 'Images'))).rejects.toThrow();
  });

  it("indique quand il n'y a rien à annuler", async () => {
    const { stdout } = await run(process.execPath, [CLI, dir, '--undo']);

    expect(stdout).toContain('Rien à annuler');
  });
});
