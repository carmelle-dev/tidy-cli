import { Command } from 'commander';
import { createRequire } from 'node:module';
import path from 'node:path';
import { buildPlan } from '../src/scanner.js';
import { executePlan } from '../src/mover.js';
import { countByDestination } from '../src/summary.js';

// Lire la version dans package.json (pour ne pas la recopier à la main)
const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

program
  .name('tidy')
  .description('Range automatiquement un dossier par type de fichier ou par date')
  .version(version) // ajoute automatiquement --version
  .argument('<folder>', 'dossier à ranger') // <...> = obligatoire
  .option('-n, --dry-run', 'simuler le rangement sans rien déplacer')
  .action(async (folder, options) => {
    try {
      const root = path.resolve(folder);
      const plan = await buildPlan(root, { byDate: options.byDate });

      if (plan.length === 0) {
        console.log('Rien à ranger, le dossier est déjà propre');
        return;
      }

      const dryRun = Boolean(options.dryRun);
      const moves = await executePlan(root, plan, { dryRun });

      const prefix = dryRun ? '[simulation] ' : '';
      for (const { from, to } of moves) {
        console.log(`${prefix}${path.basename(from)}  →  ${path.relative(root, to)}`);
      }

      console.log('\nRésumé :');
      for (const [destination, count] of countByDestination(plan)) {
        console.log(`  ${destination.padEnd(20)} ${count} fichier(s)`);
      }

      const verb = dryRun ? 'seraient rangé(s)' : 'rangé(s)';
      console.log(`\n${moves.length} fichier(s) ${verb}.`);

      if (dryRun) {
        console.log("Aucun fichier n'a été déplacé. Relance sans --dry-run pour ranger.");
      }
    } catch (error) {
      console.error(`Erreur : ${error.message}`);
      process.exit(1);
    }
  });

// Lit les arguments tapés et lance l'action (version async car l'action est async)
await program.parseAsync();