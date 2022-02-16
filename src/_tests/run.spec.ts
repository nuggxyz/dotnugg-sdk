import * as fs from 'fs';
import * as path from 'path';
import { setTimeout } from 'timers/promises';

import { ethers } from 'ethers';

import { dotnugg } from '..';

describe('main', () => {
    it('hello', async () => {
        await dotnugg.parser.init();

        const txt = fs.readFileSync(path.join(__dirname, './assets/sample.1.item.nugg'), 'utf8');

        // console.log('hello');

        const p = dotnugg.parser.parseData(txt);
        console.log(p.results.items[0].value);
        // console.log(p.results.items[0].value.versions.value[0].value.data.value.matrix.length);
    });

    it('compile test', async () => {
        await dotnugg.compiler.init();

        dotnugg.compiler.compileDirectoryCheckCache(path.join(__dirname, './assets'));
    });

    it('compile test', async () => {
        await dotnugg.compiler.init();

        const comp = dotnugg.compiler.compileDirectoryCheckCacheAndRender(
            '0xcbfE2DF1355628Ff7525ae69C31DC708A1b03D40',
            new ethers.providers.InfuraProvider('goerli', 'a1625b39cf0047febd415f9b37d8c931'),
            path.join(__dirname, './assets'),
        );

        await comp.renderer.wait();

        console.log(comp.renderer.results);
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
