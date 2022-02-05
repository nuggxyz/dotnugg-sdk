import invariant from 'tiny-invariant';

import * as TransformTypes from '../types/TransformTypes';
import * as EncoderTypes from '../types/EncoderTypes';
import * as BuilderTypes from '../types/BuilderTypes';
import { dotnugg } from '../..';

export class Transform {
    input: TransformTypes.Document;
    output: EncoderTypes.Document;

    featureMap: BuilderTypes.Dictionary<BuilderTypes.uint8> = {};
    calculatedReceiversByFeature: BuilderTypes.Dictionary<EncoderTypes.Receiver[]> = {};

    defaultLayerMap: BuilderTypes.Dictionary<BuilderTypes.uint8> = {};
    sortedFeatureStrings: string[] = [];
    sortedFeatureUints: BuilderTypes.uint8[] = [];

    private constructor(input: TransformTypes.Document) {
        this.input = input;

        this.output = {
            collection: this.input.collection ? this.transformCollection(this.input.collection) : undefined,
            items: this.input.items.map((x) => new ItemTransform(this).transformItem(x)),
        };
    }
    public static fromObject(obj: TransformTypes.Document) {
        return new Transform(obj);
    }
    public static fromString(json: string) {
        return new Transform(JSON.parse(json));
    }

    public static fromParser(parser: dotnugg.parser) {
        return new Transform(JSON.parse(parser.json));
    }

    transformCollection(input: TransformTypes.Collection): EncoderTypes.Collection {
        invariant(input !== undefined, 'UND');
        Object.entries(input.features)
            .reverse()
            .map((args, i) => {
                this.featureMap[args[0]] = i;
                // console.log(args[0], this.defaultLayerMap[args[0]].toString());
                this.defaultLayerMap[args[0]] = new ItemTransform(this).transformLevel(args[1].zindex as TransformTypes.Level) - 4;
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
            yorYoffset: input.b.offset + (input.type === 'calculated' && input.b.direction === '-' ? 32 : 0), // yoffset or y
            feature: this.featureMap[input.feature],
            calculated: input.type === 'calculated',
        };
    }
    transformReceivers(input: TransformTypes.Receiver[]): EncoderTypes.Receiver[] {
        return input.map((x) => this.transformReceiver(x));
    }

    transformLevelNullable(input: TransformTypes.LevelNullable): BuilderTypes.uint8 {
        return input == null ? 0 : new ItemTransform(this).transformLevel(input);
    }

    transformMatrixPixel(input: TransformTypes.MatrixPixel[]): BuilderTypes.uint8[] {
        return input.map((x) => +x.label);
    }
    rgba2hex(orig: string): TransformTypes.Rgba {
        const res = orig.split('(')[1].split(')')[0].split(',');

        // var a,
        //     rgb = orig.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i),
        //     alpha = ((rgb && rgb[4]) || '').trim(),
        //     hex = rgb
        //         ? (+rgb[1] | (1 << 8)).toString(16).slice(1) +
        //           (+rgb[2] | (1 << 8)).toString(16).slice(1) +
        //           (+rgb[3] | (1 << 8)).toString(16).slice(1)
        //         : orig;

        // if (alpha !== '') {
        //     a = alpha;
        // } else {
        //     a = 1;
        // }
        // // // multiply before convert to HEX
        // // // a = ((a * 255) | (1 << 8)).toString(16).slice(1);
        // // // hex = hex + a;
        return {
            r: +res[0],
            g: +res[1],
            b: +res[2],
            a: +res[3] > 1 && +res[3] !== 0 ? +res[3] : Math.floor(255 * +res[3]),
        };
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

        invariant(fileName.split('.').length > 1, 'TRANSITEM:SPLTFN:0 - ' + fileName.split('.').length);

        const id = fileName.split('.')[1] === 'collection' ? 0 : +fileName.split('.')[1];

        invariant(!Number.isNaN(id), 'TRANSITEM:SPLTFN:1 - ' + fileName.split('.')[1] + ' - ' + id);
        // console.log(fileName);
        return {
            id,
            fileName,
            folderName,
            pixels: this.transformPixels(input.colors),
            feature: this.transformer.featureMap[input.feature],
            versions: this.transformVersions(input.versions),
        };
    }

    transformLevel(input: TransformTypes.Level): BuilderTypes.uint8 {
        invariant(input.direction == '-' || input.direction == '+', 'TRANSLEV:DIR');
        let val = input.direction == '+' ? input.offset : input.offset * -1;
        if (val == 100) {
            invariant(this.feature, 'TRANS:LEV:0');
            val = this.transformer.defaultLayerMap[this.feature];
        }

        // else {
        //     console.log({ val, hello: this.transformer.defaultLayerMap });
        // }
        invariant(val >= -4 && val <= 11, 'TRANS:LEV:1 - ' + val);

        return val + 4;
    }

    transformVersion(input: TransformTypes.Version): EncoderTypes.Version {
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
            rgba: this.transformer.rgba2hex(input.rgba),
            zindex: this.transformLevel(input.zindex),
        };
    }

    transformMatrix(input: TransformTypes.Matrix): EncoderTypes.Group[] {
        let res: EncoderTypes.Group[] = [];
        let currlen = 0;
        let lastkey = this.newColors[input.matrix[0][0].label];

        input.matrix.forEach((row) => {
            row.forEach((pixel) => {
                if (currlen == 0 || (this.newColors[pixel.label] == lastkey && currlen < 19)) {
                    currlen++;
                } else {
                    res.push({ colorkey: lastkey, len: currlen });
                    currlen = 1;
                    lastkey = this.newColors[pixel.label];
                }
            });
        });

        res.push({ colorkey: lastkey, len: currlen });
        return res;
    }
}
