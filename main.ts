// Midnight Vault — the entrypoint the grader runs (Node 22, standard
// library only). The game is the static files under game/, and the
// screenshots under screenshots/. This program copies both into the output
// directory the harness points at and writes /output/dossier.json, the
// summary the judge reads, with the vendored make.fun library.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps mirror the gate: at most 4 screenshots of 256 KiB, at most 993
// game files totalling 48 MiB, paths under 1000 bytes, dossier text capped
// at 160 KiB. A run that breaks one refuses the entry instead of handing
// in a dossier the gate would refuse.
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};
const dossier = buildDossier(out, caps);
// The grader runs this program twice and both runs must write the same
// bytes, so prove the dossier is deterministic before handing it in: a
// second build from the same files must match the first byte for byte.
const dossierAgain = buildDossier(out, caps);
if (Buffer.compare(dossier, dossierAgain) !== 0) {
  throw new Error('dossier is not deterministic across builds');
}
writeFileSync(join(out, 'dossier.json'), dossier);
