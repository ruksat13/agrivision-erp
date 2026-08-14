#!/usr/bin/env node
/**
 * Load a rules file into the RUNNING Firestore emulator, without touching
 * firebase.json or firestore.rules.
 *
 *   node scripts/emulator-rules.mjs dev     # permissive — needed to seed
 *   node scripts/emulator-rules.mjs real    # the production rules
 *
 * Why this exists: firebase.json points the emulator at firestore.rules, which
 * are the real rules. Those deny everything until Firebase Auth is connected
 * and users/ is seeded — including the seed script itself. Rather than edit the
 * real rules back and forth, this pushes rules straight into the running
 * emulator over its admin API.
 *
 * `dev` mirrors the development rules commented at the top of firestore.rules.
 */

import { readFileSync } from 'fs';

const PROJECT = process.env.GCLOUD_PROJECT || 'agrivision-erp';
const HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const which = process.argv[2] || 'dev';

const DEV_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

const content = which === 'real'
    ? readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8')
    : DEV_RULES;

const res = await fetch(
    `http://${HOST}/emulator/v1/projects/${PROJECT}:securityRules`,
    {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: { files: [{ name: 'firestore.rules', content }] } }),
    },
);

if (!res.ok) {
    console.error(`Failed to load ${which} rules: ${res.status} ${await res.text()}`);
    process.exit(1);
}

console.log(`Emulator now running the ${which.toUpperCase()} rules.`);
if (which === 'dev') {
    console.log('These are wide open. They exist only so the emulator can be seeded.');
}
