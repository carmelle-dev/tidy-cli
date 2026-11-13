import fs from 'node:fs/promises';
import path from 'node:path';

export const HISTORY_FILE = '.tidy-history.json';

function historyPath(folder) {
  return path.join(folder, HISTORY_FILE);
}

/**
 * Lit l'historique des rangements d'un dossier.
 * @returns {Promise<Array<{ date: string, moves: Array<{ from: string, to: string }> }>>}
 */
export async function readHistory(folder) {
  try {
    const content = await fs.readFile(historyPath(folder), 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/** Écrit l'historique, ou supprime le fichier s'il est vide. */
export async function writeHistory(folder, history) {
  if (history.length === 0) {
    await fs.rm(historyPath(folder), { force: true });
    return;
  }

  await fs.writeFile(historyPath(folder), JSON.stringify(history, null, 2));
}

/**
 * Ajoute un rangement à l'historique.
 * Les chemins sont enregistrés relativement au dossier rangé.
 * @param {string} folder
 * @param {Array<{ from: string, to: string }>} moves - chemins absolus
 */
export async function saveRun(folder, moves) {
  if (moves.length === 0) {
    return;
  }

  const history = await readHistory(folder);

  history.push({
    date: new Date().toISOString(),
    moves: moves.map(({ from, to }) => ({
      from: path.relative(folder, from),
      to: path.relative(folder, to),
    })),
  });

  await writeHistory(folder, history);
}
