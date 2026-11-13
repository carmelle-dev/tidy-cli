# tidy-cli

[![Tests](https://github.com/carmelle-dev/tidy-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/carmelle-dev/tidy-cli/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

> Range automatiquement un dossier en désordre (Téléchargements, Bureau…) par type de fichier ou par date, en une seule commande, **sans jamais perdre un fichier**.

## Fonctionnalités

- **Rangement par type** : images, documents, vidéos, archives, code…
- **Rangement par date** : `2026/11-Novembre/`
- **Mode simulation** (`-n`) : voir ce qui sera fait avant d'agir
- **Annulation** (`-u`) : remettre le dossier exactement comme avant
- **Aucun fichier écrasé** : `photo.jpg` existe déjà ? Le nouveau devient `photo (1).jpg`
- **Résumé** du nombre de fichiers par catégorie

## Installation

Prérequis : [Node.js](https://nodejs.org) 20 ou plus et [pnpm](https://pnpm.io).

```bash
git clone https://github.com/carmelle-dev/tidy-cli.git
cd tidy-cli
pnpm install
pnpm link --global
```

La commande `tidy` est maintenant disponible partout.

## Utilisation

```bash
tidy ~/Téléchargements -n      # 1. simuler : rien n'est déplacé
tidy ~/Téléchargements         # 2. ranger
tidy ~/Téléchargements -u      # 3. annuler si besoin
```

### Options

| Option | Description |
|---|---|
| `-n, --dry-run` | Simule le rangement sans rien déplacer |
| `-u, --undo` | Annule le dernier rangement du dossier |
| `--by-date` | Range par année et par mois au lieu du type |
| `-V, --version` | Affiche la version |
| `-h, --help` | Affiche l'aide |

Les options se combinent : `tidy ~/Téléchargements -u -n` simule une annulation.

### Exemple

```
$ tidy ~/Téléchargements -n

[simulation] facture.pdf  →  Documents/facture.pdf
[simulation] vacances.jpg  →  Images/vacances (1).jpg
[simulation] setup.exe  →  Programmes/setup.exe

Résumé :
  Documents            1 fichier(s)
  Images               1 fichier(s)
  Programmes           1 fichier(s)

3 fichier(s) seraient rangé(s).
Aucun fichier n'a été déplacé. Relance sans -n pour ranger.
```

## Catégories

| Dossier | Extensions |
|---|---|
| Images | `.jpg` `.jpeg` `.png` `.gif` `.webp` `.svg` `.heic` `.avif`… |
| Documents | `.pdf` `.docx` `.xlsx` `.pptx` `.txt` `.md` `.csv` `.odt`… |
| Vidéos | `.mp4` `.mkv` `.avi` `.mov` `.webm` `.srt` |
| Musique | `.mp3` `.wav` `.flac` `.m4a` `.ogg` |
| Archives | `.zip` `.rar` `.7z` `.tar` `.gz` `.xz`… |
| Programmes | `.exe` `.msi` `.deb` `.dmg` `.apk` `.appimage` `.run` |
| Code | `.js` `.ts` `.tsx` `.py` `.json` `.html` `.css` `.sql`… |
| Autres | tout le reste |

Les fichiers cachés (`.bashrc`…) et les dossiers existants ne sont jamais déplacés.

## Comment tidy protège vos fichiers

- **Jamais d'écrasement** : avant chaque déplacement, tidy vérifie que le nom est libre et ajoute `(1)`, `(2)`… si besoin.
- **Simulation fidèle** : le mode `-n` utilise exactement le même code que le vrai rangement et prédit même les renommages.
- **Historique** : chaque rangement est enregistré dans un fichier caché `.tidy-history.json`, dans le dossier rangé. `--undo` l'utilise pour tout remettre en place, puis supprime les dossiers devenus vides (jamais ceux qui contiennent d'autres fichiers).

## Architecture

```
bin/tidy.js            → interface en ligne de commande (commander)
src/
├── classifier.js      → décide la catégorie d'un fichier
├── scanner.js         → lit un dossier et construit le plan
├── mover.js           → exécute le plan (ou le simule)
├── history.js         → enregistre l'historique des rangements
├── undo.js            → annule le dernier rangement
├── summary.js         → résumé par catégorie
└── constants/         → table des extensions
```

Le code sépare **décider** (`classifier`, `scanner`) et **agir** (`mover`, `undo`), ce qui rend chaque partie simple à tester.

## Tests

```bash
pnpm test          # lance tous les tests
pnpm test:watch    # relance les tests à chaque modification
```

Les tests utilisent [Vitest](https://vitest.dev) et des dossiers temporaires : ils ne touchent jamais à vos vrais fichiers. Ils couvrent les fonctions une par une (tests unitaires) et la commande complète (tests d'intégration).

## Idées pour la suite

- [ ] Fichier de configuration pour définir ses propres règles
- [ ] Mode `--watch` : ranger automatiquement chaque nouveau fichier
- [ ] Détection des doublons par contenu
- [ ] Publication sur npm

## Licence

[MIT](LICENSE) © carmelle-dev
