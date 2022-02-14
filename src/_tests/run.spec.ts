import * as fs from 'fs';
import * as path from 'path';

import { ethers } from 'ethers';

import { dotnugg } from '..';

describe('main', () => {
    it('hello', async () => {
        await dotnugg.parser.init();

        const txt = fs.readFileSync(path.join(__dirname, './assets/sample.1.item.nugg'), 'utf8');

        // console.log('hello');

        const p = dotnugg.parser.parseData(txt);

        // console.log(p.results.items[0].value.versions.value[0].value.data.value.matrix.length);
    });

    it('compile test', async () => {
        await dotnugg.compiler.init();

        dotnugg.compiler.compileDirectoryCheckCache(path.join(__dirname, './assets'));
    });

    it('compile test', async () => {
        await dotnugg.compiler.init();

        const comp = await dotnugg.compiler.compileDirectoryCheckCacheAndRender(
            '0xcbfE2DF1355628Ff7525ae69C31DC708A1b03D40',
            new ethers.providers.InfuraProvider('goerli', 'a1625b39cf0047febd415f9b37d8c931'),
            path.join(__dirname, './assets'),
        );

        console.log(comp.render);
    });
});
