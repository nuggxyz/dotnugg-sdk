/* eslint-disable prefer-const */
import * as fs from 'fs';
import * as path from 'path';

import * as plist from 'plist';
import * as oniguruma from 'vscode-oniguruma';
import * as vsctm from 'vscode-textmate';
import dotnuggGrammer from '@nuggxyz/dotnugg-grammar/dotnugg.tmLanguage.json';

// // ES Module
// import fetch from 'node-fetch';

class FuckYouWebpack {
    constructor() {

    }
}

// // @ts-ignore
// global.fetch = fetch;
// // @ts-ignore
// global.Headers = fetch.Headers;
// @ts-ignore
// global.Response = new Array()
// // @ts-ignore
// global.Response = fetch.Response;

// Create a registry that can create a grammar from a scope name.
const registry = () =>
    new vsctm.Registry({
        onigLib: Promise.resolve({
            createOnigScanner: (sources) => new oniguruma.OnigScanner(sources),
            createOnigString: (str) => new oniguruma.OnigString(str),
        }),
        loadGrammar: async () => {

            const res = require('vscode-oniguruma/release/onig.wasm') as ArrayBuffer
                console.log({res})

            //     const aaa = await new Blob(res).arrayBuffer()

            // console.log(aaa)
            // console.log((await res(res)).env)

            // const wasm = fs.readFileSync(path.join(require.resolve('vscode-oniguruma'), '../onig.wasm')).buffer;

            await oniguruma.loadWASM(res ).then(() => {
                return {
                    createOnigScanner(patterns: string[]) {
                        return new oniguruma.OnigScanner(patterns);
                    },
                    createOnigString(s: string) {
                        return new oniguruma.OnigString(s);
                    },
                };
            });

            return vsctm.parseRawGrammar(plist.build(dotnuggGrammer));
        },
    });

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
