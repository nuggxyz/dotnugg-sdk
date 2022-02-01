import invariant from 'tiny-invariant';

import { dotnugg } from '../..';
import { Builder } from '../../builder';

export class Compiler extends Builder {
    processed: boolean = false;

    public static async init() {
        await dotnugg.parser.init();
    }

    public static compileDirectory = (inputdir: string): Compiler => {
        invariant(dotnugg.parser.inited, 'PARSER:NOT:INIT');

        console.log('compiling directory: ', inputdir);

        let parser = dotnugg.parser.parseDirectory(inputdir);

        let me = this.fromString(parser.json) as Compiler;

        me.processed = true;

        return me;
    };

    public static compileDirectoryWithCache = (inputdir: string) => {
        invariant(dotnugg.parser.inited, 'PARSER:NOT:INIT');

        console.log('compiling directory checking cache: ', inputdir);

        let doc = dotnugg.parser.parseDirectoryCheckCache(inputdir);

        let me = dotnugg.builder.fromObject(doc) as Compiler;

        me.processed = true;

        return me;
    };

    public static compileFile = (inputpath: string) => {
        invariant(dotnugg.parser.inited, 'PARSER:NOT:INIT');

        let parser = dotnugg.parser.parsePath(inputpath);

        let me = dotnugg.builder.fromString(parser.json) as Compiler;

        me.processed = true;

        return me;
    };

    public static compileData = (data: string) => {
        invariant(dotnugg.parser.inited, 'PARSER:NOT:INIT');

        let parser = dotnugg.parser.parseData(data);

        let me = dotnugg.builder.fromString(parser.json) as Compiler;

        me.processed = true;

        return me;
    };

    public static parseData = (data: string) => {
        invariant(dotnugg.parser.inited, 'PARSER:NOT:INIT');

        return dotnugg.parser.parseData(data);
    };
}