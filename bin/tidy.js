#!/usr/bin/env node
import { Command } from 'commander';
import { createRequire } from 'node:module';
import path from 'node:path';
import { saveRun } from '../src/history.js';
import { executePlan } from '../src/mover.js';
import { buildPlan } from '../src/scanner.js';
import { countByDestination } from '../src/summary.js';
import { undoLastRun } from '../src/undo.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

program
  .name('tidy')
  .description('Range automatiquement un dossier par type de fichier ou par date')
  .version(version)
  .argument('<folder>', 'dossier à ranger')
  .option('--by-date', 'ranger par année et par mois')
  .option('-n, --dry-run', 'simuler sans rien déplacer')
  .option('-u, --undo', 'annuler le dernier rangement de ce dossier')
  .action(async (folder, options) => {
    try {
      const root = path.resolve(folder);
      const dryRun = Boolean(options.dryRun);
      const prefix = dryRun ? '[simulation] ' : '';

      // ----- Mode annulation -----
      if (options.undo) {
        const result = await undoLastRun(root, { dryRun });

        if (!result) {
          console.log('Rien à annuler pour ce dossier.');
          return;
        }

        for (const { from, to } of result.restored) {
          console.log(`${prefix}${path.relative(root, from)}  →  ${path.relative(root, to)}`);
        }

        for (const { to } of result.skipped) {
          console.log(`⚠️  Introuvable, ignoré : ${to}`);
        }

        const verb = dryRun ? 'seraient remis' : 'remis';
        console.log(`\n${result.restored.length} fichier(s) ${verb} à leur place.`);
        return;
      }

      // ----- Mode rangement -----
      const plan = await buildPlan(root, { byDate: options.byDate });

      if (plan.length === 0) {
        console.log('Rien à ranger, le dossier est déjà propre ✨');
        return;
      }

      const moves = await executePlan(root, plan, { dryRun });

      if (!dryRun) {
        await saveRun(root, moves);
      }

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
        console.log("Aucun fichier n'a été déplacé. Relance sans -n pour ranger.");
      } else {
        console.log('Pour annuler : tidy <dossier> --undo');
      }
    } catch (error) {
      console.error(`Erreur : ${error.message}`);
      process.exit(1);
    }
  });

await program.parseAsync();
