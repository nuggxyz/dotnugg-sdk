import * as path from 'path';

import { BigNumber } from 'ethers';

import { Builder } from './classes/Builder';
import { Config } from './classes/Config';
import { Encoder } from './classes/Encoder';
import { ParserAccumulation } from './classes/Parser';
import { Transformer } from './classes/Transformer';

export class DotNuggCompiler {
    public static compile = async (inputdir: string): Promise<NL.DotNugg.Compiler.Result[]> => {
        await Config.init(path.join(__dirname, '../reference/onig.wasm'), path.join(__dirname, '../syntax/dotnugg.tmLanguage.json'));

        await ParserAccumulation.init(inputdir);

        Transformer.init();

        Encoder.init();

        return Encoder.output;
    };
}
