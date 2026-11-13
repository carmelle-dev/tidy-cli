import { describe, expect, it } from 'vitest';
import { countByDestination } from '../src/summary.js';

describe('countByDestination', () => {
  it('compte les fichiers par destination', () => {
    const plan = [
      { file: 'a.jpg', destination: 'Images' },
      { file: 'b.pdf', destination: 'Documents' },
      { file: 'c.png', destination: 'Images' },
    ];

    expect(countByDestination(plan)).toEqual([
      ['Images', 2],
      ['Documents', 1],
    ]);
  });

  it('renvoie un tableau vide pour un plan vide', () => {
    expect(countByDestination([])).toEqual([]);
  });
});