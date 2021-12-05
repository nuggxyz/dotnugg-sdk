import { ethers } from 'ethers';
import invariant from 'tiny-invariant';

import { ParserAccumulation } from './Parser';
export class Transformer {
    static input: NL.DotNugg.Transformer.Document;
    static output: NL.DotNugg.Encoder.Document;

    static featureMap: Dictionary<uint8> = {};
    static defaultLayerMap: Dictionary<uint8> = {};
    static sortedFeatureStrings: string[] = [];
    static sortedFeatureUints: uint8[] = [];

    public static init() {
        const res = ParserAccumulation.json;
        Transformer.input = JSON.parse(res);
        this.output = {
            collection: this.transformCollection(this.input.collection),
            items: this.input.items.map((x) => ItemTransformer.init.transformItem(x)),
        };
    }

    static transformCollection(input: NL.DotNugg.Transformer.Collection): NL.DotNugg.Encoder.Collection {
        Object.entries(input.features)
            .reverse()
            .map(([k, v], i) => {
                this.featureMap[k] = i;
                this.defaultLayerMap[k] = ItemTransformer.init.transformLevel(v.zindex);
            });
        return {
            featureLen: Object.keys(input.features).length,
            width: input.width,
        };
    }

    static transformCoordinate(input: NL.DotNugg.Transformer.Coordinate): NL.DotNugg.Encoder.Coordinate {
        return {
            x: input.x,
            y: input.y,
        };
    }
    static transformRlud(input: NL.DotNugg.Transformer.Rlud): NL.DotNugg.Encoder.Rlud {
        return {
            exists: input.d != 0 || input.l != 0 || input.r != 0 || input.u != 0,
            ...input,
        };
    }

    static transformReceiver(input: NL.DotNugg.Transformer.Receiver): NL.DotNugg.Encoder.Receiver {
        console.log('HEREREREE:', input);
        return {
            xorZindex: input.a.offset, // zindex or x
            yorYoffset: input.b.offset, // yoffset or y
            feature: Transformer.featureMap[input.feature],
            calculated: input.type === 'calculated',
        };
    }
    static transformReceivers(input: NL.DotNugg.Transformer.Receiver[]): NL.DotNugg.Encoder.Receiver[] {
        return input.map((x) => this.transformReceiver(x));
    }

    static transformLevelNullable(input: NL.DotNugg.Transformer.LevelNullable): NL.DotNugg.Encoder.uint8 {
        return input == null ? 0 : ItemTransformer.init.transformLevel(input);
    }

    static transformMatrixPixel(input: NL.DotNugg.Transformer.MatrixPixel[]): uint8[] {
        return input.map((x) => +x.label);
    }
    static rgba2hex(orig: string): NL.DotNugg.Transformer.Rgba {
        var a,
            rgb = orig.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i),
            alpha = ((rgb && rgb[4]) || '').trim(),
            hex = rgb
                ? (+rgb[1] | (1 << 8)).toString(16).slice(1) +
                  (+rgb[2] | (1 << 8)).toString(16).slice(1) +
                  (+rgb[3] | (1 << 8)).toString(16).slice(1)
                : orig;

        if (alpha !== '') {
            a = alpha;
        } else {
            a = 1;
        }
        console.log('here', a);
        // multiply before convert to HEX
        // a = ((a * 255) | (1 << 8)).toString(16).slice(1);
        // hex = hex + a;
        return {
            r: +ethers.utils.toUtf8Bytes(hex)[0],
            g: +ethers.utils.toUtf8Bytes(hex)[1],
            b: +ethers.utils.toUtf8Bytes(hex)[2],
            a: Math.floor(255 * +a),
        };
    }
}

export class ItemTransformer {
    newColors: Dictionary<number> = {};
    feature: string;
    constructor() {}

    public static get init() {
        return new ItemTransformer();
    }

    public transformItem(input: NL.DotNugg.Transformer.Item): NL.DotNugg.Encoder.Item {
        this.feature = input.feature;

        return {
            pixels: this.transformPixels(input.colors),
            feature: Transformer.featureMap[input.feature],
            versions: this.transformVersions(input.versions),
        };
    }

    transformLevel(input: NL.DotNugg.Transformer.Level): NL.DotNugg.Encoder.uint8 {
        let val = input.direction == '+' ? input.offset : input.offset * -1;
        if (val == 100) {
            invariant(this.feature, 'TRANS:LEV:0');
            val = Transformer.defaultLayerMap[this.feature];
        }
        invariant(val >= -4 && val <= 11, 'TRANS:LEV:1 - ' + val);
        return val + 4;
    }

    transformVersion(input: NL.DotNugg.Transformer.Version): NL.DotNugg.Encoder.Version {
        console.log('HERERERERE @22222:', input.receivers.length);
        return {
            anchor: Transformer.transformCoordinate(input.anchor),
            expanders: Transformer.transformRlud(input.expanders),
            groups: this.transformMatrix(input.data),
            len: { x: input.data.matrix[0].length, y: input.data.matrix.length },
            radii: Transformer.transformRlud(input.radii),
            receivers: Transformer.transformReceivers(input.receivers),
        };
    }

    transformVersions(input: Dictionary<NL.DotNugg.Transformer.Version>): NL.DotNugg.Encoder.Version[] {
        return Object.values(input).map((x) => this.transformVersion(x));
    }
    transformPixels(input: Dictionary<NL.DotNugg.Transformer.Pixel>): NL.DotNugg.Encoder.Pixel[] {
        return Object.entries(input).map(([k, v], i) => {
            this.newColors[k] = i;
            return this.transformPixel(v);
        });
    }

    transformPixel(input: NL.DotNugg.Transformer.Pixel): NL.DotNugg.Encoder.Pixel {
        return {
            rgba: Transformer.rgba2hex(input.rgba),
            zindex: this.transformLevel(input.zindex),
        };
    }

    transformMatrix(input: NL.DotNugg.Transformer.Matrix): NL.DotNugg.Encoder.Group[] {
        let res: NL.DotNugg.Encoder.Group[] = [];

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
