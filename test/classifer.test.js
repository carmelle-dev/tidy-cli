import path from 'node:path';
import { describe, it, expect} from 'vitest';
import { classifyByDate, classifyByType } from '../src/classifier.js';

describe('classifyByType', () => {
    it('classe une image', () => {
        expect(classifyByType('photo.jpg')).toBe('Images');
    }
    );

    it("ignore la casse de l'extension", () => {
        expect(classifyByType('PHOTO.JPG')).toBe('Images');
    
    });

    it('utilise la dernière extension', () => {
        expect(classifyByType('backup.tar.gz')).toBe('Archives');
    });

    it('envoie les extensions inconnues dans Autres', () => {
        expect(classifyByType('fichier.xyz')).toBe('Autres');
    });

    it('envoie les fichiers sans extensions dans Autres', () => {
        expect(classifyByType('LICENSE')).toBe('Autres');
    });

      it('reconnaît les fichiers React/TypeScript comme du code', () => {
    expect(classifyByType('show.tsx')).toBe('Code');
    expect(classifyByType('App.jsx')).toBe('Code');
  });

  it('reconnaît les archives .tar.xz', () => {
    expect(classifyByType('tsetup.6.5.1.tar.xz')).toBe('Archives');
  });

  it('reconnaît les installateurs .run', () => {
    expect(classifyByType('xampp-installer.run')).toBe('Programmes');
  });
});

describe('classifyByDate', () => {
  it('range par année et par mois', () => {
    const date = new Date(2026, 10, 11);
    expect(classifyByDate(date)).toBe(path.join('2026', '11-Novembre'));
  });

  it('ajoute un zéro devant les mois à un chiffre', () => {
    const date = new Date(2026, 2, 5);
    expect(classifyByDate(date)).toBe(path.join('2026', '03-Mars'));
  });
});