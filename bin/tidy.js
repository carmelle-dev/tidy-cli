import { Command } from 'commander';
import { createRequire } from 'node:module';
import path from 'node:path';
import { buildPlan } from '../src/scanner.js';
import { executePlan } from '../src/mover.js';

// Lire la version dans package.json (pour ne pas la recopier à la main)
const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

program
  .name('tidy')
  .description('Range automatiquement un dossier par type de fichier ou par date')
  .version(version) // ajoute automatiquement --version
  .argument('<folder>', 'dossier à ranger') // <...> = obligatoire
  .option('--by-date', 'ranger par année et par mois') // devient options.byDate
    .action(async (folder, options) => {
    try {
      const root = path.resolve(folder);
      const plan = await buildPlan(root, { byDate: options.byDate });

      if (plan.length === 0) {
        console.log('Rien à ranger, le dossier est déjà propre');
        return;
      }

      const moves = await executePlan(root, plan);

      for (const { from, to } of moves) {
        console.log(`${path.basename(from)}  →  ${path.relative(root, to)}`);
      }

      const folderCount = new Set(plan.map((item) => item.destination)).size;
      console.log(`\n${moves.length} fichier(s) rangé(s) dans ${folderCount} dossier(s).`);
    } catch (error) {
      console.error(`Erreur : ${error.message}`);
      process.exit(1);
    }
  });

// Lit les arguments tapés et lance l'action (version async car l'action est async)
await program.parseAsync();