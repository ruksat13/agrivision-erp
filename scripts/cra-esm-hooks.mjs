// Node ESM loader hooks that let a script import src/services directly.
//
// scripts/seed.mjs carries a note saying it "cannot import src/services (ES
// modules inside a CRA tree)", and that is true of a plain `import`. Two things
// stop Node:
//
//   1. `import { listSales } from './sales'` — webpack resolves an extensionless
//      relative specifier, Node does not.
//   2. package.json has no `"type": "module"`, because it is a Create React App
//      project, so Node treats every .js file as CommonJS and chokes on the
//      `export` keyword.
//
// Both are resolvable with the hooks API rather than by transpiling, which is
// why verify-rules.mjs can test the REAL query a screen sends instead of a copy
// of it maintained by hand. A copy would be the more dangerous half of the
// thing that script exists to prevent: it would go on passing after the service
// function it is meant to be checking had drifted.
//
// Register with:
//   import { register } from 'node:module';
//   register('./cra-esm-hooks.mjs', import.meta.url);
//   const services = await import('../src/services/index.js');
//
// Scoped to this project's own src/ so nothing here changes how node_modules
// loads — firebase reaches CommonJS files under node_modules whose paths also
// contain "/src/".

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HAS_EXTENSION = /\.[cm]?[jt]sx?$/i;

// Only this project's own src/ is treated as ESM. The first version tested for
// '/src/' anywhere in the URL and swallowed node_modules/@grpc/grpc-js/build/
// src/index.js, a CommonJS file that firebase pulls in on Node — "ReferenceError:
// exports is not defined in ES module scope". Anchored to the directory beside
// this file, so nothing outside the repo can match.
const APP_SRC = new URL('../src/', import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !HAS_EXTENSION.test(specifier)) {
        for (const candidate of [`${specifier}.js`, `${specifier}/index.js`]) {
            const url = new URL(candidate, context.parentURL);
            if (existsSync(fileURLToPath(url))) {
                return { url: url.href, format: 'module', shortCircuit: true };
            }
        }
    }
    return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
    if (url.startsWith(APP_SRC) && url.endsWith('.js')) {
        return nextLoad(url, { ...context, format: 'module' });
    }
    return nextLoad(url, context);
}
