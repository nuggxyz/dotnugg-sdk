import * as fs from 'fs';

import { InfuraProvider } from '@ethersproject/providers';

import { dotnugg } from '../..';
import * as TransformTypes from '../../builder/types/TransformTypes';
import { AppName } from '../../types';

export class Watcher {
    public parsedDocument: TransformTypes.Document;

    public builder: dotnugg.builder;

    public renderer: dotnugg.renderer;

    private listener: fs.FSWatcher;

    private constructor(
        appname: AppName,
        directory: string,
        contractAddr?: string,
        provider?: InfuraProvider,
        onFileChangeCallback?: (fileUri: string) => void,
        onMemoryUpdateCallback?: (fileUri: string) => void,
    ) {
        dotnugg.parser.init(appname);

        this.listener = fs.watch(directory, {}, (event: 'rename' | 'change', filename) => {
            console.log(filename, event);
            if (filename.endsWith('.nugg')) {
                if (dotnugg.parser.inited) {
                    onFileChangeCallback && onFileChangeCallback(filename);

                    this.parsedDocument = dotnugg.parser.parseDirectoryCheckCache(directory);

                    this.builder = dotnugg.builder.fromObject(this.parsedDocument);

                    if (contractAddr && provider) {
                        this.renderer = dotnugg.renderer.renderCheckCache(
                            contractAddr,
                            provider,
                            directory,
                            this.builder.output.map((x) => {
                                return { mtimeMs: x.mtimeMs, data: x.hex, path: x.fileName };
                            }),
                        );
                    }

                    onMemoryUpdateCallback && onMemoryUpdateCallback(filename);
                }
            }
        });
    }

    public static watch(
        appname: AppName,
        directory: string,
        contractAddr: string,
        provider: InfuraProvider,
        onFileChangeCallback: (fileUri: string) => void,
        onMemoryUpdateCallback: (fileUri: string) => void,
    ) {
        return new Watcher(appname, directory, contractAddr, provider, onFileChangeCallback, onMemoryUpdateCallback);
    }

    public static watchSimple(appname: AppName, directory: string) {
        return new Watcher(appname, directory);
    }

    public static watchNoRender(
        appname: AppName,
        directory: string,
        onFileChangeCallback?: (fileUri: string) => void,
        onMemoryUpdateCallback?: (fileUri: string) => void,
    ) {
        return new Watcher(appname, directory, undefined, undefined, onFileChangeCallback, onMemoryUpdateCallback);
    }

    public close() {
        this.listener.close();
    }
}
