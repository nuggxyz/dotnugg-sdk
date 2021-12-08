import * as fs from 'fs';

import { Config } from './classes/Config';
import { Encoder } from './classes/Encoder';
import { Parser, ParserAccumulation } from './classes/Parser';
import { Transformer } from './classes/Transformer';
import { Writer } from './classes/Writer';
import { Builder } from './classes/Builder';

const main = async () => {
    try {
        var argv: {
            input: string;
            output: string;
            filename: string;
        } = require('minimist')(process.argv.slice(2));

        await Config.init('./reference/onig.wasm', './syntax/dotnugg.tmLanguage.json');

        await ParserAccumulation.init(argv.input);

        Transformer.init();

        Encoder.init();
    } catch (err) {
        console.error('error in main: ', err);
    }
};

main();
