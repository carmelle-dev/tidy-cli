import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildPlan } from '../src/scanner.js';

describe('buildPlan', () => {
  let dir;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tidy-test-'));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('propose une destination pour chaque fichier', async () => {
    await fs.writeFile(path.join(dir, 'photo.jpg'), '');
    await fs.writeFile(path.join(dir, 'cv.pdf'), '');

    const plan = await buildPlan(dir);

    expect(plan).toHaveLength(2);
    expect(plan).toEqual(
      expect.arrayContaining([
        { file: 'photo.jpg', destination: 'Images' },
        { file: 'cv.pdf', destination: 'Documents' },
      ]),
    );
  });

  it('ignore les fichiers cachés et les dossiers', async () => {
    await fs.writeFile(path.join(dir, '.DS_Store'), '');
    await fs.mkdir(path.join(dir, 'un-dossier'));
    await fs.writeFile(path.join(dir, 'musique.mp3'), '');

    const plan = await buildPlan(dir);

    expect(plan).toEqual([{ file: 'musique.mp3', destination: 'Musique' }]);
  });

  it('range par date de modification avec byDate', async () => {
    const file = path.join(dir, 'rapport.pdf');
    await fs.writeFile(file, '');

    const date = new Date(2026, 2, 15); // 15 mars 2026
    await fs.utimes(file, date, date);

    const plan = await buildPlan(dir, { byDate: true });

    expect(plan).toEqual([{ file: 'rapport.pdf', destination: path.join('2026', '03-Mars') }]);
  });

  it("renvoie une erreur si le dossier n'existe pas", async () => {
    await expect(buildPlan(path.join(dir, 'inexistant'))).rejects.toThrow();
  });

  it('renvoie un plan vide pour un dossier vide', async () => {
    const plan = await buildPlan(dir);
    expect(plan).toEqual([]);
  });
});