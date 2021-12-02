/* eslint-disable prefer-const */
import * as fs from 'fs';
import * as path from 'path';

import * as vscode from 'vscode';
import * as vsctm from 'vscode-textmate';

import tokens from '../constants/tokens';

import { Validator } from './Validator';
import { Config } from './Config';

export class ParserAccumulation {
    public static results: NL.DotNugg.Document = {
        collection: undefined,
        items: [],
    };

    public static async init(dir: string) {
        try {
            // Get the files as an array
            const files = await fs.promises.readdir(dir);

            // Loop them all with the new for...of
            for (const file of files) {
                // Get the full paths
                const fromPath = path.join(dir, file);

                // Stat the file to see if we have a file or dir
                const stat = await fs.promises.stat(fromPath);
                console.log('checking...', file);

                if (stat.isFile() && file.endsWith('.nugg')) {
                    console.log('checking...', file);

                    const parser = Parser.init(fromPath);
                    parser.compile();
                    ParserAccumulation.results.collection = parser.results.collection;
                    ParserAccumulation.results.items.push(...parser.results.items);
                } else if (stat.isDirectory() && !file.startsWith('.')) {
                    await ParserAccumulation.init(fromPath);
                }
                // Log because we're crazy
                // console.log("Moved '%s'->'%s'", fromPath, toPath);
            } // End for...of
        } catch (e) {
            // Catch anything bad that happens
            console.error("We've thrown! Whoops!", e);
        }
    }

    public static get json() {
        return JSON.stringify(
            ParserAccumulation.results,
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
}

export class Parser {
    public tokens: NL.DotNugg.ParsedToken[] = [];

    private index: number = 0;
    private document: string[];
    public linescopes: { [_: number]: string[] } = {};

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

    public results: NL.DotNugg.Document = {
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

    private constructor(filePath: string) {
        const file = fs.readFileSync(filePath, 'utf-8');
        this.document = file.split('/n');
    }

    private lineAt(num: number) {
        return this.document[num];
    }

    private valueAt(lineNum: number, token: vsctm.IToken) {
        return this.document[lineNum].slice(token.startIndex, token.endIndex);
    }

    private get lineCount() {
        return this.document.length;
    }

    public static init(filePath: string) {
        const instance = new Parser(filePath);

        const tokens: NL.DotNugg.ParsedToken[] = [];

        for (let i = 0; i < instance.lineCount; i++) {
            let p = Config.grammer.tokenizeLine(instance.lineAt(i), vsctm.INITIAL);

            while (p.ruleStack.depth > 1) {
                p.tokens.forEach((x) => {
                    if (instance.linescopes[i] === undefined) {
                        instance.linescopes[i] = [...x.scopes];
                    } else {
                        instance.linescopes[i].push(...x.scopes);
                    }

                    tokens.push({
                        token: x,
                        ruleStack: p.ruleStack,
                        line: instance.lineAt(i),
                        value: instance.valueAt(i, x),
                        lineNumber: i,
                    });
                });

                p = Config.grammer.tokenizeLine(instance.lineAt(++i), p.ruleStack);
            }
            p.tokens.forEach((x) => {
                if (instance.linescopes[i] === undefined) {
                    instance.linescopes[i] = [...x.scopes];
                } else {
                    instance.linescopes[i].push(...x.scopes);
                }

                tokens.push({
                    token: x,
                    ruleStack: p.ruleStack,
                    line: instance.lineAt(i),
                    value: instance.valueAt(i, x),
                    lineNumber: i,
                });
            });
        }

        instance.tokens = tokens;

        return instance;
    }

    compile() {
        try {
            for (; this.hasNext; this.next) {
                this.compileCollection();
                this.compileItem();
            }
        } catch (err) {
            console.error('ERROR', 'failed compilattion', { err });
        }
    }

    compileCollection() {
        if (this.has(tokens.Collection)) {
            let features: NL.DotNugg.RangeOf<NL.DotNugg.CollectionFeatures> = undefined;

            const token = this.current;
            let endToken = undefined;
            let width: number = undefined;
            let widthToken: NL.DotNugg.ParsedToken = undefined;

            for (; this.has(tokens.Collection) && this.hasNext; this.next) {
                const collectionFeatures = this.compileCollectionFeatures();
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
            const validator = new Validator({
                token,
                endToken,
                features,
                width,
                widthToken,
            });
            if (validator.complete) {
                this.results.collection = {
                    value: { features, width: { value: width, token: widthToken } },
                    token,
                    endToken,
                };
            } else {
                console.error('ERROR', 'blank value returned from: compileCollection', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileCollection');
            }
        }
    }

    compileCollectionFeatures() {
        if (this.has(tokens.CollectionFeatures)) {
            const token = this.current;
            let endToken = undefined;

            const collectionFeatures: NL.DotNugg.RangeOf<NL.DotNugg.CollectionFeature>[] = [];

            for (; this.has(tokens.CollectionFeatures) && Validator.anyUndefined({ token, endToken, collectionFeatures }); this.next) {
                const collectionfeature = this.compileCollectionFeature();
                if (collectionfeature) {
                    collectionFeatures.push(collectionfeature);
                }
                const collectionfeatureLong = this.compileCollectionFeatureLong();
                if (collectionfeatureLong) {
                    collectionFeatures.push(collectionfeatureLong);
                }
                if (this.has(tokens.CollectionFeaturesClose)) {
                    endToken = this.current;
                }
            }

            const validator = new Validator({ token, endToken, collectionFeatures });

            if (validator.complete) {
                const value: NL.DotNugg.CollectionFeatures = collectionFeatures.reduce((prev, curr) => {
                    return { [curr.value.name.value]: curr, ...prev };
                }, {});

                return {
                    token,
                    value,
                    endToken,
                };
            } else {
                console.error('ERROR', 'blank value returned from: compileCollectionFeatures', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileCollectionFeatures');
            }
        }
        return undefined;
    }

    compileCollectionFeature() {
        if (this.has(tokens.CollectionFeature)) {
            const token = this.current;
            let endToken = undefined;

            let r: number = undefined;
            let rToken: NL.DotNugg.ParsedToken = undefined;
            let l: number = undefined;
            let lToken: NL.DotNugg.ParsedToken = undefined;
            let u: number = undefined;
            let uToken: NL.DotNugg.ParsedToken = undefined;
            let d: number = undefined;
            let dToken: NL.DotNugg.ParsedToken = undefined;
            let radiiToken: NL.DotNugg.ParsedToken = undefined;

            // let anchorDirection: NL.DotNugg.Operator = undefined;
            // let anchorOffset: number = undefined;
            // let anchorToken: NL.DotNugg.ParsedToken = undefined;
            let zindexDirection: NL.DotNugg.Operator = undefined;
            let zindexOffset: number = undefined;
            let zindexToken: NL.DotNugg.ParsedToken = undefined;
            let name: string = undefined;
            let nameToken: NL.DotNugg.ParsedToken = undefined;

            for (
                ;
                this.has(tokens.CollectionFeature) &&
                Validator.anyUndefined({
                    token,
                    //   anchorDirection,
                    //   anchorOffset,
                    //   anchorToken,
                    zindexDirection,
                    zindexOffset,
                    zindexToken,
                    name,
                    nameToken,
                    endToken,
                    r,
                    rToken,
                    l,
                    lToken,
                    d,
                    dToken,
                    u,
                    uToken,
                });
                this.next
            ) {
                if (this.currentValue === '') {
                    continue;
                }
                if (this.has(tokens.CollectionFeatureDetailsZIndexOffset)) {
                    zindexOffset = +this.currentValue;
                }
                if (this.has(tokens.CollectionFeatureDetailsZIndexDirection)) {
                    zindexDirection = this.currentValue as NL.DotNugg.Operator;
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
                //      anchorDirection = this.currentValue as NL.DotNugg.Operator;
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

            let validator = new Validator({
                token,
                //  anchorKey,
                //  anchorDirection,
                //  anchorOffset,
                //  anchorToken,
                zindexDirection,
                zindexOffset,
                zindexToken,
                name,
                nameToken,
                endToken,
                r,
                rToken,
                l,
                lToken,
                d,
                dToken,
                u,
                uToken,
                radiiToken,
            });

            if (validator.complete) {
                const value: NL.DotNugg.CollectionFeature = {
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
            } else {
                console.error('ERROR', 'blank value returned from: compileCollectionFeature', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileCollectionFeature');
            }
        }
        return undefined;
    }

    compileCollectionFeatureLong() {
        if (this.has(tokens.CollectionFeatureLong)) {
            const token = this.current;
            let endToken = undefined;
            let name: string = undefined;
            let nameToken: NL.DotNugg.ParsedToken = undefined;
            let zindex: NL.DotNugg.RangeOf<NL.DotNugg.ZIndex> = undefined;
            let expandableAt: NL.DotNugg.RangeOf<NL.DotNugg.RLUD<number>> = undefined;
            let receivers: NL.DotNugg.RangeOf<NL.DotNugg.Receiver>[] = [];

            for (
                ;
                this.has(tokens.CollectionFeatureLong) &&
                Validator.anyUndefined({
                    token,
                    endToken,
                    name,
                    nameToken,
                    zindex,
                    expandableAt,
                    receivers,
                });
                this.next
            ) {
                if (this.has(tokens.CollectionFeatureLongName)) {
                    name = this.currentValue;
                    nameToken = this.current;
                }
                const expandableAt_ = this.compileCollectionFeatureLongExpandableAt();
                if (expandableAt_) {
                    expandableAt = expandableAt_;
                }

                const zindex_ = this.compileCollectionFeatureLongZIndex();
                if (zindex_) {
                    zindex = zindex_;
                }

                const receiver_ = this.compileGeneralReceiver('calculated');
                if (receiver_) {
                    receivers.push(receiver_);
                }
                if (this.has(tokens.CollectionFeatureLongClose)) {
                    endToken = this.current;
                    break;
                }
            }

            const validator = new Validator({
                token,
                endToken,
                name,
                nameToken,
                zindex,
                expandableAt,
                receivers,
            });

            if (validator.complete) {
                if (validator.complete) {
                    const value: NL.DotNugg.CollectionFeature = {
                        zindex,
                        name: {
                            value: name,
                            token: nameToken,
                        },
                        receivers, // empty bc these only exist in long version
                        expandableAt,
                    };

                    return {
                        token,
                        value,
                        endToken,
                    };
                } else {
                    console.error('ERROR', 'blank value returned from: compileCollectionFeatureLong', validator.undefinedVarNames);
                    throw new Error('blank value returned from: compileCollectionFeatureLong');
                }
            }
            return undefined;
        }
    }

    compileCollectionFeatureLongExpandableAt() {
        if (this.has(tokens.CollectionFeatureLongExpandableAt)) {
            const token = this.current;
            let endToken = undefined;

            let r: number = undefined;
            let rToken: NL.DotNugg.ParsedToken = undefined;
            let l: number = undefined;
            let lToken: NL.DotNugg.ParsedToken = undefined;
            let u: number = undefined;
            let uToken: NL.DotNugg.ParsedToken = undefined;
            let d: number = undefined;
            let dToken: NL.DotNugg.ParsedToken = undefined;

            for (
                ;
                this.has(tokens.CollectionFeatureLongExpandableAt) &&
                Validator.anyUndefined({
                    token,
                    r,
                    rToken,
                    l,
                    lToken,
                    d,
                    dToken,
                    u,
                    uToken,
                    endToken,
                });
                this.next
            ) {
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

            let validator = new Validator({
                token,
                r,
                rToken,
                l,
                lToken,
                d,
                dToken,
                u,
                uToken,
                endToken,
            });

            if (validator.complete) {
                const value: NL.DotNugg.RLUD<number> = {
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
            } else {
                console.error('ERROR', 'blank value returned from: compileCollectionFeatureLongExpandableAt', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileCollectionFeatureLongExpandableAt');
            }
        }
        return undefined;
    }

    compileCollectionFeatureLongZIndex() {
        if (this.has(tokens.CollectionFeatureLongZIndex)) {
            let token = undefined;
            let endToken = undefined;

            let direction: NL.DotNugg.Operator = undefined;
            let offset: number = undefined;

            for (
                ;
                this.has(tokens.CollectionFeatureLongZIndex) && Validator.anyUndefined({ token, direction, offset, endToken });
                this.next
            ) {
                if (this.currentValue === '') {
                    continue;
                }
                if (this.has(tokens.CollectionFeatureLongZIndexDirection)) {
                    offset = +this.currentValue;
                }
                if (this.has(tokens.CollectionFeatureLongZIndexOffset)) {
                    direction = this.currentValue as NL.DotNugg.Operator;
                }
                if (this.has(tokens.CollectionFeatureLongZIndex)) {
                    token = this.current;
                    endToken = this.current;
                }
            }

            let validator = new Validator({ token, direction, offset, endToken });

            if (validator.complete) {
                const value: NL.DotNugg.ZIndex = {
                    direction,
                    offset,
                };
                return {
                    value,
                    token,
                    endToken,
                };
            } else {
                console.error('ERROR', 'blank value returned from: compileItemVersionAnchor', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileItemVersionAnchor');
            }
        }
        return undefined;
    }

    compileGeneralColors() {
        if (this.has(tokens.GeneralColors)) {
            const token = this.current;
            let endToken = undefined;

            const colors: NL.DotNugg.RangeOf<NL.DotNugg.Color>[] = [];

            for (; this.has(tokens.GeneralColors) && Validator.anyUndefined({ token, endToken, colors }); this.next) {
                const color = this.compileGeneralColor();
                if (color) {
                    colors.push(color);
                }
                if (this.has(tokens.GeneralColorsClose)) {
                    endToken = this.current;
                }
            }

            let validator = new Validator({ token, endToken, colors });

            if (validator.complete) {
                const value: NL.DotNugg.Colors = colors.reduce((prev, curr) => {
                    return { [curr.value.name.value]: curr, ...prev };
                }, {});
                return {
                    token,
                    value,
                    endToken,
                };
            } else {
                console.error('ERROR', 'blank value returned from compileGeneralColors:', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileGeneralColors');
            }
        }
        return undefined;
    }

    compileGeneralColor() {
        if (this.has(tokens.GeneralColor)) {
            const token = this.current;
            let endToken = undefined;

            let rgba: NL.DotNugg.RGBA = undefined;
            let rgbaToken: NL.DotNugg.ParsedToken = undefined;
            let zindexDirection: NL.DotNugg.Operator = undefined;
            let zindexOffset: number = undefined;
            let zindexToken: NL.DotNugg.ParsedToken = undefined;
            let name: string = undefined;
            let nameToken: NL.DotNugg.ParsedToken = undefined;

            for (
                ;
                this.has(tokens.GeneralColor) &&
                Validator.anyUndefined({
                    token,
                    rgba,
                    rgbaToken,
                    zindexDirection,
                    zindexOffset,
                    zindexToken,
                    name,
                    nameToken,
                    endToken,
                });
                this.next
            ) {
                if (this.currentValue === '') {
                    continue;
                }
                if (this.has(tokens.GeneralColorDetailsZIndexOffset)) {
                    zindexOffset = this.currentValue.toLowerCase() === 'd' ? 100 : +this.currentValue;
                }
                if (this.has(tokens.GeneralColorDetailsZIndexDirection)) {
                    zindexDirection = this.currentValue as NL.DotNugg.Operator;
                }
                if (this.has(tokens.GeneralColorDetailsZIndex)) {
                    zindexToken = this.current;
                }
                if (this.has(tokens.GeneralColorName)) {
                    name = this.currentValue;
                    nameToken = this.current;
                }
                if (this.has(tokens.GeneralColorDetailsRgba)) {
                    rgba = this.currentValue as NL.DotNugg.RGBA;
                    rgbaToken = this.current;
                }
                if (this.has(tokens.GeneralColorDetailsClose)) {
                    endToken = this.current;
                }
            }

            let validator = new Validator({
                token,
                rgba,
                rgbaToken,
                zindexDirection,
                zindexOffset,
                zindexToken,
                name,
                nameToken,
                endToken,
            });

            if (validator.complete) {
                const value: NL.DotNugg.Color = {
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
                };
                return {
                    value,
                    token,
                    endToken,
                };
            } else {
                console.error('ERROR', 'blank value returned from: compileGeneralColor', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileGeneralColor');
            }
        }
        return undefined;
    }

    compileGeneralData(): NL.DotNugg.RangeOf<NL.DotNugg.Data> {
        if (this.has(tokens.GeneralData)) {
            let matrix: NL.DotNugg.RangeOf<NL.DotNugg.DataRow>[] = [];
            let token = undefined;
            let endToken = undefined;

            for (; this.has(tokens.GeneralData) && Validator.anyUndefined({ token, matrix, endToken }); this.next) {
                if (!token) {
                    this.back();
                    token = this.current;
                    continue;
                }
                const row = this.compileGeneralDataRow();
                if (row) {
                    matrix.push(row);
                }
                if (this.has(tokens.GeneralDataClose)) {
                    endToken = this.current;
                }
            }
            const validator = new Validator({ token, matrix, endToken });
            if (validator.complete) {
                return {
                    value: {
                        matrix,
                    },
                    token,
                    endToken,
                };
            } else {
                console.error('ERROR', 'blank value returned from: compileGeneralData', validator.undefinedVarNames);

                throw new Error('blank value returned from: compileGeneralData');
            }
        }
        return undefined;
    }

    compileGeneralDataRow(): NL.DotNugg.RangeOf<NL.DotNugg.DataRow> {
        if (this.has(tokens.GeneralDataRow)) {
            const token = this.current;
            let pixels: NL.DotNugg.RangeOf<NL.DotNugg.Pixel>[] = [];
            let lastLine = this.current.lineNumber;
            let endToken = undefined;

            for (; this.has(tokens.GeneralDataRow); this.next) {
                if (lastLine !== this.current.lineNumber) {
                    this.back();
                    break;
                }
                const pixel = this.compileGeneralDataPixel();

                if (pixel) {
                    pixels.push(pixel);
                    this.back();
                }
                endToken = this.current;
            }
            const validator = new Validator({ token, pixels, endToken });
            if (validator.complete) {
                return {
                    value: pixels,
                    token,
                    endToken,
                };
            } else {
                console.error('ERROR', 'blank value returned from: compilePixel', validator.undefinedVarNames);

                throw new Error('blank value returned from: compilePixel');
            }
        }
        return undefined;
    }

    compileGeneralDataPixel() {
        if (this.has(tokens.GeneralDataRowPixel)) {
            const token = this.current;
            let endToken = this.current;

            let label: string = undefined;
            let labelToken: NL.DotNugg.ParsedToken = undefined;
            let type: NL.DotNugg.PixelType = undefined;
            let typeToken: NL.DotNugg.ParsedToken = undefined;

            for (
                ;
                this.has(tokens.GeneralDataRowPixel) &&
                Validator.anyUndefined({
                    token,
                    labelToken,
                    type,
                    typeToken,
                    label,
                    endToken,
                });
                this.next
            ) {
                if (this.currentValue !== '') {
                    if (this.has(tokens.GeneralDataRowPixelTransparent)) {
                        type = 'transparent';
                        typeToken = this.current;
                        labelToken = this.current;
                        label = this.currentValue;
                    }
                    if (this.has(tokens.GeneralDataRowPixelFilter)) {
                        type = 'filter';
                        typeToken = this.current;
                        labelToken = this.current;
                        label = this.currentValue;
                    }
                    if (this.has(tokens.GeneralDataRowPixelColor)) {
                        type = 'color';
                        typeToken = this.current;
                        labelToken = this.current;
                        label = this.currentValue;
                    }
                }
            }

            const validator = new Validator({
                token,
                labelToken,
                type,
                typeToken,
                endToken,
                label,
            });
            if (validator.complete) {
                return {
                    value: {
                        label: {
                            value: label,
                            token: labelToken,
                        },
                        type: {
                            value: type,
                            token: typeToken,
                        },
                    },
                    token,
                    endToken,
                };
            } else {
                console.error('ERROR', 'blank value returned from: compilePixel', validator.undefinedVarNames);

                throw new Error('blank value returned from: compilePixel');
            }
        }
        return undefined;
    }

    compileGeneralReceiver(type: 'calculated' | 'static') {
        if (this.has(tokens.GeneralReceiver)) {
            const token = this.current;
            let endToken = undefined;

            let aDirection: NL.DotNugg.Operator = undefined;
            let aOffset: number = undefined;
            let bDirection: NL.DotNugg.Operator = undefined;
            let bOffset: number = undefined;

            let aToken: NL.DotNugg.ParsedToken = undefined;
            let bToken: NL.DotNugg.ParsedToken = undefined;

            let feature: string = undefined;
            let featureToken: NL.DotNugg.ParsedToken = undefined;

            for (; this.has(tokens.GeneralReceiver) && Validator.anyUndefined({ token, endToken }); this.next) {
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
                    aDirection = this.currentValue as NL.DotNugg.Operator;
                }
                if (this.has(tokens.GeneralReceiverDetailsAOffset)) {
                    aOffset = +this.currentValue;
                }
                if (this.has(tokens.GeneralReceiverDetailsB)) {
                    bToken = this.current;
                }
                if (this.has(tokens.GeneralReceiverDetailsBDirection)) {
                    bDirection = this.currentValue as NL.DotNugg.Operator;
                }
                if (this.has(tokens.GeneralReceiverDetailsBOffset)) {
                    bOffset = +this.currentValue;
                }

                if (this.has(tokens.GeneralReceiverDetailsClose)) {
                    endToken = this.current;
                }
            }

            let validator = new Validator({
                token,
                aOffset,
                bOffset,
                aToken,
                bToken,
                feature,
                featureToken,
                endToken,
            });

            if (validator.complete) {
                const value: NL.DotNugg.Receiver = {
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
            } else {
                console.error('ERROR', 'blank value returned from: compileGeneralColor', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileGeneralColor');
            }
        }
        return undefined;
    }

    compileItem() {
        if (this.has(tokens.Item)) {
            const token = this.current;
            let endToken = undefined;
            let feature: string = undefined;
            let isDefault: boolean = undefined;

            let featureToken: NL.DotNugg.ParsedToken = undefined;
            let colors = undefined;
            let versions = undefined;

            for (
                ;
                this.has(tokens.Item) &&
                this.hasNext &&
                Validator.anyUndefined({
                    token,
                    endToken,
                    feature,
                    featureToken,
                    colors,
                    versions,
                });
                this.next
            ) {
                if (this.has(tokens.ItemOpenFeature)) {
                    feature = this.currentValue;
                    featureToken = this.current;
                }
                if (this.has(tokens.ItemOpenDefaultOrItem)) {
                    isDefault = this.currentValue === 'default';
                }
                const colors_ = this.compileGeneralColors();
                if (colors_) {
                    colors = colors_;
                }
                const versions_ = this.compileItemVersions();
                if (versions_) {
                    versions = versions_;
                }
                if (this.has(tokens.ItemClose)) {
                    endToken = this.current;
                }
            }
            // this.results.items.push({ value, token, endToken });
            const validator = new Validator({
                token,
                endToken,
                feature,
                featureToken,
                colors,
                versions,
                isDefault,
            });
            if (validator.complete) {
                this.results.items.push({
                    value: {
                        isDefault,
                        colors,
                        versions,
                        feature: {
                            value: feature,
                            token: featureToken,
                        },
                    },
                    token,
                    endToken,
                });
            } else {
                console.error('ERROR', 'blank value returned from: compileItem', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileItem');
            }
        }
        return undefined;
    }

    compileItemVersions() {
        if (this.has(tokens.ItemVersions)) {
            const token = this.current;
            let endToken = undefined;

            const versions: NL.DotNugg.RangeOf<NL.DotNugg.Version>[] = [];

            for (; this.has(tokens.ItemVersions) && Validator.anyUndefined({ token, endToken, versions }); this.next) {
                const version = this.compileItemVersion();
                if (version) {
                    versions.push(version);
                }
                if (this.has(tokens.ItemVersionsClose)) {
                    endToken = this.current;
                }
            }

            let validator = new Validator({ token, endToken, versions });

            if (validator.complete) {
                const value: NL.DotNugg.Colors = versions.reduce((prev, curr) => {
                    return { [curr.value.name.value]: curr, ...prev };
                }, {});
                return {
                    token,
                    value,
                    endToken,
                };
            } else {
                console.error('ERROR', 'blank value returned from compileGeneralColors:', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileGeneralColors');
            }
        }
        return undefined;
    }

    compileItemVersion() {
        if (this.has(tokens.ItemVersion)) {
            let data: NL.DotNugg.RangeOf<NL.DotNugg.Data> = undefined;
            let radii: NL.DotNugg.RangeOf<NL.DotNugg.RLUD<number>> = undefined;
            let expanders: NL.DotNugg.RangeOf<NL.DotNugg.RLUD<number>> = undefined;
            let anchor: NL.DotNugg.RangeOf<NL.DotNugg.Coordinate> = undefined;
            let receivers: NL.DotNugg.RangeOf<NL.DotNugg.Receiver>[] = [];

            let name: string = undefined;
            let nameToken: NL.DotNugg.ParsedToken = undefined;
            const token = this.current;
            let endToken = undefined;

            for (
                ;
                this.has(tokens.ItemVersion) &&
                Validator.anyUndefined({
                    token,
                    endToken,
                    radii,
                    expanders,
                    data,
                    anchor,
                    name,
                    nameToken,
                });
                this.next
            ) {
                if (this.has(tokens.ItemVersionName)) {
                    name = this.currentValue;
                    nameToken = this.current;
                }
                const radii_ = this.compileItemVersionRadii();
                if (radii_) {
                    radii = radii_;
                }
                // Logger.out(this.current.token.scopes);
                const expanders_ = this.compileItemVersionExpanders();
                if (expanders_) {
                    expanders = expanders_;
                }

                const anchor_ = this.compileItemVersionAnchor();
                if (anchor_) {
                    anchor = anchor_;
                }
                const generalData = this.compileGeneralData();
                if (generalData) {
                    data = generalData;
                }

                const receiver_ = this.compileGeneralReceiver('static');
                if (receiver_) {
                    receivers.push(receiver_);
                }
                if (this.has(tokens.ItemVersionClose)) {
                    endToken = this.current;
                }
            }

            this.back();

            const validator = new Validator({
                token,
                endToken,
                radii,
                expanders,
                data,
                anchor,
                name,
                nameToken,
            });
            if (validator.complete) {
                return {
                    value: {
                        radii,
                        expanders,
                        data,
                        anchor,
                        receivers: [],
                        name: { value: name, token: nameToken },
                    },
                    token,
                    endToken,
                };
            } else {
                console.error('ERROR', 'blank value returned from: compileItemVersion', validator.undefinedVarNames);

                throw new Error('blank value returned from: compileItemVersion');
            }
        }
    }

    compileItemVersionRadii() {
        if (this.has(tokens.ItemVersionRadii)) {
            const token = this.current;
            let endToken = undefined;

            let r: number = undefined;
            let rToken: NL.DotNugg.ParsedToken = undefined;
            let l: number = undefined;
            let lToken: NL.DotNugg.ParsedToken = undefined;
            let u: number = undefined;
            let uToken: NL.DotNugg.ParsedToken = undefined;
            let d: number = undefined;
            let dToken: NL.DotNugg.ParsedToken = undefined;

            for (
                ;
                this.has(tokens.ItemVersionRadii) &&
                Validator.anyUndefined({
                    token,
                    r,
                    rToken,
                    l,
                    lToken,
                    d,
                    dToken,
                    u,
                    uToken,
                    endToken,
                });
                this.next
            ) {
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

            let validator = new Validator({
                token,
                r,
                rToken,
                l,
                lToken,
                d,
                dToken,
                u,
                uToken,
                endToken,
            });

            if (validator.complete) {
                const value: NL.DotNugg.RLUD<number> = {
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
            } else {
                console.error('ERROR', 'blank value returned from: compileItemVersionRadii', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileItemVersionRadii');
            }
        }
        return undefined;
    }

    compileItemVersionExpanders() {
        if (this.has(tokens.ItemVersionExpanders)) {
            const token = this.current;
            let endToken = undefined;

            let r: number = undefined;
            let rToken: NL.DotNugg.ParsedToken = undefined;
            let l: number = undefined;
            let lToken: NL.DotNugg.ParsedToken = undefined;
            let u: number = undefined;
            let uToken: NL.DotNugg.ParsedToken = undefined;
            let d: number = undefined;
            let dToken: NL.DotNugg.ParsedToken = undefined;

            for (
                ;
                this.has(tokens.ItemVersionExpanders) &&
                Validator.anyUndefined({
                    token,
                    r,
                    rToken,
                    l,
                    lToken,
                    d,
                    dToken,
                    u,
                    uToken,
                    endToken,
                });
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

            let validator = new Validator({
                token,
                r,
                rToken,
                l,
                lToken,
                d,
                dToken,
                u,
                uToken,
                endToken,
            });

            if (validator.complete) {
                const value: NL.DotNugg.RLUD<number> = {
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
            } else {
                console.error('ERROR', 'blank value returned from: compileItemVersionExpanders', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileItemVersionExpanders');
            }
        }
        return undefined;
    }
    compileItemVersionAnchor() {
        if (this.has(tokens.ItemVersionAnchor)) {
            const token = this.current;
            let endToken = undefined;

            let x: number = undefined;
            let xToken: NL.DotNugg.ParsedToken = undefined;
            let y: number = undefined;
            let yToken: NL.DotNugg.ParsedToken = undefined;

            for (; this.has(tokens.ItemVersionAnchor) && Validator.anyUndefined({ token, x, xToken, y, yToken, endToken }); this.next) {
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

            let validator = new Validator({ token, x, xToken, y, yToken, endToken });

            if (validator.complete) {
                const value: NL.DotNugg.Coordinate = {
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
            } else {
                console.error('ERROR', 'blank value returned from: compileItemVersionAnchor', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileItemVersionAnchor');
            }
        }
        return undefined;
    }
}
