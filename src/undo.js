import fs from 'node:fs/promises';
import path from 'node:path';
import { readHistory, writeHistory } from './history.js';
import { exists, getAvailablePath } from './mover.js';

/**
 * Supprime les dossiers devenus vides, du plus profond au moins profond,
 * sans jamais remonter au-delà du dossier rangé.
 */
async function removeEmptyDirs(root, dirs) {
  const unique = [...new Set(dirs)].sort((a, b) => b.length - a.length);

  for (const dir of unique) {
    let current = dir;

    while (current !== root && current.startsWith(root)) {
      try {
        await fs.rmdir(current);
      } catch {
        break;
      }
      current = path.dirname(current);
    }
  }
}

/**
 * Annule le dernier rangement d'un dossier.
 * @returns {Promise<null | { restored: Array<{ from: string, to: string }>, skipped: Array<{ from: string, to: string }> }>}
 *   null s'il n'y a rien à annuler
 */
export async function undoLastRun(folder, { dryRun = false } = {}) {
  const history = await readHistory(folder);
  const lastRun = history.at(-1);

  if (!lastRun) {
    return null;
  }

  const restored = [];
  const skipped = [];

  for (const move of [...lastRun.moves].reverse()) {
    const current = path.join(folder, move.to);
    const original = path.join(folder, move.from);

    if (!(await exists(current))) {
      skipped.push(move);
      continue;
    }

    const target = await getAvailablePath(original);

    if (!dryRun) {
      await fs.rename(current, target);
    }

    restored.push({ from: current, to: target });
  }

  if (!dryRun) {
    await removeEmptyDirs(folder, restored.map(({ from }) => path.dirname(from)));
    await writeHistory(folder, history.slice(0, -1));
  }

  return { restored, skipped };
}
