import * as fs from 'fs';

import { InfuraProvider } from '@ethersproject/providers';
import chokidar from 'chokidar';
import invariant from 'tiny-invariant';

import { dotnugg } from '../..';
import * as TransformTypes from '../../builder/types/TransformTypes';
import { AppName } from '../../types';

export class Watcher {
    public parsedDocument: TransformTypes.Document;

    public builder: dotnugg.builder;

    public renderer: dotnugg.renderer;

    private listener: fs.FSWatcher;

    private static timeout: NodeJS.Timeout;

    private listenerCallback =
        ({
            directory,
            contractAddr,
            provider,
            onFileChangeCallback,
            onMemoryUpdateCallback,
        }: {
            directory: string;
            contractAddr?: string;
            provider?: InfuraProvider;
            onFileChangeCallback?: (fileUri: string, me: Watcher) => void;
            onMemoryUpdateCallback?: (fileUri: string, me: Watcher) => void;
        }) =>
        (filename: string) => {
            if (filename.endsWith('.nugg')) {
                if (dotnugg.parser.inited) {
                    onFileChangeCallback && onFileChangeCallback(filename, this);

                    this.parsedDocument = dotnugg.parser.parseDirectoryCheckCache(directory);

                    this.builder = dotnugg.builder.fromObject(this.parsedDocument);

                    if (contractAddr && provider) {
                        this.renderer = dotnugg.renderer.renderCheckCache(contractAddr, provider, directory, this.builder);
                    }

                    onMemoryUpdateCallback && onMemoryUpdateCallback(filename, this);
                }
            }
        };

    private constructor(
        appname: AppName,
        directory: string,
        contractAddr?: string,
        provider?: InfuraProvider,
        onFileChangeCallback?: (fileUri: string, me: Watcher) => void,
        onMemoryUpdateCallback?: (fileUri: string, me: Watcher) => void,
    ) {
        invariant(dotnugg.parser.inited, 'parser not inited');

        this.listener = chokidar.watch(directory, {
            ignored: /((^|[\/\\])\..+|(^|[\/\\])node_modules)/,
            persistent: true,
            awaitWriteFinish: true,
        });

        this.parsedDocument = dotnugg.parser.parseDirectoryCheckCache(directory);

        this.builder = dotnugg.builder.fromObject(this.parsedDocument);

        if (contractAddr && provider) {
            this.renderer = dotnugg.renderer.renderCheckCache(contractAddr, provider, directory, this.builder);
        }

        const callback = this.listenerCallback({ directory, contractAddr, provider, onFileChangeCallback, onMemoryUpdateCallback });

        this.listener.on('change', (filename: string) => {
            clearTimeout(Watcher.timeout);
            Watcher.timeout = setTimeout(() => callback(filename), 1000);
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
