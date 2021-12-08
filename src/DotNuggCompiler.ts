import * as path from 'path';

import invariant from 'tiny-invariant';

import { Config } from './classes/Config';
import { Encoder } from './classes/Encoder';
import { Parser } from './classes/Parser';
import { Transformer } from './classes/Transformer';

export class DotNuggCompiler {
    public transformer: Transformer;
    public encoder: Encoder;
    public parser: Parser;

    static inited: boolean = false;

    processed: boolean = false;

    constructor() {
        invariant(DotNuggCompiler.inited, '');
    }

    static async init() {
        if (!DotNuggCompiler.inited) {
            await Config.init(path.join(__dirname, '../reference/onig.wasm'), path.join(__dirname, '../syntax/dotnugg.tmLanguage.json'));

            DotNuggCompiler.inited = true;
        }
    }

    public compileDirectory = (inputdir: string) => {
        invariant(!this.processed, '');

        this.processed = true;

        this.parser = Parser.parseDirectory(inputdir);

        this.transformer = new Transformer(this.parser);

        this.encoder = new Encoder(this.transformer);

        return this;
    };

    public compileFile = (inputpath: string) => {
        invariant(!this.processed, '');

        this.parser = Parser.parsePath(inputpath);

        this.transformer = new Transformer(this.parser);

        this.encoder = new Encoder(this.transformer);

        return this;
    };

    public compileData = (data: string) => {
        invariant(!this.processed, '');

        this.parser = Parser.parseData(data);

        this.transformer = new Transformer(this.parser);

        this.encoder = new Encoder(this.transformer);

        return this;
    };
}
