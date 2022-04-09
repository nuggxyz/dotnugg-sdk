import * as fs from 'fs';
import * as path from 'path';

import { ethers } from 'ethers';

import { IDotnuggV1Resolver, IDotnuggV1Resolver__factory } from '../../typechain';
import { dotnugg } from '../..';
import { Config } from '../../parser/classes/Config';
import { Output } from '../../builder/types/BuilderTypes';

export class Renderer {
    private _instance: IDotnuggV1Resolver;

    // now
    public promisedResults: { [_: string]: { mtimeMs: number; data: Promise<string> } };
    public cacheUpdated = false;
    private cachepath: string;
    // before
    public results: { [_: string]: { mtimeMs: number; data: string } };

    public async wait() {
        this.results = (
            await Promise.all(
                Object.entries(this.promisedResults).map(async (x) => {
                    const data = await x[1].data;
                    return { data, name: x[0], mtimeMs: x[1].mtimeMs };
                }),
            )
        ).reduce((prev, curr) => {
            return { ...prev, [curr.name]: { data: curr.data, mtimeMs: curr.mtimeMs } };
        }, {});

        if (this.cacheUpdated) {
            console.log('updating render cache at: ', this.cachepath);
            dotnugg.utils.ensureDirectoryExistence(this.cachepath);

            fs.writeFileSync(this.cachepath, JSON.stringify(this.results));
        } else {
            console.log('No need to update dotnugg render cache');
        }
    }
    private constructor(addr: string, prov: ethers.providers.InfuraProvider) {
        this._instance = new ethers.Contract(addr, IDotnuggV1Resolver__factory.abi, prov) as IDotnuggV1Resolver;
    }

    public async renderOnChain(data: ethers.BigNumber[], base64: boolean): Promise<string> {
        return await this._instance['combo(uint256[],bool)'](data, base64);
    }

    public static renderCheckCache(addr: string, prov: ethers.providers.InfuraProvider, dir: string, builder: dotnugg.builder) {
        let me = new Renderer(addr, prov);
        me.cachepath = Config.cachePath(dir, 'renderer');
        // me.cachepath = Cacher.getFilesInDir(dir);

        let cache: { [_: string]: { mtimeMs: number; data: Promise<string> } } = {};

        let cachedamt = 0;
        let renderedamt = 0;

        try {
            let rawdata = fs.readFileSync(me.cachepath, 'utf8');
            cache = JSON.parse(rawdata);

            if (cache[`${undefined}`]) cache = {};
        } catch (err) {
            console.log('no cache file found at: ', me.cachepath);
        }

        for (var i = 0; i < builder.output.length; i++) {
            const { fileUri, mtimeMs } = builder.output[i];
            if (cache[fileUri]) {
                if (mtimeMs && mtimeMs === cache[fileUri].mtimeMs) {
                    cachedamt++;
                    continue;
                }
            }

            // console.log(i, builder.outputByItemIndex);

            cache[fileUri] = { mtimeMs, data: me.renderOnChain(builder.hexArray(builder.output[i]), true) };

            renderedamt++;
            me.cacheUpdated = true;
        }

        console.log(`rendered ${renderedamt} files and must "wait()" to save ${cachedamt} rendered files to cache`);

        me.promisedResults = cache;

        return me;
    }
}
