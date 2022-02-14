/* eslint-disable prefer-const */
import * as fs from 'fs';
import * as path from 'path';

import { _fetchData } from 'ethers/lib/utils';

import * as TransformTypes from '../../builder/types/TransformTypes';
import { dotnugg } from '../..';

type DotnuggCachedFile = {
    mtimeMs: number;
    parser: TransformTypes.Item;
    renderer: string;
};

type DotnuggCacheRead = {
    timestamp: number;
    files: { [_: string]: DotnuggCachedFile };
};

export class Cacher {
    private static dir: string;

    private static working: { [_: string]: DotnuggCacheRead } = {};

    private static liveStats: { [_: string]: { mtimeMs: number; path: string } } = {};

    private static updateStats() {
        this.liveStats = this.getFilesInDir(this.dir);
    }

    public static load(dir: string) {
        try {
            let rawdata = fs.readFileSync(path.join(dir, dotnugg.constants.paths.DEFAULT_CACHE_FILENAME), 'utf8');
            let tmp = JSON.parse(rawdata);

            if (!tmp[`${undefined}`]) {
                this.working = tmp;
            }
        } catch (err) {
            console.log('no cache file found at: ', path.join(dir, dotnugg.constants.paths.DEFAULT_CACHE_FILENAME));
        }
    }

    public static getFilesInDir(dir: string): { [_: string]: { mtimeMs: number; path: string } } {
        let res = {};

        try {
            const files = fs.readdirSync(dir);

            // Loop them all with the new for...of
            for (const file of files) {
                // Get the full paths
                const fromPath = path.join(dir, file);
                // Stat the file to see if we have a file or dir
                const stat = fs.statSync(fromPath);
                // console.log('checking...', file);

                if (stat.isFile() && file.endsWith('.nugg')) {
                    res[`${file}`] = { mtimeMs: stat.mtimeMs, path: fromPath };
                } else if (stat.isDirectory() && !file.startsWith('.')) {
                    res = { ...res, ...this.getFilesInDir(fromPath) };
                }
            }
        } catch (err) {}

        return res;
    }
}
