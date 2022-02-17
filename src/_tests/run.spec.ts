import * as fs from 'fs';
import * as path from 'path';

import { ethers } from 'ethers';

import { dotnugg } from '..';

describe('main', () => {
    it('hello', async () => {
        await dotnugg.parser.init('other/test');

        const txt = fs.readFileSync(path.join(__dirname, './assets/sample.1.item.nugg'), 'utf8');

        // console.log('hello');

        const p = dotnugg.parser.parseData(txt);
        console.log(p.results.items[0].value);
        // console.log(p.results.items[0].value.versions.value[0].value.data.value.matrix.length);
    });

    it('compile test', async () => {
        await dotnugg.parser.init('other/test');

        const comp = dotnugg.compiler.compileDirectoryCheckCacheAndRender(
            '0xcbfE2DF1355628Ff7525ae69C31DC708A1b03D40',
            new ethers.providers.InfuraProvider('goerli', 'a1625b39cf0047febd415f9b37d8c931'),
            path.join(__dirname, '../../../nuggft-art'),
        );

        await comp.renderer.wait();

        // const comp = dotnugg.compiler.compileDirectoryCheckCache(path.join(__dirname, '../../../nuggft-art'));

        // console.log(comp.compileTimeBytecodeEncoded);
    });

    it('builder cache test', async () => {
        const dir = path.join(__dirname, '../../../nuggft-art');

        await dotnugg.parser.init('other/test1');
        const comp = dotnugg.compiler.compileDirectoryCheckCache(dir);
        comp.saveToCache(dir);

        await dotnugg.parser.init('other/test2');

        const cache = dotnugg.builder.readFromExternalCache(dir, 'other/test1');

        // console.log(cache.compileTimeBytecode);

        console.log(cache.compileTimeBytecodeEncoded);
    });

    it('injector test', async () => {
        const parser = dotnugg.parser.parsePath(path.join(__dirname, './assets/sample.1.item.nugg'));

        // dotnugg.injector.injectFeatureType(parser.results.items[0], 'HELLO');
        // dotnugg.injector.injectAnchorX(parser.results.items[0], 23);
        // dotnugg.injector.injectAnchorY(parser.results.items[0], 44);
    });

    // it('watcher test', async () => {
    //     const watcher = dotnugg.watcher.watch(
    //         path.join(__dirname, './assets/'),
    //         '0xcbfE2DF1355628Ff7525ae69C31DC708A1b03D40',
    //         new ethers.providers.InfuraProvider('goerli', 'a1625b39cf0047febd415f9b37d8c931'),
    //         (name: string) => {
    //             console.log('start', name);
    //         },
    //         (name: string) => {
    //             console.log('end', name);
    //         },
    //     );
    //     console.log('ended');

    //     await setTimeout(30000, 'hope');
    // });
});
