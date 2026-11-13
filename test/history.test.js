
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HISTORY_FILE, readHistory, saveRun, writeHistory } from '../src/history.js';

describe('history', () => {
  let dir;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tidy-history-test-'));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("renvoie un historique vide si le fichier n'existe pas", async () => {
    expect(await readHistory(dir)).toEqual([]);
  });

  it('enregistre les déplacements avec des chemins relatifs', async () => {
    await saveRun(dir, [
      { from: path.join(dir, 'photo.jpg'), to: path.join(dir, 'Images', 'photo.jpg') },
    ]);

    const history = await readHistory(dir);

    expect(history).toHaveLength(1);
    expect(history[0].moves).toEqual([
      { from: 'photo.jpg', to: path.join('Images', 'photo.jpg') },
    ]);
  });

  it('empile les rangements successifs', async () => {
    await saveRun(dir, [{ from: path.join(dir, 'a.jpg'), to: path.join(dir, 'Images', 'a.jpg') }]);
    await saveRun(dir, [{ from: path.join(dir, 'b.pdf'), to: path.join(dir, 'Documents', 'b.pdf') }]);

    expect(await readHistory(dir)).toHaveLength(2);
  });

  it("n'enregistre rien si aucun fichier n'a été déplacé", async () => {
    await saveRun(dir, []);

    await expect(fs.access(path.join(dir, HISTORY_FILE))).rejects.toThrow();
  });

  it("supprime le fichier quand l'historique devient vide", async () => {
    await saveRun(dir, [{ from: path.join(dir, 'a.jpg'), to: path.join(dir, 'Images', 'a.jpg') }]);

    await writeHistory(dir, []);

    await expect(fs.access(path.join(dir, HISTORY_FILE))).rejects.toThrow();
  });
});
