/* eslint-disable prefer-const */
import * as fs from 'fs';
import * as path from 'path';

import * as oniguruma from 'vscode-oniguruma';
import * as vsctm from 'vscode-textmate';
import * as plist from 'plist';
import * as dng from '@nuggxyz/dotnugg-grammar';

// Create a registry that can create a grammar from a scope name.
const registry = () =>
    new vsctm.Registry({
        onigLib: Promise.resolve({
            createOnigScanner: (sources) => new oniguruma.OnigScanner(sources),
            createOnigString: (str) => new oniguruma.OnigString(str),
        }),
        loadGrammar: async () => {
            const wasm = fs.readFileSync(path.join(require.resolve('vscode-oniguruma'), '../onig.wasm')).buffer;

            await oniguruma.loadWASM(wasm).then(() => {
                return {
                    createOnigScanner(patterns: string[]) {
                        return new oniguruma.OnigScanner(patterns);
                    },
                    createOnigString(s: string) {
                        return new oniguruma.OnigString(s);
                    },
                };
            });

            return vsctm.parseRawGrammar(await dng.asPlist());

            // return readJSON2plist(dotnuggPath)
            //     .then((data) => {
            //     })
            //     .catch((e) => {
            //         throw new Error(e);
            //     });
        },
    });

/**
 * Read a json file and convert to plist as a promise
 */
function readJSON2plist(path: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        fs.readFile(path, (error, data) => {
            if (error) {
                reject(error);
            } else {
                const js_g = data.toString();
                const pl_g = plist.build(JSON.parse(js_g));
                resolve(pl_g);
            }
        });
    });
}

export class Config {
    /**
     * Utility to read a file as a promise
     */

    static _grammer: vsctm.IGrammar;
    static _registry: vsctm.Registry;

    static async init() {
        Config._registry = registry();

        const tmp = await Config._registry.loadGrammar('source.dotnugg');
        if (tmp !== null) Config._grammer = tmp;
    }

    static async reinit() {
        const tmp = await Config._registry.loadGrammar('source.dotnugg');
        if (tmp !== null) Config._grammer = tmp;
        return Config._grammer;
    }

    static get registry() {
        return Config._registry;
    }

    static get grammer() {
        return Config._grammer;
    }
}
