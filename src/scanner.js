import fs from 'node:fs/promises';
import path from 'node:path';
import { classifyByDate, classifyByType } from './classifier.js';

/**
 * Analyse un dossier et retourne où chaque fichier devrait aller.
 * @param {string} folder - le dossier à analyser
 * @param {{ byDate?: boolean }} options
 * @returns {Promise<Array<{ file: string, destination: string }>>}
 */
export async function buildPlan(folder, options = {}) {
    const entries = await fs.readdir(folder, { withFileTypes: true});

    const files = entries.filter((entry) => entry.isFile() && !entry.name.startsWith('.'));

    const plan = [];

    for (const file of files) {
        let destination;

        if(options.byDate) {
            const stats = await fs.stat(path.join(folder, file.name));
            destination = classifyByDate(stats.mtime);
        }
        else {
            destination = classifyByType(file.name);
        }

        plan.push({ file: file.name, destination });
    }

    return plan;
        }    




