/* eslint-disable prefer-const */
import * as fs from 'fs';
import * as path from 'path';

import * as vsctm from 'vscode-textmate';
import invariant from 'tiny-invariant';

import * as TransformTypes from '../../builder/types/TransformTypes';
import tokens from '../constants/tokens';
import * as ParserTypes from '../types/ParserTypes';
import { dotnugg } from '../..';
import { AppName } from '../../types';

import { Config } from './Config';

export class Parser {
    public tokens: ParserTypes.ParsedToken[] = [];
    public fileName: string;
    public fileUri: string;

    private index: number = 0;
    private document: string[];
    public linescopes: { [_: number]: string[] } = {};

    private static _inited: boolean = false;

    public static get inited() {
        return this._inited;
    }

    static async init(appname: AppName) {
        // if (!this._inited) {
        await Config.init(appname);

        this._inited = true;
        // }
    }

    private get next() {
        if (this.hasNext) {
            this.index++;
            return true;
        }
        return false;
    }

    private back() {
        this.index--;
    }

    public static semanticTokens = tokens;

    public static globalCollection: ParserTypes.RangeOf<ParserTypes.Collection>;

    public results: ParserTypes.Document = {
        collection: undefined,
        items: [],
    };

    public get json() {
        return JSON.stringify(
            this.results,
            function (key, value) {
                if (this[key] !== undefined && this[key].value !== undefined) {
                    return this[key].value;
                } else {
                    return value;
                }
            },
            4,
        );
    }

    private get hasNext() {
        if (this.index + 1 < this.tokens.length) {
            return true;
        }
        return false;
    }

    private get current() {
        return this.tokens[this.index];
    }

    private get currentValue() {
        return this.current.line.slice(this.current.token.startIndex, this.current.token.endIndex);
    }

    private has(str: string) {
        return Parser.tokenHas(this.current.token, str);
    }

    public static tokenHas(token: vsctm.IToken, str: string) {
        return token.scopes.indexOf(str) > -1;
    }

    public static tokenSelect(scopes: string[], strs: string[]) {
        return strs.reduce((prev, curr) => {
            if (prev || scopes.indexOf(curr) > -1) {
                return true;
            }
        }, false);
    }

    public checkScopesOnLine(line: number, strs: string[]) {
        return strs.reduce((prev, curr) => {
            // console.log(str);
            if (prev || this.linescopes[line].indexOf(curr) > -1) {
                return true;
            }
        }, false);
    }

    public checkTextOnLine(line: number, strs: string[]): boolean {
        let str = this.lineAt(line);
        return strs.reduce((prev, curr) => {
            if (prev || str.includes(curr)) {
                return true;
            }
        }, false);
    }

    private constructor(fileData: string, fileName: string, fileUri: string) {
        dotnugg.utils.invariantVerbose(Parser._inited, 'ERROR: Parser not initialized');

        this.document = fileData.split('\n');
        this.fileName = fileName;
        this.fileUri = fileUri;
    }

    public lineAt(num: number) {
        return this.document[num];
    }

    private valueAt(lineNum: number, token: vsctm.IToken) {
        return this.document[lineNum].slice(token.startIndex, token.endIndex);
    }

    private get lineCount() {
        return this.document.length;
    }

    public static parseEmpty() {
        return new Parser('', '', '');
    }

    public static parseData(fileData: string) {
        return new Parser(fileData, 'none.nugg', 'none.nugg').initSingle();
    }
    public static parsePath(filePath: string) {
        invariant(this._inited, 'ERROR: Parser not initialized');

        const file = fs.readFileSync(filePath, 'utf-8');
        return new Parser(file, filePath, filePath).init();
    }

    public static parseDirectoryFromObject(
        dir: string,
        prevParser?: Parser,
        cache?: { [_: string]: { items: ParserTypes.RangeOf<ParserTypes.Item>[]; mtimeMs: number } },
        saveCache?: boolean,
    ) {
        let first = false;
        try {
            if (prevParser === undefined) {
                prevParser = Parser.parseEmpty();
                try {
                    let rawdata = fs.readFileSync(path.join(dir, 'parser'), 'utf8');
                    cache = rawdata == '' ? {} : JSON.parse(rawdata);
                } catch (errs) {
                    cache = {};
                }

                saveCache = true;
            }

            // Get the files as an array
            const files = fs.readdirSync(dir);

            // Loop them all with the new for...of
            for (const file of files) {
                // Get the full paths
                const fromPath = path.join(dir, file);

                // Stat the file to see if we have a file or dir
                const stat = fs.statSync(fromPath);
                // console.log('checking...', file);

                if (stat.isFile() && file.endsWith('.nugg')) {
                    console.log('compiling...', file);

                    const parser = Parser.parsePath(fromPath);
                    // parser.parse();
                    if (parser.results.collection !== undefined) {
                        // invariant(prevParser.results.collection === undefined, 'PARSE:PARSEDIR:MULTIPLECOLL');
                        prevParser.results.collection = parser.results.collection;
                        Parser.globalCollection = parser.results.collection;
                    }
                    prevParser.results.items.push(...parser.results.items);
                } else if (stat.isDirectory() && !file.startsWith('.')) {
                    Parser.parseDirectory(fromPath, prevParser, cache, false);
                }
                // Log because we're crazy
                // console.log("Moved '%s'->'%s'", fromPath, toPath);
            } // End for...of
        } catch (e) {
            // Catch anything bad that happens
            console.error("We've thrown! Whoops!", e);
        }

        if (saveCache) {
            console.log('updating cache at: ', path.join(dir, 'parser'));
            fs.writeFileSync(path.join(dir, 'parser'), JSON.stringify(cache));
        }
        // if ()
        return prevParser;
    }

    public static parseDirectory(
        dir: string,
        prevParser?: Parser,
        cache?: { [_: string]: { items: ParserTypes.RangeOf<ParserTypes.Item>[]; mtimeMs: number } },
        saveCache?: boolean,
    ) {
        let first = false;
        try {
            if (prevParser === undefined) {
                prevParser = Parser.parseEmpty();
                try {
                    let rawdata = fs.readFileSync(path.join(dir, 'parser'), 'utf8');
                    cache = rawdata == '' ? {} : JSON.parse(rawdata);
                } catch (errs) {
                    cache = {};
                }

                saveCache = true;
            }

            // Get the files as an array
            const files = fs.readdirSync(dir);

            // Loop them all with the new for...of
            for (const file of files) {
                // Get the full paths
                const fromPath = path.join(dir, file);

                // Stat the file to see if we have a file or dir
                const stat = fs.statSync(fromPath);
                // console.log('checking...', file);

                if (stat.isFile() && file.endsWith('.nugg')) {
                    console.log('compiling...', file);

                    const parser = Parser.parsePath(fromPath);
                    // parser.parse();
                    if (parser.results.collection !== undefined) {
                        // invariant(prevParser.results.collection === undefined, 'PARSE:PARSEDIR:MULTIPLECOLL');
                        prevParser.results.collection = parser.results.collection;
                        Parser.globalCollection = parser.results.collection;
                    }
                    prevParser.results.items.push(...parser.results.items);
                } else if (stat.isDirectory() && !file.startsWith('.')) {
                    Parser.parseDirectory(fromPath, prevParser, cache, false);
                }
                // Log because we're crazy
                // console.log("Moved '%s'->'%s'", fromPath, toPath);
            } // End for...of
        } catch (e) {
            // Catch anything bad that happens
            console.error("We've thrown! Whoops!", e);
        }

        if (saveCache) {
            console.log('updating cache at: ', path.join(dir, 'parser'));
            fs.writeFileSync(path.join(dir, 'parser'), JSON.stringify(cache));
        }
        // if ()
        return prevParser;
    }

    public static getFilesInDir(dir: string): { [_: string]: { mtimeMs: number; path: string } } {
        let res = {};

        try {
            const files = fs.readdirSync(dir);

            // Loop them all with the new for...of
            for (const file of files) {
                // Get the full paths
                const fromPath = path.resolve(path.join(dir, file));
                // Stat the file to see if we have a file or dir
                const stat = fs.statSync(fromPath);
                // console.log('checking...', file);

                if (stat.isFile() && file.endsWith('.nugg')) {
                    res[`${fromPath}`] = { mtimeMs: stat.mtimeMs, path: fromPath };
                } else if (stat.isDirectory() && !file.startsWith('.')) {
                    res = { ...res, ...Parser.getFilesInDir(fromPath) };
                }
            }
        } catch (err) {}

        return res;
    }
    public static cachePathOfDir(dir: string) {
        dotnugg.utils.invariantVerbose(this._inited, 'PARSER:NOT:INIT');
        return Config.cachePath(dir, 'parser');
    }

    public static parseDirectoryCheckCache(dir: string): TransformTypes.Document {
        let cachepath = Config.cachePath(dir, 'parser');
        let files = this.getFilesInDir(dir);

        let cacheUpdated = false;
        let cache: { [_: string]: { items: TransformTypes.Item[]; mtimeMs: number } } = {};

        try {
            let rawdata = fs.readFileSync(cachepath, 'utf8');
            cache = JSON.parse(rawdata);

            if (cache[`${undefined}`]) cache = {};
        } catch (err) {
            console.log(err);
            console.log('no cache file found at: ', cachepath);
        }
        let collectionComp = false;
        let parsedamt = 0;
        let loadedamt = 0;
        let parserResults: TransformTypes.Document = { collection: undefined, items: [] };

        let fileKeys = Object.keys(files);

        console.log(`found ${fileKeys.length} .nugg files in ${dir}...`);

        console.log(`processing...`);

        for (var i = 0; i < fileKeys.length; i++) {
            if (
                !files[fileKeys[i]].path.includes('collection') &&
                cache[files[fileKeys[i]].path] &&
                files[files[fileKeys[i]].path].mtimeMs === cache[files[fileKeys[i]].path].mtimeMs
            ) {
                // console.log('loading from cache...', fileKeys[i]);
                parserResults.items.push(...cache[files[fileKeys[i]].path].items.filter((x) => x.feature !== 'SKIP'));
                loadedamt++;
            } else {
                try {
                    console.log('compiling...', files[fileKeys[i]].path);
                    const tmp0 = this.parsePath(files[fileKeys[i]].path);
                    const tmp = tmp0.json;
                    const tmp2 = JSON.parse(tmp) as TransformTypes.Document;

                    parserResults.items.push(
                        ...tmp2.items
                            .filter((x) => x.feature !== 'SKIP')
                            .map((x) => {
                                return { ...x, id: fileKeys[i].split('.')[1], mtimeMs: files[fileKeys[i]].mtimeMs };
                            }),
                    );

                    if (!files[fileKeys[i]].path.includes('collection')) {
                        cache[`${files[fileKeys[i]].path}`] = {
                            mtimeMs: files[fileKeys[i]].mtimeMs,
                            items: tmp2.items
                                .filter((x) => x.feature !== 'SKIP')
                                .map((x) => {
                                    return { ...x, id: fileKeys[i].split('.')[1], mtimeMs: files[fileKeys[i]].mtimeMs };
                                }),
                        };
                        cacheUpdated = true;
                        parsedamt++;
                    } else {
                        parserResults.collection = tmp2.collection;
                        Parser.globalCollection = tmp0.results.collection;
                        collectionComp = true;
                    }
                } catch (err) {
                    throw new Error('error compiling ' + files[fileKeys[i]].path + ' ' + err.message);
                }
            }
        }

        console.log(
            `loaded ${loadedamt} .item.nugg files from cache and parsed ${parsedamt} items ${collectionComp && ' and 1 .collection.nugg'}`,
        );

        console.log(`parsed ${parsedamt} .item.nugg files ${collectionComp && ' and 1 .collection.nugg file'}`);

        if (cacheUpdated) {
            console.log('updating cache at: ', cachepath);
            dotnugg.utils.ensureDirectoryExistence(cachepath);
            fs.writeFileSync(cachepath, JSON.stringify(cache));
        } else {
            console.log('No need to update dotnugg cache');
        }

        // console.log({ parserResults });

        return parserResults;
    }

    // public static async parseDirectoryAsync(
    //     dir: string,
    //     prevParser?: Parser,
    //     cache?: { [_: string]: { items: ParserTypes.RangeOf<ParserTypes.Item>[]; mtimeMs: number } },
    //     saveCache?: boolean,
    // ) {
    //     let first = false;
    //     try {
    //         if (prevParser === undefined) {
    //             prevParser = Parser.parseEmpty();
    //             try {
    //                 let rawdata = fs.readFileSync(path.join(dir, 'parser'), 'utf8');
    //                 cache = rawdata == '' ? {} : JSON.parse(rawdata);
    //             } catch (errs) {
    //                 cache = {};
    //             }

    //             first = true;
    //         }

    //         // Get the files as an array
    //         const files = await fs.promises.readdir(dir);

    //         await bluebird.Promise.map(files, (file) => {
    //             // Loop them all with the new for...of
    //             // for (const file of await files) {
    //             // Get the full paths
    //             const fromPath = path.join(dir, file);

    //             // Stat the file to see if we have a file or dir
    //             fs.stat(fromPath, (err, stat) => {
    //                 if (err) throw new Error(err.message);
    //                 if (stat.isFile() && file.endsWith('.nugg')) {
    //                     if (cache[file] && stat.mtimeMs === cache[file].mtimeMs) {
    //                         prevParser.results.items.push(...cache[file].items);
    //                     } else {
    //                         console.log('compiling...', file);

    //                         const parser = Parser.parsePath(fromPath);
    //                         // parser.parse();
    //                         if (parser.results.collection !== undefined) {
    //                             // invariant(prevParser.results.collection === undefined, 'PARSE:PARSEDIR:MULTIPLECOLL');
    //                             prevParser.results.collection = parser.results.collection;
    //                             Parser.globalCollection = parser.results.collection;
    //                         }
    //                         prevParser.results.items.push(...parser.results.items);
    //                         cache[file] = {
    //                             items: parser.results.items,
    //                             mtimeMs: stat.mtimeMs,
    //                         };
    //                     }
    //                 } else if (stat.isDirectory() && !file.startsWith('.')) {
    //                     Parser.parseDirectoryAsync(fromPath, prevParser, cache, false);
    //                 }
    //             });
    //         }).then(() => {});

    //         // }
    //     } catch (e) {
    //         // Catch anything bad that happens
    //         console.error("We've thrown! Whoops!", e);
    //     }

    //     // if ()
    //     return prevParser;
    // }

    private init() {
        try {
            const tokens: ParserTypes.ParsedToken[] = [];
            // timer.start('token loop craziness');
            for (let i = 0; i < this.lineCount; i++) {
                let p = Config.grammer.tokenizeLine(this.lineAt(i), vsctm.INITIAL);

                while (p.ruleStack.depth > 1) {
                    p.tokens.forEach((x) => {
                        if (this.linescopes[i] === undefined) {
                            this.linescopes[i] = [...x.scopes];
                        } else {
                            this.linescopes[i].push(...x.scopes);
                        }

                        tokens.push({
                            token: x,
                            ruleStack: p.ruleStack,
                            line: this.lineAt(i),
                            value: this.valueAt(i, x),
                            lineNumber: i,
                        });
                    });

                    p = Config.grammer.tokenizeLine(this.lineAt(++i), p.ruleStack);
                }
                p.tokens.forEach((x) => {
                    if (this.linescopes[i] === undefined) {
                        this.linescopes[i] = [...x.scopes];
                    } else {
                        this.linescopes[i].push(...x.scopes);
                    }

                    tokens.push({
                        token: x,
                        ruleStack: p.ruleStack,
                        line: this.lineAt(i),
                        value: this.valueAt(i, x),
                        lineNumber: i,
                    });
                });
            }
            // timer.stop('token loop craziness');

            this.tokens = tokens;
            // timer.start('this.parse()');

            this.parse();
            // timer.stop('this.parse()');

            return this;
        } catch (err) {
            console.log('error', 'ERROR IN INIT', err);
        }
    }

    private initSingle() {
        try {
            const tokens: ParserTypes.ParsedToken[] = [];
            // timer.start('token loop craziness');
            for (let i = 0; i < this.lineCount; i++) {
                let p = Config.grammer.tokenizeLine(this.lineAt(i), vsctm.INITIAL);

                while (p.ruleStack.depth > 1) {
                    p.tokens.forEach((x) => {
                        if (this.linescopes[i] === undefined) {
                            this.linescopes[i] = [...x.scopes];
                        } else {
                            this.linescopes[i].push(...x.scopes);
                        }

                        tokens.push({
                            token: x,
                            ruleStack: p.ruleStack,
                            line: this.lineAt(i),
                            value: this.valueAt(i, x),
                            lineNumber: i,
                        });
                    });

                    p = Config.grammer.tokenizeLine(this.lineAt(++i), p.ruleStack);
                }
                p.tokens.forEach((x) => {
                    if (this.linescopes[i] === undefined) {
                        this.linescopes[i] = [...x.scopes];
                    } else {
                        this.linescopes[i].push(...x.scopes);
                    }

                    tokens.push({
                        token: x,
                        ruleStack: p.ruleStack,
                        line: this.lineAt(i),
                        value: this.valueAt(i, x),
                        lineNumber: i,
                    });
                });
            }
            // timer.stop('token loop craziness');

            this.tokens = tokens;
            // timer.start('this.parse()');

            this.parseSingleItem();
            // timer.stop('this.parse()');

            return this;
        } catch (err) {
            console.log('error', 'ERROR IN INIT', err);
        }
    }

    parseSingleItem() {
        try {
            for (; this.hasNext; this.next) {
                this.parseItem();
                if (this.results.items.length > 0) return;
            }
        } catch (err) {
            console.log('ERROR', 'failed compilattion', { err });
        }
    }

    parse() {
        try {
            for (; this.hasNext; this.next) {
                this.parseCollection();
                this.parseItem();
            }
            if (!this.results.collection) {
                this.results.collection = Parser.globalCollection;
            }
        } catch (err) {
            console.log('ERROR', 'failed compilattion', { err });
        }
    }

    parseCollection() {
        if (this.has(tokens.Collection)) {
            let features: ParserTypes.RangeOf<ParserTypes.CollectionFeatures> = undefined;

            const token = this.current;
            let endToken = undefined;
            let width: number = undefined;
            let widthToken: ParserTypes.ParsedToken = undefined;

            for (; this.has(tokens.Collection) && this.hasNext; this.next) {
                const collectionFeatures = this.parseCollectionFeatures();
                if (collectionFeatures) {
                    features = collectionFeatures;
                }

                if (this.has(tokens.CollectionOpenWidth)) {
                    width = +this.currentValue;
                    widthToken = this.current;
                }

                if (this.has(tokens.CollectionClose)) {
                    endToken = this.current;
                }
            }
            // const validator = new Validator({
            //     token,
            //     endToken,
            //     features,
            //     width,
            //     widthToken,
            // });
            // if (validator.complete) {
            this.results.collection = {
                value: { features, width: { value: width, token: widthToken }, fileUri: this.fileUri },

                token,
                endToken,
            };
            // } else {
            //     console.error('ERROR', 'blank value returned from: parseCollection', validator.undefinedVarNames);
            //     throw new Error('blank value returned from: parseCollection');
            // }
        }
    }

    parseCollectionFeatures() {
        if (this.has(tokens.CollectionFeatures)) {
            const token = this.current;
            let endToken = undefined;

            const collectionFeatures: ParserTypes.RangeOf<ParserTypes.CollectionFeature>[] = [];

            for (; this.has(tokens.CollectionFeatures) && endToken === undefined; this.next) {
                const collectionfeature = this.parseCollectionFeature();
                if (collectionfeature) {
                    collectionFeatures.push(collectionfeature);
                }
                const collectionfeatureLong = this.parseCollectionFeatureLong();
                if (collectionfeatureLong) {
                    collectionFeatures.push(collectionfeatureLong);
                }
                if (this.has(tokens.CollectionFeaturesClose)) {
                    endToken = this.current;
                }
            }

            // const validator = new Validator({ token, endToken, collectionFeatures });

            // if (validator.complete) {
            const value: ParserTypes.CollectionFeatures = collectionFeatures.reduce((prev, curr) => {
                return { [curr.value.name.value]: curr, ...prev };
            }, {});

            return {
                token,
                value,
                endToken,
            };
            // } else {
            //     console.error('ERROR', 'blank value returned from: parseCollectionFeatures', validator.undefinedVarNames);
            //     throw new Error('blank value returned from: parseCollectionFeatures');
            // }
        }
        return undefined;
    }

    parseCollectionFeature() {
        if (this.has(tokens.CollectionFeature)) {
            const token = this.current;
            let endToken = undefined;

            let r: number = undefined;
            let rToken: ParserTypes.ParsedToken = undefined;
            let l: number = undefined;
            let lToken: ParserTypes.ParsedToken = undefined;
            let u: number = undefined;
            let uToken: ParserTypes.ParsedToken = undefined;
            let d: number = undefined;
            let dToken: ParserTypes.ParsedToken = undefined;
            let radiiToken: ParserTypes.ParsedToken = undefined;

            // let anchorDirection: ParserTypes.Operator = undefined;
            // let anchorOffset: number = undefined;
            // let anchorToken: ParserTypes.ParsedToken = undefined;
            let zindexDirection: ParserTypes.Operator = undefined;
            let zindexOffset: number = undefined;
            let zindexToken: ParserTypes.ParsedToken = undefined;
            let name: string = undefined;
            let nameToken: ParserTypes.ParsedToken = undefined;

            for (; this.has(tokens.CollectionFeature) && endToken === undefined; this.next) {
                if (this.currentValue === '') {
                    continue;
                }
                if (this.has(tokens.CollectionFeatureDetailsZIndexOffset)) {
                    zindexOffset = +this.currentValue;
                }
                if (this.has(tokens.CollectionFeatureDetailsZIndexDirection)) {
                    zindexDirection = this.currentValue as ParserTypes.Operator;
                }
                if (this.has(tokens.CollectionFeatureDetailsZIndex)) {
                    zindexToken = this.current;
                }
                if (this.has(tokens.CollectionFeatureName)) {
                    name = this.currentValue;
                    nameToken = this.current;
                }
                //  if (this.has(tokens.CollectionFeatureDetailsZIndex)) {
                //      anchorToken = this.current;
                //  }
                //  //  if (this.has(tokens.CollectionFeatureDetailsZIndexKey)) {
                //  //      anchorKey = +this.currentValue;
                //  //  }
                //  if (this.has(tokens.CollectionFeatureDetailsZIndexDirection)) {
                //      anchorDirection = this.currentValue as ParserTypes.Operator;
                //  }
                //  if (this.has(tokens.CollectionFeatureDetailsZIndexOffset)) {
                //      anchorOffset = +this.currentValue;
                //  }
                if (this.has(tokens.CollectionFeatureDetailsExpandableAtDetails)) {
                    radiiToken = this.current;
                }
                if (this.has(tokens.CollectionFeatureDetailsExpandableAtDetailsR)) {
                    r = +this.currentValue;
                    rToken = this.current;
                }
                if (this.has(tokens.CollectionFeatureDetailsExpandableAtDetailsL)) {
                    l = +this.currentValue;
                    lToken = this.current;
                }
                if (this.has(tokens.CollectionFeatureDetailsExpandableAtDetailsU)) {
                    u = +this.currentValue;
                    uToken = this.current;
                }
                if (this.has(tokens.CollectionFeatureDetailsExpandableAtDetailsD)) {
                    d = +this.currentValue;
                    dToken = this.current;
                }
                if (this.has(tokens.CollectionFeatureDetailsClose)) {
                    endToken = this.current;
                }
            }

            // let validator = new Validator({
            //     token,
            //     //  anchorKey,
            //     //  anchorDirection,
            //     //  anchorOffset,
            //     //  anchorToken,
            //     zindexDirection,
            //     zindexOffset,
            //     zindexToken,
            //     name,
            //     nameToken,
            //     endToken,
            //     r,
            //     rToken,
            //     l,
            //     lToken,
            //     d,
            //     dToken,
            //     u,
            //     uToken,
            //     radiiToken,
            // });

            // if (validator.complete) {
            const value: ParserTypes.CollectionFeature = {
                zindex: {
                    token: zindexToken,
                    value: {
                        direction: zindexDirection,
                        offset: zindexOffset,
                    },
                },
                name: {
                    token: nameToken,
                    value: name,
                },
                graftable: {
                    value: false, // only setable in long version
                    token: nameToken,
                },
                receivers: [], // empty bc these only exist in long version
                expandableAt: {
                    token: radiiToken,
                    value: {
                        r: {
                            value: r,
                            token: rToken,
                        },
                        l: {
                            value: l,
                            token: lToken,
                        },
                        u: {
                            value: u,
                            token: uToken,
                        },
                        d: {
                            value: d,
                            token: dToken,
                        },
                    },
                },
            };

            return {
                value,
                token,
                endToken,
            };
            // } else {
            //     console.error('ERROR', 'blank value returned from: parseCollectionFeature', validator.undefinedVarNames);
            //     throw new Error('blank value returned from: parseCollectionFeature');
            // }
        }
        return undefined;
    }

    parseCollectionFeatureLong() {
        if (this.has(tokens.CollectionFeatureLong)) {
            const token = this.current;
            let endToken = undefined;
            let name: string = undefined;
            let nameToken: ParserTypes.ParsedToken = undefined;
            let zindex: ParserTypes.RangeOf<ParserTypes.ZIndex> = undefined;
            let expandableAt: ParserTypes.RangeOf<ParserTypes.RLUD<number>> = undefined;
            let receivers: ParserTypes.RangeOf<ParserTypes.Receiver>[] = [];
            let graftable: ParserTypes.RangeOf<boolean> = undefined;

            for (; this.has(tokens.CollectionFeatureLong) && endToken === undefined; this.next) {
                if (this.has(tokens.CollectionFeatureLongName)) {
                    name = this.currentValue;
                    nameToken = this.current;
                }
                const expandableAt_ = this.parseCollectionFeatureLongExpandableAt();
                if (expandableAt_) {
                    expandableAt = expandableAt_;
                }

                const zindex_ = this.parseCollectionFeatureLongZIndex();
                if (zindex_) {
                    zindex = zindex_;
                }

                const graft_ = this.parseCollectionFeatureLongGraft();
                if (graft_) {
                    graftable = graft_;
                }

                const receiver_ = this.parseGeneralReceiver(ParserTypes.ReceiverType.CALCULATED);
                if (receiver_) {
                    receivers.push(receiver_);
                }
                if (this.has(tokens.CollectionFeatureLongClose)) {
                    endToken = this.current;
                    break;
                }
            }

            // const validator = new Validator({
            //     token,
            //     endToken,
            //     name,
            //     nameToken,
            //     zindex,
            //     expandableAt,
            //     receivers,
            // });

            // if (validator.complete) {
            //     if (validator.complete) {
            const value: ParserTypes.CollectionFeature = {
                zindex,
                name: {
                    value: name,
                    token: nameToken,
                },
                receivers,
                graftable,
                expandableAt,
            };

            return {
                token,
                value,
                endToken,
            };
            // } else {
            //     console.error('ERROR', 'blank value returned from: parseCollectionFeatureLong', validator.undefinedVarNames);
            //     throw new Error('blank value returned from: parseCollectionFeatureLong');
            // }
            // }
            return undefined;
        }
    }

    parseCollectionFeatureLongExpandableAt() {
        if (this.has(tokens.CollectionFeatureLongExpandableAt)) {
            const token = this.current;
            let endToken = undefined;

            let r: number = undefined;
            let rToken: ParserTypes.ParsedToken = undefined;
            let l: number = undefined;
            let lToken: ParserTypes.ParsedToken = undefined;
            let u: number = undefined;
            let uToken: ParserTypes.ParsedToken = undefined;
            let d: number = undefined;
            let dToken: ParserTypes.ParsedToken = undefined;

            for (; this.has(tokens.CollectionFeatureLongExpandableAt) && endToken === undefined; this.next) {
                if (this.currentValue === '') {
                    continue;
                }
                if (this.has(tokens.CollectionFeatureLongExpandableAtDetailsR)) {
                    r = +this.currentValue;
                    rToken = this.current;
                }
                if (this.has(tokens.CollectionFeatureLongExpandableAtDetailsL)) {
                    l = +this.currentValue;
                    lToken = this.current;
                }
                if (this.has(tokens.CollectionFeatureLongExpandableAtDetailsU)) {
                    u = +this.currentValue;
                    uToken = this.current;
                }
                if (this.has(tokens.CollectionFeatureLongExpandableAtDetailsD)) {
                    d = +this.currentValue;
                    dToken = this.current;
                }
                if (this.has(tokens.CollectionFeatureLongExpandableAtDetailsClose)) {
                    endToken = this.current;
                }
            }

            // let validator = new Validator({
            //     token,
            //     r,
            //     rToken,
            //     l,
            //     lToken,
            //     d,
            //     dToken,
            //     u,
            //     uToken,
            //     endToken,
            // });

            // if (validator.complete) {
            const value: ParserTypes.RLUD<number> = {
                r: {
                    value: r,
                    token: rToken,
                },
                l: {
                    value: l,
                    token: lToken,
                },
                u: {
                    value: u,
                    token: uToken,
                },
                d: {
                    value: d,
                    token: dToken,
                },
            };
            return {
                value,
                token,
                endToken,
            };
            // } else {
            //     console.error('ERROR', 'blank value returned from: parseCollectionFeatureLongExpandableAt', validator.undefinedVarNames);
            //     throw new Error('blank value returned from: parseCollectionFeatureLongExpandableAt');
            // }
        }
        return undefined;
    }

    parseCollectionFeatureLongZIndex() {
        if (this.has(tokens.CollectionFeatureLongZIndex)) {
            let token = undefined;
            let endToken = undefined;

            let direction: ParserTypes.Operator = undefined;
            let offset: number = undefined;

            for (
                ;
                this.has(tokens.CollectionFeatureLongZIndex) && (endToken === undefined || offset === undefined || direction == undefined);
                this.next
            ) {
                if (this.currentValue === '') {
                    continue;
                }
                if (this.has(tokens.CollectionFeatureLongZIndexOffset)) {
                    offset = +this.currentValue;
                }
                if (this.has(tokens.CollectionFeatureLongZIndexDirection)) {
                    direction = this.currentValue as ParserTypes.Operator;
                }
                if (this.has(tokens.CollectionFeatureLongZIndex)) {
                    token = this.current;
                    endToken = this.current;
                }
            }

            // let validator = new Validator({ token, direction, offset, endToken });

            // if (validator.complete) {
            const value: ParserTypes.ZIndex = {
                direction,
                offset,
            };
            return {
                value,
                token,
                endToken,
            };
            // } else {
            //     console.error('ERROR', 'blank value returned from: parseItemVersionAnchor', validator.undefinedVarNames);
            //     throw new Error('blank value returned from: parseItemVersionAnchor');
            // }
        }
        return undefined;
    }

    parseCollectionFeatureLongGraft() {
        if (this.has(tokens.CollectionFeatureLongGraft)) {
            let graft: boolean = this.currentValue === 'true';

            return {
                value: graft,
                token: this.current,
                endToken: undefined,
            };
            // } else {
            //     console.error('ERROR', 'blank value returned from: parseItemVersionAnchor', validator.undefinedVarNames);
            //     throw new Error('blank value returned from: parseItemVersionAnchor');
            // }
        }
        return undefined;
    }

    parseGeneralColors() {
        if (this.has(tokens.GeneralColors)) {
            const token = this.current;
            let endToken = undefined;

            const colors: ParserTypes.RangeOf<ParserTypes.Color>[] = [];

            for (; this.has(tokens.GeneralColors) && endToken === undefined; this.next) {
                const color = this.parseGeneralColor();
                if (color) {
                    colors.push(color);
                }
                if (this.has(tokens.GeneralColorsClose)) {
                    endToken = this.current;
                }
            }

            // let validator = new Validator({ token, endToken, colors });

            // if (validator.complete) {
            const value: ParserTypes.Colors = colors.reduce((prev, curr) => {
                return { [curr.value.name.value]: curr, ...prev };
            }, {});
            return {
                token,
                value,
                endToken,
            };
            // } else {
            //     console.error('ERROR', 'blank value returned from parseGeneralColors:', validator.undefinedVarNames);
            //     throw new Error('blank value returned from: parseGeneralColors');
            // }
        }
        return undefined;
    }

    parseGeneralColor() {
        if (this.has(tokens.GeneralColor)) {
            const token = this.current;
            let endToken = undefined;

            let rgba: ParserTypes.RGBA = undefined;
            let rgbaToken: ParserTypes.ParsedToken = undefined;
            let zindexDirection: ParserTypes.Operator = undefined;
            let zindexOffset: number = undefined;
            let zindexToken: ParserTypes.ParsedToken = undefined;
            let name: string = undefined;
            let nameToken: ParserTypes.ParsedToken = undefined;
            let graft: boolean = undefined;
            let graftToken: ParserTypes.ParsedToken = undefined;

            for (; this.has(tokens.GeneralColor) && endToken === undefined; this.next) {
                if (this.currentValue === '') {
                    continue;
                }
                if (this.has(tokens.GeneralColorDetailsZIndexOffset)) {
                    zindexOffset = this.currentValue.toLowerCase() === 'd' ? 100 : +this.currentValue;
                }
                if (this.has(tokens.GeneralColorDetailsZIndexDirection)) {
                    zindexDirection = this.currentValue as ParserTypes.Operator;
                }
                if (this.has(tokens.GeneralColorDetailsZIndex)) {
                    zindexToken = this.current;
                }
                if (this.has(tokens.GeneralColorName)) {
                    name = this.currentValue;
                    nameToken = this.current;
                }
                if (this.has(tokens.GeneralColorGraft)) {
                    graft = true;
                    graftToken = this.current;
                }
                if (this.has(tokens.GeneralColorDetailsRgba)) {
                    rgba = this.currentValue as ParserTypes.RGBA;
                    rgbaToken = this.current;
                }
                if (this.has(tokens.GeneralColorDetailsClose)) {
                    endToken = this.current;
                }
            }

            // let validator = new Validator({
            //     token,
            //     rgba,
            //     rgbaToken,
            //     zindexDirection,
            //     zindexOffset,
            //     zindexToken,
            //     name,
            //     nameToken,
            //     endToken,
            // });

            // if (validator.complete) {
            const value: ParserTypes.Color = {
                zindex: {
                    token: zindexToken,
                    value: {
                        direction: zindexDirection,
                        offset: zindexOffset,
                    },
                },
                name: {
                    token: nameToken,
                    value: name,
                },
                rgba: {
                    value: rgba,
                    token: rgbaToken,
                },
                ...(graft === undefined
                    ? {
                          graft: {
                              value: false,
                              token: nameToken,
                          },
                      }
                    : {
                          graft: {
                              value: true,
                              token: graftToken,
                          },
                      }),
            };
            return {
                value,
                token,
                endToken,
            };
            // } else {
            //     console.error('ERROR', 'blank value returned from: parseGeneralColor', validator.undefinedVarNames);
            //     throw new Error('blank value returned from: parseGeneralColor');
            // }
        }
        return undefined;
    }

    parseGeneralData(): ParserTypes.RangeOf<ParserTypes.Data> {
        if (this.has(tokens.GeneralData)) {
            let matrix: ParserTypes.RangeOf<ParserTypes.DataRow>[] = [];
            let token = undefined;
            let endToken = undefined;

            for (; true; this.next) {
                if (!token) {
                    this.back();
                    token = this.current;
                    continue;
                }
                const row = this.parseGeneralDataRow();
                if (row) {
                    matrix.push(row);
                }
                if (this.has(tokens.GeneralDataClose)) {
                    endToken = this.current;
                    break;
                }
            }
            // const validator = new Validator({ token, endToken });
            if (matrix.length > 0) {
                return {
                    value: {
                        matrix,
                    },
                    token,
                    endToken,
                };
            } else {
                console.error('ERROR', 'blank value returned from: parseGeneralData - matrix.length === 0');

                throw new Error('blank value returned from: parseGeneralData');
            }
        }
        return undefined;
    }

    parseGeneralDataRow(): ParserTypes.RangeOf<ParserTypes.DataRow> {
        if (this.has(tokens.GeneralDataRow)) {
            const token = this.current;
            let pixels: ParserTypes.RangeOf<ParserTypes.Pixel>[] = [];
            let lastLine = this.current.lineNumber;
            let endToken = undefined;

            for (; this.has(tokens.GeneralDataRow); this.next) {
                if (lastLine !== this.current.lineNumber) {
                    this.back();
                    break;
                }
                const pixel = this.parseGeneralDataPixel();

                if (pixel) {
                    pixels.push(pixel);
                    this.back();
                }
                endToken = this.current;
            }
            // const validator = new Validator({ token, endToken });
            // if (validator.complete && pixels.length > 0) {
            return {
                value: pixels,
                token,
                endToken,
            };
            // } else {
            //     console.error('ERROR', 'blank value returned from: parsePixel', validator.undefinedVarNames);

            //     throw new Error('blank value returned from: parsePixel');
            // }
        }
        return undefined;
    }

    parseGeneralDataPixel() {
        if (this.has(tokens.GeneralDataRowPixel)) {
            const token = this.current;
            let endToken = this.current;

            let label: string = undefined;
            let labelToken: ParserTypes.ParsedToken = undefined;
            let type: ParserTypes.PixelType = undefined;
            let typeToken: ParserTypes.ParsedToken = undefined;

            for (
                ;
                label === undefined;
                // Validator.anyUndefined({
                //     token,
                //     labelToken,
                //     type,
                //     typeToken,
                //     label,
                //     endToken,
                // });
                this.next
            ) {
                if (this.currentValue !== '') {
                    if (this.has(tokens.GeneralDataRowPixelTransparent)) {
                        type = ParserTypes.PixelType.TRANSPARENT;
                        typeToken = this.current;
                        labelToken = this.current;
                        label = this.currentValue;
                    }
                    if (this.has(tokens.GeneralDataRowPixelFilter)) {
                        type = ParserTypes.PixelType.COLOR;
                        typeToken = this.current;
                        labelToken = this.current;
                        label = this.currentValue;
                    }
                    if (this.has(tokens.GeneralDataRowPixelColor)) {
                        type = ParserTypes.PixelType.COLOR;
                        typeToken = this.current;
                        labelToken = this.current;
                        label = this.currentValue;
                    }
                }
            }

            // const validator = new Validator({
            //     // token,
            //     // labelToken,
            //     // type,
            //     // typeToken,
            //     // endToken,
            //     label,
            // });
            // if (validator.complete) {
            return {
                value: {
                    l: {
                        value: label,
                        token: labelToken,
                    },
                    t: {
                        value: type,
                        token: typeToken,
                    },
                },
                token,
                endToken,
            };
            // } else {
            //     console.error('ERROR', 'blank value returned from: parsePixel', validator.undefinedVarNames);

            //     throw new Error('blank value returned from: parsePixel');
            // }
        }
        return undefined;
    }

    parseGeneralReceiver(type: ParserTypes.ReceiverType) {
        if (this.has(tokens.GeneralReceiver)) {
            const token = this.current;
            let endToken = undefined;

            let aDirection: ParserTypes.Operator = undefined;
            let aOffset: number = undefined;
            let bDirection: ParserTypes.Operator = undefined;
            let bOffset: number = undefined;

            let aToken: ParserTypes.ParsedToken = undefined;
            let bToken: ParserTypes.ParsedToken = undefined;

            let feature: string = undefined;
            let featureToken: ParserTypes.ParsedToken = undefined;

            for (; this.has(tokens.GeneralReceiver) && endToken === undefined; this.next) {
                if (this.currentValue === '') {
                    continue;
                }

                if (this.has(tokens.GeneralReceiverDetailsFeature)) {
                    feature = this.currentValue;
                    featureToken = this.current;
                }
                if (this.has(tokens.GeneralReceiverDetailsA)) {
                    aToken = this.current;
                }
                if (this.has(tokens.GeneralReceiverDetailsADirection)) {
                    aDirection = this.currentValue as ParserTypes.Operator;
                }
                if (this.has(tokens.GeneralReceiverDetailsAOffset)) {
                    aOffset = +this.currentValue;
                }
                if (this.has(tokens.GeneralReceiverDetailsB)) {
                    bToken = this.current;
                }
                if (this.has(tokens.GeneralReceiverDetailsBDirection)) {
                    bDirection = this.currentValue as ParserTypes.Operator;
                }
                if (this.has(tokens.GeneralReceiverDetailsBOffset)) {
                    bOffset = +this.currentValue;
                }

                if (this.has(tokens.GeneralReceiverDetailsClose)) {
                    endToken = this.current;
                }
            }

            // let validator = new Validator({
            //     token,
            //     aOffset,
            //     bOffset,
            //     aToken,
            //     bToken,
            //     feature,
            //     featureToken,
            //     endToken,
            // });

            // if (validator.complete) {
            const value: ParserTypes.Receiver = {
                a: {
                    token: aToken,
                    value: {
                        direction: aDirection,
                        offset: aOffset,
                    },
                },
                b: {
                    token: bToken,
                    value: {
                        direction: bDirection,
                        offset: bOffset,
                    },
                },
                feature: {
                    token: featureToken,
                    value: feature,
                },
                type,
            };
            return {
                value,
                token,
                endToken,
            };
            // } else {
            //     console.error('ERROR', 'blank value returned from: parseGeneralReceiver', validator.undefinedVarNames);
            //     throw new Error('blank value returned from: parseGeneralReceiver');
            // }
        }
        return undefined;
    }

    parseItem() {
        // timer.start('parseItem()');
        if (this.has(tokens.Item)) {
            const token = this.current;
            let endToken = undefined;
            let feature: string = undefined;
            let weight: number = undefined;
            let order: number = undefined;

            let isDefault: boolean = undefined;

            let featureToken: ParserTypes.ParsedToken = undefined;
            let weightToken: ParserTypes.ParsedToken = undefined;
            let orderToken: ParserTypes.ParsedToken = undefined;

            let colors = undefined;
            let versions = undefined;

            for (; this.has(tokens.Item) && this.hasNext && endToken === undefined; this.next) {
                if (this.has(tokens.ItemOpenFeature)) {
                    feature = this.currentValue;
                    featureToken = this.current;
                }
                if (this.has(tokens.ItemOpenOrder)) {
                    order = +this.currentValue;
                    orderToken = this.current;
                }
                if (this.has(tokens.ItemOpenWeight)) {
                    weight = +this.currentValue;
                    weightToken = this.current;
                }
                if (this.has(tokens.ItemOpenDefaultOrItem)) {
                    isDefault = this.currentValue === 'default';
                }
                const colors_ = this.parseGeneralColors();
                if (colors_) {
                    colors = colors_;
                }
                // timer.start('this.parseItemVersions()');

                const versions_ = this.parseItemVersions();
                if (versions_) {
                    versions = versions_;
                    // timer.stop('this.parseItemVersions()');
                }

                if (this.has(tokens.ItemClose)) {
                    endToken = this.current;
                }
            }
            // this.results.items.push({ value, token, endToken });
            // const validator = new Validator({
            //     token,
            //     endToken,
            //     feature,
            //     featureToken,
            //     colors,
            //     versions,
            //     isDefault,
            // });
            // if (validator.complete) {
            this.results.items.push({
                value: {
                    isDefault,
                    colors,
                    versions,
                    weight: {
                        value: weight,
                        token: weightToken,
                    },
                    order: {
                        value: order,
                        token: orderToken,
                    },
                    feature: {
                        value: feature,
                        token: featureToken,
                    },
                    fileName: this.fileName,
                    fileUri: this.fileUri,
                },
                token,
                endToken,
            });
            // } else {
            //     console.error('ERROR', 'blank value returned from: parseItem', validator.undefinedVarNames);
            //     throw new Error('blank value returned from: parseItem');
            // }
        }
        // timer.stop('parseItem()');

        return undefined;
    }

    parseItemVersions() {
        if (this.has(tokens.ItemVersions)) {
            const token = this.current;
            let endToken = undefined;

            const versions: ParserTypes.RangeOf<ParserTypes.Version>[] = [];
            // timer.start('parseItemVersions() loop');
            for (; this.has(tokens.ItemVersions) && endToken === undefined; this.next) {
                // timer.start('this.parseItemVersion()');

                const version = this.parseItemVersion();
                if (version) {
                    // timer.stop('this.parseItemVersion()');

                    versions.push(version);
                }
                if (this.has(tokens.ItemVersionsClose)) {
                    endToken = this.current;
                }
            }

            // timer.stop('parseItemVersions() loop');

            // let validator = new Validator({ token, endToken, versions });

            // if (validator.complete) {
            const value: ParserTypes.Colors = versions.reduce((prev, curr) => {
                return { [curr.value.name.value]: curr, ...prev };
            }, {});

            return {
                token,
                value,
                endToken,
            };
            // } else {
            //     console.error('ERROR', 'blank value returned from parseGeneralColors:', validator.undefinedVarNames);
            //     throw new Error('blank value returned from: parseGeneralColors');
            // }
        }
        return undefined;
    }

    parseItemVersion() {
        if (this.has(tokens.ItemVersion)) {
            let data: ParserTypes.RangeOf<ParserTypes.Data> = undefined;
            let radii: ParserTypes.RangeOf<ParserTypes.RLUD<number>> = undefined;
            let expanders: ParserTypes.RangeOf<ParserTypes.RLUD<number>> = undefined;
            let anchor: ParserTypes.RangeOf<ParserTypes.Coordinate> = undefined;
            let receivers: ParserTypes.RangeOf<ParserTypes.Receiver>[] = [];

            let name: string = undefined;
            let nameToken: ParserTypes.ParsedToken = undefined;
            const token = this.current;
            let endToken = undefined;

            for (
                ;
                this.has(tokens.ItemVersion);
                // this.has(tokens.ItemVersion) &&
                // Validator.anyUndefined({
                //     token,
                //     endToken,
                //     radii,
                //     expanders,
                //     data,
                //     anchor,
                //     name,
                //     nameToken,
                // });
                this.next
            ) {
                if (this.has(tokens.ItemVersionName)) {
                    name = this.currentValue;
                    nameToken = this.current;
                }

                const radii_ = this.parseItemVersionRadii();
                if (radii_) {
                    radii = radii_;
                }

                // Logger.out(this.current.token.scopes);
                const expanders_ = this.parseItemVersionExpanders();
                if (expanders_) {
                    expanders = expanders_;
                }

                const anchor_ = this.parseItemVersionAnchor();
                if (anchor_) {
                    anchor = anchor_;
                }

                // timer.start('this.parseGeneralData()');
                const generalData = this.parseGeneralData();
                if (generalData) {
                    // timer.stop('this.parseGeneralData()');

                    data = generalData;
                }

                const receiver_ = this.parseGeneralReceiver(ParserTypes.ReceiverType.STATIC);
                if (receiver_) {
                    receivers.push(receiver_);
                }
                if (this.has(tokens.ItemVersionClose)) {
                    endToken = this.current;
                    // break;
                }
            }

            this.back();

            // const validator = new Validator({
            //     token,
            //     endToken,
            //     radii,
            //     expanders,
            //     data,
            //     anchor,
            //     name,
            //     nameToken,
            // });
            // if (validator.complete) {
            return {
                value: {
                    radii,
                    expanders,
                    data,
                    anchor,
                    receivers: receivers,
                    name: { value: name, token: nameToken },
                },
                token,
                endToken,
            };
            // } else {
            //     console.error('ERROR', 'blank value returned from: parseItemVersion', validator.undefinedVarNames);

            //     throw new Error('blank value returned from: parseItemVersion');
            // }
        }
    }

    parseItemVersionRadii() {
        if (this.has(tokens.ItemVersionRadii)) {
            const token = this.current;
            let endToken = undefined;

            let r: number = undefined;
            let rToken: ParserTypes.ParsedToken = undefined;
            let l: number = undefined;
            let lToken: ParserTypes.ParsedToken = undefined;
            let u: number = undefined;
            let uToken: ParserTypes.ParsedToken = undefined;
            let d: number = undefined;
            let dToken: ParserTypes.ParsedToken = undefined;

            for (; this.has(tokens.ItemVersionRadii) && endToken === undefined; this.next) {
                if (this.currentValue === '') {
                    continue;
                }
                if (this.has(tokens.ItemVersionRadiiDetailsR)) {
                    r = +this.currentValue;
                    rToken = this.current;
                }
                if (this.has(tokens.ItemVersionRadiiDetailsL)) {
                    l = +this.currentValue;
                    lToken = this.current;
                }
                if (this.has(tokens.ItemVersionRadiiDetailsU)) {
                    u = +this.currentValue;
                    uToken = this.current;
                }
                if (this.has(tokens.ItemVersionRadiiDetailsD)) {
                    d = +this.currentValue;
                    dToken = this.current;
                }
                if (this.has(tokens.ItemVersionRadiiDetailsClose)) {
                    endToken = this.current;
                }
            }

            // let validator = new Validator({
            //     token,
            //     r,
            //     rToken,
            //     l,
            //     lToken,
            //     d,
            //     dToken,
            //     u,
            //     uToken,
            //     endToken,
            // });

            // if (validator.complete) {
            const value: ParserTypes.RLUD<number> = {
                r: {
                    value: r,
                    token: rToken,
                },
                l: {
                    value: l,
                    token: lToken,
                },
                u: {
                    value: u,
                    token: uToken,
                },
                d: {
                    value: d,
                    token: dToken,
                },
            };
            return {
                value,
                token,
                endToken,
            };
            // } else {
            //     console.error('ERROR', 'blank value returned from: parseItemVersionRadii', validator.undefinedVarNames);
            //     throw new Error('blank value returned from: parseItemVersionRadii');
            // }
        }
        return undefined;
    }

    parseItemVersionExpanders() {
        if (this.has(tokens.ItemVersionExpanders)) {
            const token = this.current;
            let endToken = undefined;

            let r: number = undefined;
            let rToken: ParserTypes.ParsedToken = undefined;
            let l: number = undefined;
            let lToken: ParserTypes.ParsedToken = undefined;
            let u: number = undefined;
            let uToken: ParserTypes.ParsedToken = undefined;
            let d: number = undefined;
            let dToken: ParserTypes.ParsedToken = undefined;

            for (
                ;
                this.has(tokens.ItemVersionExpanders) && endToken === undefined;
                // Validator.anyUndefined({
                //     token,
                //     r,
                //     rToken,
                //     l,
                //     lToken,
                //     d,
                //     dToken,
                //     u,
                //     uToken,
                //     endToken,
                // });
                this.next
            ) {
                if (this.currentValue === '') {
                    continue;
                }
                if (this.has(tokens.ItemVersionExpandersDetailsR)) {
                    r = +this.currentValue;
                    rToken = this.current;
                }
                if (this.has(tokens.ItemVersionExpandersDetailsL)) {
                    l = +this.currentValue;
                    lToken = this.current;
                }
                if (this.has(tokens.ItemVersionExpandersDetailsU)) {
                    u = +this.currentValue;
                    uToken = this.current;
                }
                if (this.has(tokens.ItemVersionExpandersDetailsD)) {
                    d = +this.currentValue;
                    dToken = this.current;
                }
                if (this.has(tokens.ItemVersionExpandersDetailsClose)) {
                    endToken = this.current;
                }
            }

            // let validator = new Validator({
            //     token,
            //     r,
            //     rToken,
            //     l,
            //     lToken,
            //     d,
            //     dToken,
            //     u,
            //     uToken,
            //     endToken,
            // });

            // if (validator.complete) {
            const value: ParserTypes.RLUD<number> = {
                r: {
                    value: r,
                    token: rToken,
                },
                l: {
                    value: l,
                    token: lToken,
                },
                u: {
                    value: u,
                    token: uToken,
                },
                d: {
                    value: d,
                    token: dToken,
                },
            };
            return {
                value,
                token,
                endToken,
            };
            // } else {
            //     console.error('ERROR', 'blank value returned from: parseItemVersionExpanders', validator.undefinedVarNames);
            //     throw new Error('blank value returned from: parseItemVersionExpanders');
            // }
        }
        return undefined;
    }
    parseItemVersionAnchor() {
        if (this.has(tokens.ItemVersionAnchor)) {
            const token = this.current;
            let endToken = undefined;

            let x: number = undefined;
            let xToken: ParserTypes.ParsedToken = undefined;
            let y: number = undefined;
            let yToken: ParserTypes.ParsedToken = undefined;

            for (; this.has(tokens.ItemVersionAnchor) && endToken === undefined; this.next) {
                if (this.currentValue === '') {
                    continue;
                }
                if (this.has(tokens.ItemVersionAnchorDetailsX)) {
                    x = +this.currentValue;
                    xToken = this.current;
                }
                if (this.has(tokens.ItemVersionAnchorDetailsY)) {
                    y = +this.currentValue;
                    yToken = this.current;
                }
                if (this.has(tokens.ItemVersionAnchorDetailsClose)) {
                    endToken = this.current;
                }
            }

            // let validator = new Validator({ token, x, xToken, y, yToken, endToken });

            // if (validator.complete) {
            const value: ParserTypes.Coordinate = {
                x: {
                    value: x,
                    token: xToken,
                },
                y: {
                    value: y,
                    token: yToken,
                },
            };
            return {
                value,
                token,
                endToken,
            };
            // } else {
            //     console.error('ERROR', 'blank value returned from: parseItemVersionAnchor', validator.undefinedVarNames);
            //     throw new Error('blank value returned from: parseItemVersionAnchor');
            // }
        }
        return undefined;
    }
}
