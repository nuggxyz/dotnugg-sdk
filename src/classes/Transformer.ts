import invariant from 'tiny-invariant';

import { Parser } from './Parser';

export class Transformer {
    input: NL.DotNugg.Transformer.Document;
    output: NL.DotNugg.Encoder.Document;

    featureMap: Dictionary<uint8> = {};
    calculatedReceiversByFeature: Dictionary<NL.DotNugg.Encoder.Receiver[]> = {};

    defaultLayerMap: Dictionary<uint8> = {};
    sortedFeatureStrings: string[] = [];
    sortedFeatureUints: uint8[] = [];

    constructor(parser: Parser) {
        this.input = JSON.parse(parser.json);
        this.output = {
            collection: this.transformCollection(this.input.collection),
            items: this.input.items.map((x) => new ItemTransformer(this).transformItem(x)),
        };
    }

    transformCollection(input: NL.DotNugg.Transformer.Collection): NL.DotNugg.Encoder.Collection {
        Object.entries(input.features)
            .reverse()
            .map((args, i) => {
                this.featureMap[args[0]] = i;
                this.defaultLayerMap[args[0]] = new ItemTransformer(this).transformLevel(args[1].zindex);
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

    transformCoordinate(input: NL.DotNugg.Transformer.Coordinate): NL.DotNugg.Encoder.Coordinate {
        return {
            x: input.x,
            y: input.y,
        };
    }
    transformRlud(input: NL.DotNugg.Transformer.Rlud): NL.DotNugg.Encoder.Rlud {
        return {
            exists: input.d != 0 || input.l != 0 || input.r != 0 || input.u != 0,
            ...input,
        };
    }

    transformReceiver(input: NL.DotNugg.Transformer.Receiver): NL.DotNugg.Encoder.Receiver {
        return {
            xorZindex: input.a.offset, // zindex or x
            yorYoffset: input.b.offset, // yoffset or y
            feature: this.featureMap[input.feature],
            calculated: input.type === 'calculated',
        };
    }
    transformReceivers(input: NL.DotNugg.Transformer.Receiver[]): NL.DotNugg.Encoder.Receiver[] {
        return input.map((x) => this.transformReceiver(x));
    }

    transformLevelNullable(input: NL.DotNugg.Transformer.LevelNullable): NL.DotNugg.Encoder.uint8 {
        return input == null ? 0 : new ItemTransformer(this).transformLevel(input);
    }

    transformMatrixPixel(input: NL.DotNugg.Transformer.MatrixPixel[]): uint8[] {
        return input.map((x) => +x.label);
    }
    rgba2hex(orig: string): NL.DotNugg.Transformer.Rgba {
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
        // console.log('here', a);
        // // multiply before convert to HEX
        // // a = ((a * 255) | (1 << 8)).toString(16).slice(1);
        // // hex = hex + a;
        // console.log(hex);
        return {
            r: +res[0],
            g: +res[1],
            b: +res[2],
            a: Math.floor(255 * +res[3]),
        };
    }
}

export class ItemTransformer {
    newColors: Dictionary<number> = {};
    feature: string;
    transformer: Transformer;

    constructor(transformer: Transformer) {
        this.transformer = transformer;
    }

    // public get init() {
    //     return new ItemTransformer();
    // }

    public transformItem(input: NL.DotNugg.Transformer.Item): NL.DotNugg.Encoder.Item {
        this.feature = input.feature;

        return {
            pixels: this.transformPixels(input.colors),
            feature: this.transformer.featureMap[input.feature],
            versions: this.transformVersions(input.versions),
        };
    }

    transformLevel(input: NL.DotNugg.Transformer.Level): NL.DotNugg.Encoder.uint8 {
        let val = input.direction == '+' ? input.offset : input.offset * -1;
        if (val == 100) {
            invariant(this.feature, 'TRANS:LEV:0');
            val = this.transformer.defaultLayerMap[this.feature];
        }
        invariant(val >= -4 && val <= 11, 'TRANS:LEV:1 - ' + val);
        return val + 4;
    }

    transformVersion(input: NL.DotNugg.Transformer.Version): NL.DotNugg.Encoder.Version {
        console.log('HERERERERE @22222:', input.receivers.length);
        return {
            anchor: this.transformer.transformCoordinate(input.anchor),
            expanders: this.transformer.transformRlud(input.expanders),
            groups: this.transformMatrix(input.data),
            len: { x: input.data.matrix[0].length, y: input.data.matrix.length },
            radii: this.transformer.transformRlud(input.radii),
            receivers: [
                ...this.transformer.transformReceivers(input.receivers),
                ...this.transformer.calculatedReceiversByFeature[this.feature],
            ],
        };
    }

    transformVersions(input: Dictionary<NL.DotNugg.Transformer.Version>): NL.DotNugg.Encoder.Version[] {
        return Object.values(input).map((x) => this.transformVersion(x));
    }
    transformPixels(input: Dictionary<NL.DotNugg.Transformer.Pixel>): NL.DotNugg.Encoder.Pixel[] {
        return Object.entries(input).map(([k, v], i) => {
            this.newColors[k] = i + 1;
            return this.transformPixel(v);
        });
    }

    transformPixel(input: NL.DotNugg.Transformer.Pixel): NL.DotNugg.Encoder.Pixel {
        return {
            rgba: this.transformer.rgba2hex(input.rgba),
            zindex: this.transformLevel(input.zindex),
        };
    }

    transformMatrix(input: NL.DotNugg.Transformer.Matrix): NL.DotNugg.Encoder.Group[] {
        let res: NL.DotNugg.Encoder.Group[] = [];
        console.log(this.newColors);
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
