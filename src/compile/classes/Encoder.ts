/// <reference path="../../dec.d.ts" />

import { BigNumber, ethers } from 'ethers';
import invariant from 'tiny-invariant';

import { Encoder as EncoderTypes } from '../types/encoder';
import { Compiler as CompilerTypes } from '../types';

import { Transformer } from './Transformer';
import { Builder } from './Builder';

export class Encoder {
    output: EncoderTypes.EncoderOutput[] = [];

    static fileHeader: CompilerTypes.Byter = { dat: 0x4e554747, bit: 32, nam: 'nuggcheck' };

    constructor(transformer: Transformer) {
        const input = transformer.output;
        const res = input.items.map((x: any) => {
            const item = Encoder.encodeItem(x);
            return { ...item, hex: Builder.breakup(Encoder.strarr(item.bits)) };
        });
        this.output = res;
    }

    public static init() {}

    public static bitlen(input: CompilerTypes.Byter[]): number {
        return input.reduce((prev, curr) => {
            return prev + curr.bit;
        }, 0);
    }

    public static strarr(input: CompilerTypes.Byter[]): BigNumber {
        // console.log('----------------');
        return input.reverse().reduce((prev, curr) => {
            invariant(curr.dat < Math.pow(2, curr.bit) && curr.dat >= 0, 'ENCODE:STRARR:0 - ' + curr.dat + ' < ' + Math.pow(2, curr.bit));
            // if (curr.nam && !curr.nam.includes('MATRIX')) console.log(curr.nam, curr.bit, curr.dat);
            return prev.eq(0) ? (prev = BigNumber.from(curr.dat)) : prev.shl(curr.bit).or(curr.dat);
        }, BigNumber.from(0));
    }

    static encodeCoordinate(input: EncoderTypes.Coordinate): CompilerTypes.Byter[] {
        // uint12
        const x = input.x;
        const y = input.y;
        invariant(x < 64 && y < 64 && x >= 0 && y >= 0, 'ENCODE:EC:0');
        return [
            { dat: x, bit: 6, nam: 'coord x' },
            { dat: y, bit: 6, nam: 'coord y' },
        ];
    }

    static encodeRlud(input: EncoderTypes.Rlud): CompilerTypes.Byter[] {
        //uint1 | uint25
        if (input.exists) {
            invariant(0 <= input.r && input.r < 64, 'ENCODE:ER:0');
            invariant(0 <= input.l && input.l < 64, 'ENCODE:ER:1');
            invariant(0 <= input.u && input.u < 64, 'ENCODE:ER:2');
            invariant(0 <= input.d && input.d < 64, 'ENCODE:ER:3');
            return [
                {
                    dat: 0x0,
                    bit: 1,
                    nam: 'ruld all zero?',
                },
                {
                    dat: (input.r << 18) | (input.l << 12) | (input.u << 6) | input.d,
                    bit: 24,
                    nam: 'RLUD data',
                },
            ];
        } else {
            return [
                {
                    dat: 0x1,
                    bit: 1,
                    nam: 'ruld all zero?',
                },
            ];
        }
    }

    // feature = uint3
    // x = uint6
    // y = uint6
    static encodeReceiver(input: EncoderTypes.Receiver): CompilerTypes.Byter[] {
        let c = input.calculated ? 0x1 : 0x0;
        invariant(0 <= input.feature && input.feature < 8, 'ENCODE:REC:0 - ' + input.feature);
        invariant(0 <= input.xorZindex && input.xorZindex < 64, 'ENCODE:REC:2 - ' + input.xorZindex);
        invariant(0 <= input.yorYoffset && input.yorYoffset < 64, 'ENCODE:REC:3');
        return [
            {
                dat: input.yorYoffset,
                bit: 6,
                nam: 'yorYoffset',
            },
            {
                dat: input.xorZindex,
                bit: 6,
                nam: 'xorZindex',
            },
            {
                dat: input.feature,
                bit: 3,
                nam: 'feature',
            },
            {
                dat: c,
                bit: 1,
                nam: 'calculated?',
            },
        ];
    }

    static encodeReceivers(input: EncoderTypes.Receiver[]): CompilerTypes.Byter[] {
        //uint16[]
        return input.map((x) => this.encodeReceiver(x)).flat();
    }

    // static encodeMatrixPixelA(input: EncoderTypes.Group[]): CompilerTypes.Byter[] {
    //     return input
    //         .map((x) => {
    //             let res = [];
    //             x.len = x.len - 1;
    //             invariant(0 <= x.len && x.len < 256, 'ENCODE:EMP:2');

    //             if (x.len == 0) res.push({ dat: 0, bit: 3 });
    //             else if (x.len == 1) res.push({ dat: 1, bit: 3 });
    //             else if (x.len == 2) res.push({ dat: 2, bit: 3 });
    //             else if (x.len == 3) res.push({ dat: 3, bit: 3 });
    //             else if (x.len == 4) res.push({ dat: 4, bit: 3 });
    //             else if (x.len == 5) res.push({ dat: 5, bit: 3 });
    //             else if (x.len < 14)
    //                 res.push(
    //                     ...[
    //                         { dat: 6, bit: 3 },
    //                         { dat: x.len - 8, bit: 3 },
    //                     ],
    //                 );
    //             else if (x.len < 256)
    //                 res.push(
    //                     ...[
    //                         { dat: 7, bit: 3 },
    //                         { dat: x.len, bit: 8 },
    //                     ],
    //                 );
    //             else invariant(false, 'ENCODE:EMP:ERROR:SHOULDNOTHAPPEN');
    //             if (x.colorkey === undefined) x.colorkey = 0;
    //             else x.colorkey++;

    //             invariant(0 <= x.colorkey && x.colorkey < 16, 'ENCODE:EMP:CKs - ' + x.colorkey);

    //             res.push({ dat: x.colorkey, bit: 4 });
    //             return res;
    //         })
    //         .flat();
    // }

    static encodeMatrixPixelB(input: EncoderTypes.Group[]): CompilerTypes.Byter[][] {
        return input
            .map((x) => {
                let res: CompilerTypes.Byter[][] = [];
                x.len = x.len - 1;
                invariant(0 <= x.len && x.len < 19, 'ENCODE:EMP:2');

                if (x.len == 0) res.push([{ dat: 0, bit: 2, nam: 'MATRIX LEN' }]);
                else if (x.len == 1) res.push([{ dat: 1, bit: 2, nam: 'MATRIX LEN' }]);
                else if (x.len == 2) res.push([{ dat: 2, bit: 2, nam: 'MATRIX LEN' }]);
                else if (x.len < 19)
                    res.push([
                        { dat: 3, bit: 2, nam: 'MATRIX LEN' },
                        { dat: x.len - 3, bit: 4, nam: 'MATRIX LEN BIG' },
                    ]);
                else invariant(false, 'ENCODE:EMP:ERROR:SHOULDNOTHAPPEN');
                if (x.colorkey === undefined) x.colorkey = 0;

                invariant(0 <= x.colorkey && x.colorkey < 16, 'ENCODE:EMP:CKs');

                res.push([{ dat: x.colorkey, bit: 4, nam: 'MATRIX KEY' }]);
                return res;
            })
            .flat();
    }

    // static encodeMatrixPixelC(input: EncoderTypes.Group[]): CompilerTypes.Byter[] {
    //     return input
    //         .map((x) => {
    //             let res = [];
    //             x.len = x.len - 1;
    //             invariant(0 <= x.len && x.len < 19, 'ENCODE:EMP:2');

    //             if (x.len == 0) res.push({ dat: 0, bit: 2 });
    //             else if (x.len == 1) res.push({ dat: 1, bit: 2 });
    //             else if (x.len == 2) res.push({ dat: 2, bit: 2 });
    //             else if (x.len == 3) res.push({ dat: 3, bit: 2 });
    //             else invariant(false, 'ENCODE:EMP:ERROR:SHOULDNOTHAPPEN');
    //             if (x.colorkey === undefined) x.colorkey = 0;

    //             invariant(0 <= x.colorkey && x.colorkey < 16, 'ENCODE:EMP:CKs');

    //             res.push({ dat: x.colorkey, bit: 4 });
    //             return res;
    //         })
    //         .flat();
    // }

    public static encodeItem(input: EncoderTypes.Item): { feature: number; bits: CompilerTypes.Byter[] } {
        let res: CompilerTypes.Byter[] = [this.fileHeader]; // uint56

        res.push(this.encodeFeature(input.feature));

        invariant(0 < input.versions.length && input.versions.length <= 16, 'ENCODE:ITM:0');

        res.push({ dat: input.pixels.length - 1, bit: 4, nam: 'pallet len' }); // pallet length

        // res.push({ dat: input.versions.length - 1, bit: 2, nam: 'version len' });

        input.pixels.forEach((x) => {
            res.push(...this.encodePixel(x));
        });

        invariant(0 < input.versions.length && input.versions.length <= 4, 'ENCODE:ITM:1');

        res.push({ dat: input.versions.length - 1, bit: 2, nam: 'version len' }); // pallet length

        input.versions.forEach((x) => {
            res.push(...this.encodeVersion(x));
        });

        return { bits: res, feature: input.feature };
    }

    public static encodeFeature(input: number): CompilerTypes.Byter {
        invariant(0 <= input && input < 8, 'ENCODE:FEA:0');
        invariant(0 <= input && input < 8, 'ENCODE:FEA:1');
        return { dat: input, bit: 3 };
    }

    public static encodeVersion(input: EncoderTypes.Version): CompilerTypes.Byter[] {
        let res: CompilerTypes.Byter[] = [];

        res.push(...this.encodeCoordinate(input.len));
        res.push(...this.encodeCoordinate(input.anchor));
        res.push(...this.encodeRlud(input.radii));
        res.push(...this.encodeRlud(input.expanders));

        invariant(0 <= input.receivers.length && input.receivers.length < 16, 'ENCODE:VERS:0 - ' + input.receivers.length);
        if (input.receivers.length == 1) {
            res.push({ dat: 0x1, bit: 1, nam: 'receiver len == 1 ?' });
        } else {
            res.push({ dat: 0x0, bit: 1, nam: 'receiver len == 1 ?' });
            res.push({ dat: input.receivers.length, bit: 4, nam: 'receivers len' });
        }
        res.push(...this.encodeReceivers(input.receivers));

        const groups = this.encodeMatrixPixelB(input.groups);

        const realgrouplen = input.groups.length;
        invariant(0 < realgrouplen && realgrouplen <= 4096, 'ENCODE:VERS:1');
        if (realgrouplen <= 256) {
            res.push({ dat: 0x1, bit: 1, nam: 'group len <= 256 ? ' });
            res.push({ dat: realgrouplen - 1, bit: 8, nam: 'group len' });
        } else {
            res.push({ dat: 0x0, bit: 1, nam: 'group len <= 256 ?' });
            res.push({ dat: realgrouplen - 1, bit: 16, nam: 'group len' });
        }
        res.push(...groups.flat());

        return res;
    }

    public static encodeVersions(input: Dictionary<EncoderTypes.Version>): CompilerTypes.Byter[] {
        return Object.values(input)
            .map((x) => this.encodeVersion(x))
            .flat();
    }
    public static encodePixels(input: Dictionary<EncoderTypes.Pixel>): CompilerTypes.Byter[] {
        return Object.values(input)
            .map((x) => this.encodePixel(x))
            .flat();
    }

    public static encodePixel(input: EncoderTypes.Pixel): CompilerTypes.Byter[] {
        let res: CompilerTypes.Byter[] = [];
        res.push(this.encodeLayer(input.zindex));

        const color = this.encodeRGB(input.rgba.r, input.rgba.g, input.rgba.b);
        res.push(...color);

        res.push(...this.encodeA(input.rgba.a));

        return res;
    }

    public static encodeA(input: number): CompilerTypes.Byter[] {
        //    uint1 | uint9

        invariant(!Number.isNaN(input), 'ENCODE:A:NAN');
        if (input == 255) return [{ dat: 0x1, bit: 1, nam: 'is A 255 ? ' }];
        return [
            { dat: 0x0, bit: 1, nam: 'is A 255 ? ' },
            { dat: input, bit: 8, nam: 'A' },
        ];
    }

    public static encodeRGB(r: number, g: number, b: number): CompilerTypes.Byter[] {
        // uint1 | uint25
        if (r === 0 && g === 0 && b === 0) return [{ dat: 0x1, bit: 1, nam: 'is RBG black ?' }];
        invariant(0 <= r && r < 256, 'ENCODE:ER:R');
        invariant(0 <= g && g < 256, 'ENCODE:ER:G');
        invariant(0 <= b && b < 256, 'ENCODE:ER:B');
        return [
            { dat: 0x0, bit: 1, nam: 'is RGB black ?' },
            { dat: r, bit: 8, nam: 'R' },
            { dat: g, bit: 8, nam: 'G' },
            { dat: b, bit: 8, nam: 'B' },
            // { dat: (r << 16) | (g << 8) | b, bit: 24, nam: 'non black rgb' },
        ];
    }

    public static encodeLayer(input: number): CompilerTypes.Byter {
        //uint8
        invariant(0 <= input && input < 15, 'ENCODE:LAYER:0');
        return { bit: 4, dat: input + 1, nam: 'layer' };
    }

    // public static encodeMatrix(input: EncoderTypes.Matrix): CompilerTypes.Byter[] {}
}
