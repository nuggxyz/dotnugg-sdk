import * as path from 'path';

import invariant from 'tiny-invariant';

import { Config } from './classes/Config';
import { Encoder } from './classes/Encoder';
import { Parser } from './classes/Parser';
import { Transformer } from './classes/Transformer';

export { Parser, Encoder, Transformer };

export class Compiler {
    public transformer: Transformer | undefined;
    public encoder: Encoder | undefined;
    public parser: Parser | undefined;

    static inited: boolean = false;

    processed: boolean = false;

    constructor() {
        invariant(Compiler.inited, 'COMP:NOT:INIT');
    }

    static async init() {
        if (!Compiler.inited) {
            await Config.init(
                path.join(__dirname, '../../reference/onig.wasm'),
                path.join(__dirname, '../../syntax/dotnugg.tmLanguage.json'),
            );

            Compiler.inited = true;
        }
    }

    public static compileDirectory = (inputdir: string) => {
        console.log('compiling directory: ', inputdir);

        let comp = new Compiler();

        comp.processed = true;

        comp.parser = Parser.parseDirectory(inputdir);

        comp.transformer = Transformer.fromParser(comp.parser!);

        comp.encoder = new Encoder(comp.transformer);

        return comp;
    };

    public static compileDirectoryWithCache = (inputdir: string) => {
        console.log('compiling directory checking cache: ', inputdir);

        let comp = new Compiler();

        comp.processed = true;

        comp.transformer = Transformer.fromObject(Parser.parseDirectoryCheckCache(inputdir));

        comp.encoder = new Encoder(comp.transformer);

        return comp;
    };

    public static compileFile = (inputpath: string) => {
        let comp = new Compiler();

        comp.parser = Parser.parsePath(inputpath);

        comp.transformer = Transformer.fromParser(comp.parser!);

        comp.encoder = new Encoder(comp.transformer);

        return comp;
    };

    public static compileData = (data: string) => {
        let comp = new Compiler();

        comp.parser = Parser.parseData(data);

        comp.transformer = Transformer.fromParser(comp.parser!);

        comp.encoder = new Encoder(comp.transformer);

        return comp;
    };

    public static parseData = (data: string) => {
        let comp = new Compiler();

        comp.parser = Parser.parseData(data);

        return comp;
    };
}
