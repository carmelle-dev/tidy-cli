import { Command } from 'commander';
import { createRequire } from 'node:module';
import path from 'node:path';
import { buildPlan } from '../src/scanner.js';

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
      // path.resolve transforme "." ou "../x" en chemin absolu
      const plan = await buildPlan(path.resolve(folder), { byDate: options.byDate });

      for (const { file, destination } of plan) {
        console.log(`${file}  →  ${destination}/`);
      }

      console.log(`\n${plan.length} fichier(s) analysé(s).`);
    } catch (error) {

      console.error(`Erreur : ${error.message}`);
      process.exit(1);
    }
  });

// Lit les arguments tapés et lance l'action (version async car l'action est async)
await program.parseAsync();