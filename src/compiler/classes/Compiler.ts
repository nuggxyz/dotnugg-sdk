import { ethers } from 'ethers';
import invariant from 'tiny-invariant';

import { dotnugg } from '../..';
import { Builder } from '../../builder';

export class Compiler extends Builder {
    processed: boolean = false;

    public renderer: dotnugg.renderer;

    public static compileDirectory = (inputdir: string): Compiler => {
        dotnugg.utils.invariantVerbose(dotnugg.parser.inited, 'PARSER:NOT:INIT');

        console.log('compiling directory: ', inputdir);

        let parser = dotnugg.parser.parseDirectory(inputdir);

        let me = this.fromString(parser.json) as Compiler;

        me.processed = true;

        return me;
    };

    public static compileDirectoryCheckCache = (inputdir: string) => {
        dotnugg.utils.invariantVerbose(dotnugg.parser.inited, 'PARSER:NOT:INIT');

        console.log('compiling directory checking cache: ', inputdir);

        let doc = dotnugg.parser.parseDirectoryCheckCache(inputdir);

        let me = dotnugg.builder.fromObject(doc) as Compiler;

        me.processed = true;

        return me;
    };

    public static compileDirectoryCheckCacheAndRender = (
        contractAddr: string,
        provider: ethers.providers.InfuraProvider,
        inputdir: string,
    ) => {
        dotnugg.utils.invariantVerbose(dotnugg.parser.inited, 'PARSER:NOT:INIT');

        console.log('compiling directory checking cache and render: ', inputdir);

        let doc = dotnugg.parser.parseDirectoryCheckCache(inputdir);

        let me = dotnugg.builder.fromObject(doc) as Compiler;

        me.renderer = dotnugg.renderer.renderCheckCache(contractAddr, provider, inputdir, me);

        me.processed = true;

        return me;
    };

    public static compileDirectoryCheckCacheAndRenderAsync = async (
        contractAddr: string,
        provider: ethers.providers.InfuraProvider,
        inputdir: string,
    ) => {
        dotnugg.utils.invariantVerbose(dotnugg.parser.inited, 'PARSER:NOT:INIT');

        console.log('compiling directory checking cache and render: ', inputdir);

        let doc = dotnugg.parser.parseDirectoryCheckCache(inputdir);

        let me = dotnugg.builder.fromObject(doc) as Compiler;

        me.renderer = await dotnugg.renderer.renderCheckCacheAsync(contractAddr, provider, inputdir, me);

        me.processed = true;

        return me;
    };

    public static compileFile = (inputpath: string) => {
        dotnugg.utils.invariantVerbose(dotnugg.parser.inited, 'PARSER:NOT:INIT');

        let parser = dotnugg.parser.parsePath(inputpath);

        let me = dotnugg.builder.fromString(parser.json) as Compiler;

        me.processed = true;

        return me;
    };

    public static compileData = (data: string) => {
        dotnugg.utils.invariantVerbose(dotnugg.parser.inited, 'PARSER:NOT:INIT');

        let parser = dotnugg.parser.parseData(data);

        let me = dotnugg.builder.fromString(parser.json) as Compiler;

        me.processed = true;

        return me;
    };

    public static parseData = (data: string) => {
        dotnugg.utils.invariantVerbose(dotnugg.parser.inited, 'PARSER:NOT:INIT');

        return dotnugg.parser.parseData(data);
    };
}
