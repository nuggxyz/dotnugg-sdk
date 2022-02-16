import * as fs from 'fs';
import * as path from 'path';

import { ethers } from 'ethers';

import { IDotnuggV1Resolver, IDotnuggV1Resolver__factory } from '../../typechain';
import { dotnugg } from '../..';

export class Renderer {
    private _instance: IDotnuggV1Resolver;

    // now
    public promisedResults: { [_: string]: { mtimeMs: number; data: Promise<string> } };

    // before
    public results: { [_: string]: { mtimeMs: number; data: string } };

    public async wait() {
        await Promise.all(
            Object.values(this.promisedResults).map(async (x) => {
                await x.data;
            }),
        );

        this.results = this.promisedResults as any;
    }
    private constructor(addr: string, prov: ethers.providers.InfuraProvider) {
        this._instance = new ethers.Contract(addr, IDotnuggV1Resolver__factory.abi, prov) as IDotnuggV1Resolver;
    }

    public async renderOnChain(data: ethers.BigNumber[], base64: boolean): Promise<string> {
        return await this._instance['combo(uint256[],bool)'](data, base64);
    }

    public static renderCheckCache(
        addr: string,
        prov: ethers.providers.InfuraProvider,
        dir: string,
        files: { data: ethers.BigNumber[]; path: string; mtimeMs: number }[],
    ) {
        let me = new Renderer(addr, prov);
        // let files = Cacher.getFilesInDir(dir);
        let cacheUpdated = false;

        let cache: { [_: string]: { mtimeMs: number; data: Promise<string> } } = {};

        let cachedamt = 0;
        let renderedamt = 0;

        try {
            let rawdata = fs.readFileSync(path.join(dir, dotnugg.constants.paths.DEFAULT_RENDERER_CACHE_FILENAME), 'utf8');
            cache = JSON.parse(rawdata);

            if (cache[`${undefined}`]) cache = {};
        } catch (err) {
            console.log('no cache file found at: ', path.join(dir, dotnugg.constants.paths.DEFAULT_RENDERER_CACHE_FILENAME));
        }

        for (var i = 0; i < files.length; i++) {
            const { path, data, mtimeMs } = files[i];

            if (cache[path]) {
                if (mtimeMs && mtimeMs === cache[path].mtimeMs) {
                    cachedamt++;
                    continue;
                }
            }

            cache[path] = { mtimeMs, data: me.renderOnChain(data, true) };

            renderedamt++;
            cacheUpdated = true;
        }

        console.log(`rendered ${renderedamt} files and loaded ${cachedamt} rendered files from cache`);

        if (cacheUpdated) {
            console.log('updating render cache at: ', path.join(dir, dotnugg.constants.paths.DEFAULT_RENDERER_CACHE_FILENAME));
            fs.writeFileSync(path.join(dir, dotnugg.constants.paths.DEFAULT_RENDERER_CACHE_FILENAME), JSON.stringify(cache));
        } else {
            console.log('No need to update dotnugg render cache');
        }

        return me;
    }
}
