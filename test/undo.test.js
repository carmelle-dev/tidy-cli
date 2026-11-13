import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HISTORY_FILE, saveRun } from '../src/history.js';
import { executePlan } from '../src/mover.js';
import { buildPlan } from '../src/scanner.js';
import { undoLastRun } from '../src/undo.js';

async function tidyFolder(dir) {
  const plan = await buildPlan(dir);
  const moves = await executePlan(dir, plan);
  await saveRun(dir, moves);
}

async function listFolder(dir) {
  return (await fs.readdir(dir)).sort();
}

describe('undoLastRun', () => {
  let dir;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tidy-undo-test-'));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("renvoie null s'il n'y a rien à annuler", async () => {
    expect(await undoLastRun(dir)).toBeNull();
  });

  it('remet le dossier exactement dans son état initial', async () => {
    await fs.writeFile(path.join(dir, 'photo.jpg'), 'image');
    await fs.writeFile(path.join(dir, 'cv.pdf'), 'document');
    const before = await listFolder(dir);

    await tidyFolder(dir);
    await undoLastRun(dir);

    expect(await listFolder(dir)).toEqual(before);
    expect(await fs.readFile(path.join(dir, 'photo.jpg'), 'utf8')).toBe('image');
  });

  it("supprime les dossiers vides et le fichier d'historique", async () => {
    await fs.writeFile(path.join(dir, 'photo.jpg'), '');

    await tidyFolder(dir);
    await undoLastRun(dir);

    await expect(fs.access(path.join(dir, 'Images'))).rejects.toThrow();
    await expect(fs.access(path.join(dir, HISTORY_FILE))).rejects.toThrow();
  });

  it("garde un dossier qui contient d'autres fichiers", async () => {
    await fs.writeFile(path.join(dir, 'photo.jpg'), '');
    await tidyFolder(dir);
    await fs.writeFile(path.join(dir, 'Images', 'perso.png'), '');

    await undoLastRun(dir);

    await expect(fs.access(path.join(dir, 'Images', 'perso.png'))).resolves.toBeUndefined();
  });

  it('ignore un fichier qui a disparu depuis le rangement', async () => {
    await fs.writeFile(path.join(dir, 'photo.jpg'), '');
    await fs.writeFile(path.join(dir, 'cv.pdf'), '');
    await tidyFolder(dir);
    await fs.rm(path.join(dir, 'Images', 'photo.jpg'));

    const result = await undoLastRun(dir);

    expect(result.restored).toHaveLength(1);
    expect(result.skipped).toHaveLength(1);
    await expect(fs.access(path.join(dir, 'cv.pdf'))).resolves.toBeUndefined();
  });

  it("n'annule que le dernier rangement", async () => {
    await fs.writeFile(path.join(dir, 'photo.jpg'), '');
    await tidyFolder(dir);
    await fs.writeFile(path.join(dir, 'cv.pdf'), '');
    await tidyFolder(dir);

    await undoLastRun(dir);

    await expect(fs.access(path.join(dir, 'cv.pdf'))).resolves.toBeUndefined();
    await expect(fs.access(path.join(dir, 'Images', 'photo.jpg'))).resolves.toBeUndefined();
  });

  it('ne modifie rien en mode dryRun', async () => {
    await fs.writeFile(path.join(dir, 'photo.jpg'), '');
    await tidyFolder(dir);

    const result = await undoLastRun(dir, { dryRun: true });

    expect(result.restored).toHaveLength(1);
    await expect(fs.access(path.join(dir, 'Images', 'photo.jpg'))).resolves.toBeUndefined();
    await expect(fs.access(path.join(dir, HISTORY_FILE))).resolves.toBeUndefined();
  });
});
