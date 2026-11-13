import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { executePlan, getAvailablePath } from '../src/mover.js';

describe('mover', () => {
  let dir;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tidy-mover-test-'));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  describe('getAvailablePath', () => {
    it('garde le nom si le chemin est libre', async () => {
      const target = path.join(dir, 'photo.jpg');
      expect(await getAvailablePath(target)).toBe(target);
    });

    it('ajoute (1) si le nom est déjà pris', async () => {
      await fs.writeFile(path.join(dir, 'photo.jpg'), '');

      const result = await getAvailablePath(path.join(dir, 'photo.jpg'));

      expect(result).toBe(path.join(dir, 'photo (1).jpg'));
    });

    it('passe à (2) si (1) est aussi pris', async () => {
      await fs.writeFile(path.join(dir, 'photo.jpg'), '');
      await fs.writeFile(path.join(dir, 'photo (1).jpg'), '');

      const result = await getAvailablePath(path.join(dir, 'photo.jpg'));

      expect(result).toBe(path.join(dir, 'photo (2).jpg'));
    });
  });

  describe('executePlan', () => {

        it('ne déplace rien en mode dryRun', async () => {
      await fs.writeFile(path.join(dir, 'photo.jpg'), '');

      await executePlan(dir, [{ file: 'photo.jpg', destination: 'Images' }], { dryRun: true });

      await expect(fs.access(path.join(dir, 'photo.jpg'))).resolves.toBeUndefined();
      await expect(fs.access(path.join(dir, 'Images'))).rejects.toThrow();
    });

    it('prédit les renommages en mode dryRun', async () => {
      await fs.mkdir(path.join(dir, 'Images'));
      await fs.writeFile(path.join(dir, 'Images', 'photo.jpg'), '');
      await fs.writeFile(path.join(dir, 'photo.jpg'), '');

      const moves = await executePlan(dir, [{ file: 'photo.jpg', destination: 'Images' }], {
        dryRun: true,
      });

      expect(moves[0].to).toBe(path.join(dir, 'Images', 'photo (1).jpg'));
    });
    
    it('déplace les fichiers et crée les dossiers', async () => {
      await fs.writeFile(path.join(dir, 'photo.jpg'), '');
      await fs.writeFile(path.join(dir, 'cv.pdf'), '');

      await executePlan(dir, [
        { file: 'photo.jpg', destination: 'Images' },
        { file: 'cv.pdf', destination: 'Documents' },
      ]);

      await expect(fs.access(path.join(dir, 'Images', 'photo.jpg'))).resolves.toBeUndefined();
      await expect(fs.access(path.join(dir, 'Documents', 'cv.pdf'))).resolves.toBeUndefined();
      await expect(fs.access(path.join(dir, 'photo.jpg'))).rejects.toThrow();
    });

    it('crée les dossiers imbriqués pour le rangement par date', async () => {
      await fs.writeFile(path.join(dir, 'rapport.pdf'), '');
      const destination = path.join('2026', '03-Mars');

      await executePlan(dir, [{ file: 'rapport.pdf', destination }]);

      await expect(fs.access(path.join(dir, destination, 'rapport.pdf'))).resolves.toBeUndefined();
    });

    it("n'écrase jamais un fichier existant", async () => {
      await fs.mkdir(path.join(dir, 'Images'));
      await fs.writeFile(path.join(dir, 'Images', 'photo.jpg'), 'ancienne');
      await fs.writeFile(path.join(dir, 'photo.jpg'), 'nouvelle');

      await executePlan(dir, [{ file: 'photo.jpg', destination: 'Images' }]);

      const oldContent = await fs.readFile(path.join(dir, 'Images', 'photo.jpg'), 'utf8');
      const newContent = await fs.readFile(path.join(dir, 'Images', 'photo (1).jpg'), 'utf8');

      expect(oldContent).toBe('ancienne');
      expect(newContent).toBe('nouvelle');
    });

    it('renvoie la liste des déplacements effectués', async () => {
      await fs.writeFile(path.join(dir, 'musique.mp3'), '');

      const moves = await executePlan(dir, [{ file: 'musique.mp3', destination: 'Musique' }]);

      expect(moves).toEqual([
        {
          from: path.join(dir, 'musique.mp3'),
          to: path.join(dir, 'Musique', 'musique.mp3'),
        },
      ]);
    });
  });
});