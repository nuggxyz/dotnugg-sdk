import * as fs from 'fs';
import * as path from 'path';

import invariant from 'tiny-invariant';

import * as TransformTypes from '../types/TransformTypes';
import * as EncoderTypes from '../types/EncoderTypes';
import * as BuilderTypes from '../types/BuilderTypes';
import { dotnugg } from '../..';
import { Config } from '../../parser/classes/Config';
import { ReceiverType } from '../../parser/types/ParserTypes';
import { invariantFatal } from '../../utils/index';

export class Transform {
    input: TransformTypes.Document;
    output: EncoderTypes.Document;

    featureMap: BuilderTypes.Dictionary<BuilderTypes.uint8> = {};
    calculatedReceiversByFeature: BuilderTypes.Dictionary<EncoderTypes.Receiver[]> = {};

    defaultLayerMap: BuilderTypes.Dictionary<BuilderTypes.uint8> = {};
    sortedFeatureStrings: string[] = [];
    sortedFeatureUints: BuilderTypes.uint8[] = [];

    graftableFeature: BuilderTypes.uint8;

    seenIds: { [_: number]: { [_: number]: boolean } } = { 0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {} };

    cachepath: string;

    private constructor(input: TransformTypes.Document, prev: EncoderTypes.Item[]) {
        this.input = input;

        this.output = {
            collection: this.input.collection ? this.transformCollection(this.input.collection) : undefined,
            items: this.input.items.reduce((accumulator: EncoderTypes.Item[], x) => {
                if (x.feature !== 'CHANGE_ME' && x.feature !== 'INVALID') {
                    accumulator.push(new ItemTransform(this).transformItem(x));
                }
                return accumulator;
            }, prev),
        };
    }

    public static fromObject(obj: TransformTypes.Document) {
        return new Transform(obj, []);
    }
    public static fromString(json: string) {
        return new Transform(JSON.parse(json), []);
    }

    public static fromParser(parser: dotnugg.parser) {
        return new Transform(JSON.parse(parser.json), []);
    }

    transformCollection(input: TransformTypes.Collection): EncoderTypes.Collection {
        dotnugg.utils.invariantVerbose(input !== undefined, 'Collection is undefined');
        Object.entries(input.features)
            .reverse()
            .map((args, i) => {
                this.featureMap[args[0]] = i;

                // console.log(args[0], this.defaultLayerMap[args[0]].toString());

                this.defaultLayerMap[args[0]] = new ItemTransform(this).transformLevel(args[1].zindex as TransformTypes.Level) - 4;
                if (args[1].graftable) {
                    invariantFatal(!this.graftableFeature, ['only support for one graftable feature']);
                    this.graftableFeature = i;
                }

                return args;
            })
            .map(([k, v], i) => {
                this.calculatedReceiversByFeature[k] = [...this.transformReceivers(v.receivers)];
            });

        return {
            featureLen: Object.keys(input.features).length,
            width: input.width,
        };
    }

    transformCoordinate(input: TransformTypes.Coordinate): EncoderTypes.Coordinate {
        return {
            x: input.x,
            y: input.y,
        };
    }
    transformRlud(input: TransformTypes.Rlud): EncoderTypes.Rlud {
        return {
            exists: input.d != 0 || input.l != 0 || input.r != 0 || input.u != 0,
            ...input,
        };
    }

    transformReceiver(input: TransformTypes.Receiver): EncoderTypes.Receiver {
        return {
            xorZindex: input.a.offset, // zindex or x
            yorYoffset: input.b.offset + (input.type === ReceiverType.CALCULATED && input.b.direction === '-' ? 32 : 0), // yoffset or y
            feature: this.featureMap[input.feature],
            calculated: input.type === ReceiverType.CALCULATED,
        };
    }
    transformReceivers(input: TransformTypes.Receiver[]): EncoderTypes.Receiver[] {
        return input.map((x) => this.transformReceiver(x));
    }

    transformLevelNullable(input: TransformTypes.LevelNullable): BuilderTypes.uint8 {
        return input == null ? 0 : new ItemTransform(this).transformLevel(input);
    }

    transformMatrixPixel(input: TransformTypes.MatrixPixel[]): BuilderTypes.uint8[] {
        return input.map((x) => +x.l);
    }

    transformColorString(orig: string): TransformTypes.Rgba {
        return dotnugg.utils.parseColor(orig)[2];
    }
}

export class ItemTransform {
    newColors: BuilderTypes.Dictionary<number> = {};
    feature?: string;
    transformer: Transform;

    constructor(transformer: Transform) {
        this.transformer = transformer;
    }

    // public get init() {
    //     return new ItemTransform();
    // }

    public transformItem(input: TransformTypes.Item): EncoderTypes.Item {
        this.feature = input.feature;
        const fileName = input.fileName.split('/')[input.fileName.split('/').length - 1];
        const folderName = input.fileName.split('/')[input.fileName.split('/').length - 2];

        dotnugg.utils.invariantFatal(fileName.split('.').length > 1, ['TRANSITEM:SPLTFN:0 - ', fileName.split('.').length]);
        const id = input.order;

        // invariant(this.transformer.lastSeenId[this.feature] + 1 == id, "")

        dotnugg.utils.invariantVerbose(
            !this.transformer.seenIds[this.transformer.featureMap[input.feature]][id],
            `duplicate id - ${id} - found for ${this.feature}`,
        );

        this.transformer.seenIds[this.transformer.featureMap[input.feature]][id] = true;

        dotnugg.utils.invariantVerbose(!Number.isNaN(id), `the id - ${id} - is not a valid number`);

        if (input.versions === undefined) {
            console.log(input);
        }
        return {
            id,
            fileName,
            folderName,
            pixels: this.transformPixels(input.colors),
            feature: this.transformer.featureMap[input.feature],
            versions: this.transformVersions(input.versions),
            mtimeMs: input.mtimeMs,
            order: input.order,
            weight: input.weight,
            fileUri: input.fileName,
            warnings: [],
            graftable: this.transformer.graftableFeature === this.transformer.featureMap[input.feature],
        };
    }

    transformLevel(input: TransformTypes.Level): BuilderTypes.uint8 {
        dotnugg.utils.invariantVerbose(
            input.direction === '-' || input.direction === '+',
            'must have a direction (+ / -) for the color layer',
        );
        let val = input.direction == '+' ? input.offset : input.offset * -1;

        if (val == 100) {
            dotnugg.utils.invariantVerbose(!!this.feature, 'this item does not have a feature');
            val = this.transformer.defaultLayerMap[this.feature];
        }

        // else {
        //     console.log({ val, hello: this.transformer.defaultLayerMap });
        // }
        dotnugg.utils.invariantVerbose(val >= -4 && val <= 11, `the layer - ${val} - exceeds the permitted limits`);

        return val + 4;
    }

    transformVersion(input: TransformTypes.Version): EncoderTypes.Version {
        if (input.data === undefined) {
            console.log(input);
        }
        return {
            anchor: this.transformer.transformCoordinate(input.anchor),
            expanders: input.expanders ? this.transformer.transformRlud(input.expanders) : { r: 0, l: 0, u: 0, d: 0, exists: false },
            groups: this.transformMatrix(input.data),
            len: { x: input.data.matrix[0].length, y: input.data.matrix.length },
            radii: input.radii ? this.transformer.transformRlud(input.radii) : { r: 0, l: 0, u: 0, d: 0, exists: false },
            receivers: [
                ...this.transformer.transformReceivers(input.receivers),
                ...this.transformer.calculatedReceiversByFeature[this.feature!],
            ],
        };
    }

    transformVersions(input: BuilderTypes.Dictionary<TransformTypes.Version>): EncoderTypes.Version[] {
        return Object.values(input).map((x) => this.transformVersion(x));
    }
    transformPixels(input: BuilderTypes.Dictionary<TransformTypes.Pixel>): EncoderTypes.Pixel[] {
        return Object.entries(input).map(([k, v], i) => {
            this.newColors[k] = i + 1;
            return this.transformPixel(v);
        });
    }

    transformPixel(input: TransformTypes.Pixel): EncoderTypes.Pixel {
        return {
            rgba: this.transformer.transformColorString(input.rgba),
            zindex: this.transformLevel(input.zindex),
            graftPalletIndex: input.graft ? input.name.charCodeAt(0) - 96 : null,
        };
    }

    transformMatrix(input: TransformTypes.Matrix): EncoderTypes.Group[] {
        let res: EncoderTypes.Group[] = [];
        let currlen = 0;
        let lastkey = this.newColors[input.matrix[0][0].l];
        input.matrix.forEach((row) => {
            row.forEach((pixel) => {
                if (currlen == 0 || (this.newColors[pixel.l] == lastkey && currlen < 19)) {
                    currlen++;
                } else {
                    res.push({ colorkey: lastkey, len: currlen });
                    currlen = 1;
                    lastkey = this.newColors[pixel.l];
                }
            });
        });

        res.push({ colorkey: lastkey, len: currlen });
        return res;
    }
}
