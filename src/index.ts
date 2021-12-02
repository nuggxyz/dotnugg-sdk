import * as fs from 'fs';

import { Config } from './classes/Config';
import { Parser, ParserAccumulation } from './classes/Parser';

const main = async () => {
    try {
        var argv: {
            input: string;
        } = require('minimist')(process.argv.slice(2));

        await Config.init('./reference/onig.wasm', './syntax/dotnugg.tmLanguage.json');

        ParserAccumulation.init(argv.input);

        console.log(ParserAccumulation.json);

        // fs.writeFileSync(argv.input.replace('.nugg', '.tmp.json'), parser.json);
    } catch (err) {
        console.error('error in main: ', err);
    }
};

main();
