import fs from 'node:fs/promises';
import path from 'node:path';

export async function exists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Renvoie un chemin libre : "photo.jpg", sinon "photo (1).jpg", "phot (2).jpg" ...
 * @param {string} targetPath
 * @returns {Promise<string>}
 */


export async function getAvailablePath(targetPath) {
    const { dir, name, ext } = path.parse(targetPath);

let candidate = targetPath;
let counter = 1;

while (await exists(candidate)) {
    candidate = path.join(dir, `${name} (${counter})${ext}`);
    counter++;

}
 return candidate;
}




/**
 * Exécute un plan de rangement : crée les dossiers déplace les fichiers.
 * @param  {string} folder - le dossier rangé
 * @param {Array<{ file: string, destination: string }>} plan 
 * @returns {Promise<Array<{ from: string, to: string }>>} les déplacements effectués
 
 */
export async function executePlan(folder, plan) {
    const moves = [];

    for (const {file, destination } of plan)
 {
    const from = path.join(folder, file);
    const targetDir = path.join(folder, destination);

    await fs.mkdir(targetDir, { recursive: true});

    const to = await getAvailablePath(path.join(targetDir, file));
    await fs.rename(from, to);

    moves.push({ from, to});
 }
 return moves;
}