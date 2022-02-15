import * as fs from 'fs';

import { InfuraProvider } from '@ethersproject/providers';

import { dotnugg } from '../..';
import * as TransformTypes from '../../builder/types/TransformTypes';

export class Watcher {
    public parsedDocument: TransformTypes.Document;

    public builder: dotnugg.builder;

    public renderer: dotnugg.renderer;

    private listener: fs.FSWatcher;

    private constructor(
        directory: string,
        contractAddr?: string,
        provider?: InfuraProvider,
        onFileChangeCallback?: (fileUri: string) => void,
        onMemoryUpdateCallback?: (fileUri: string) => void,
    ) {
        dotnugg.parser.init();

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
        directory: string,
        contractAddr: string,
        provider: InfuraProvider,
        onFileChangeCallback: (fileUri: string) => void,
        onMemoryUpdateCallback: (fileUri: string) => void,
    ) {
        return new Watcher(directory, contractAddr, provider, onFileChangeCallback, onMemoryUpdateCallback);
    }

    public static watchSimple(directory: string) {
        return new Watcher(directory);
    }

    public static watchNoRender(
        directory: string,
        onFileChangeCallback?: (fileUri: string) => void,
        onMemoryUpdateCallback?: (fileUri: string) => void,
    ) {
        return new Watcher(directory, undefined, undefined, onFileChangeCallback, onMemoryUpdateCallback);
    }

    public close() {
        this.listener.close();
    }
}
