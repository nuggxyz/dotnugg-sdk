import * as fs from 'fs';

import { Config } from './classes/Config';
import { Parser } from './classes/Parser';

const main = async () => {
    try {
        var argv: {
            input: string;
        } = require('minimist')(process.argv.slice(2));

        await Config.init('./reference/onig.wasm', './syntax/dotnugg.tmLanguage.json');

        const parser = Parser.init(argv.input);
        parser.compile();

        console.log(parser.json);

        // fs.writeFileSync(argv.input.replace('.nugg', '.tmp.json'), parser.json);
    } catch (err) {
        console.error('error in main: ', err);
    }
};

main();
