import * as fs from 'fs';

import { Config } from './classes/Config';
import { Encoder } from './classes/Encoder';
import { Parser, ParserAccumulation } from './classes/Parser';
import { Transformer } from './classes/Transformer';
import { Writer } from './classes/Writer';

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

        // console.log(Transformer.output);

        Encoder.init();

        // console.log(Encoder.output);

        Encoder.output.forEach((x) => {
            console.log(Encoder.strarr(x));
        });

        await Writer.go(argv.output, argv.filename);

        // console.log(ParserAccumulation.json);

        // fs.writeFileSync(argv.input.replace('.nugg', '.tmp.json'), parser.json);
    } catch (err) {
        console.error('error in main: ', err);
    }
};

main();
