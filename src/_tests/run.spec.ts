import * as fs from 'fs';
import * as path from 'path';

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
});
