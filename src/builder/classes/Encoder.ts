import { BigNumber, BigNumberish, BytesLike, ethers, Overrides, PopulatedTransaction, utils } from 'ethers';

import * as EncoderTypes from '../types/EncoderTypes';
import * as BuilderTypes from '../types/BuilderTypes';
import constants from '../constants';
import { dotnugg } from '../..';

interface func {
    unsafeStoreFilesBulk(
        data: BigNumberish[][][],
        overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;
}

export class Encoder {
    static fileHeader: EncoderTypes.Byter = { dat: 0x420690_01, bit: 32, nam: 'nuggcheck' };

    public static init() {}

    public static bitlen(input: EncoderTypes.Byter[]): number {
        return input.reduce((prev, curr) => {
            return prev + curr.bit;
        }, 0);
    }

    public static strarr(input: EncoderTypes.Byter[]): BigNumber {
        // console.log('----------------');
        return [...input].reverse().reduce((prev, curr) => {
            dotnugg.utils.invariantVerbose(
                curr.dat < Math.pow(2, curr.bit) && curr.dat >= 0,
                'ENCODE:STRARR:0 - ' + curr.dat + ' < ' + Math.pow(2, curr.bit),
            );
            // if (curr.nam && !curr.nam.includes('MATRIX')) console.log(curr.nam, curr.bit, curr.dat);
            return prev.eq(0) ? (prev = BigNumber.from(curr.dat)) : prev.shl(curr.bit).or(curr.dat);
        }, BigNumber.from(0));
    }

    static encodeCoordinate(input: EncoderTypes.Coordinate): EncoderTypes.Byter[] {
        // uint12
        const x = input.x;
        const y = input.y;
        dotnugg.utils.invariantVerbose(x <= constants.WIDTH && y <= constants.WIDTH && x >= 0 && y >= 0, 'ENCODE:EC:0');
        return [
            { dat: x, bit: constants.BITLEN, nam: 'coord x' },
            { dat: y, bit: constants.BITLEN, nam: 'coord y' },
        ];
    }

    static encodeRlud(input: EncoderTypes.Rlud): EncoderTypes.Byter[] {
        //uint1 | uint25
        if (input.exists) {
            dotnugg.utils.invariantVerbose(0 <= input.r && input.r < constants.WIDTH, 'ENCODE:ER:0');
            dotnugg.utils.invariantVerbose(0 <= input.l && input.l < constants.WIDTH, 'ENCODE:ER:1');
            dotnugg.utils.invariantVerbose(0 <= input.u && input.u < constants.WIDTH, 'ENCODE:ER:2');
            dotnugg.utils.invariantVerbose(0 <= input.d && input.d < constants.WIDTH, 'ENCODE:ER:3');
            return [
                {
                    dat: 0x0,
                    bit: 1,
                    nam: 'ruld all zero?',
                },
                {
                    dat: (input.r << constants.BITLENx3) | (input.l << constants.BITLENx2) | (input.u << constants.BITLEN) | input.d,
                    bit: constants.BITLENx4,
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
    static encodeReceiver(input: EncoderTypes.Receiver): EncoderTypes.Byter[] {
        let c = input.calculated ? 0x1 : 0x0;
        dotnugg.utils.invariantVerbose(0 <= input.feature && input.feature < 8, 'ENCODE:REC:0 - ' + input.feature);
        dotnugg.utils.invariantVerbose(0 <= input.xorZindex && input.xorZindex <= constants.WIDTH, 'ENCODE:REC:2 - ' + input.xorZindex);
        dotnugg.utils.invariantVerbose(0 <= input.yorYoffset && input.yorYoffset <= constants.WIDTH, 'ENCODE:REC:3');
        return [
            {
                dat: input.yorYoffset,
                bit: constants.BITLEN,
                nam: 'yorYoffset',
            },
            {
                dat: input.xorZindex,
                bit: constants.BITLEN,
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

    static encodeReceivers(input: EncoderTypes.Receiver[]): EncoderTypes.Byter[] {
        //uint16[]
        return input.map((x) => this.encodeReceiver(x)).flat();
    }

    // static encodeMatrixPixelA(input: EncoderTypes.Group[]): EncoderTypes.Byter[] {
    //     return input
    //         .map((x) => {
    //             let res = [];
    //             x.len = x.len - 1;
    //             dotnugg.utils.invariantVerbose(0 <= x.len && x.len < 256, 'ENCODE:EMP:2');

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
    //             else dotnugg.utils.invariantVerbose(false, 'ENCODE:EMP:ERROR:SHOULDNOTHAPPEN');
    //             if (x.colorkey === undefined) x.colorkey = 0;
    //             else x.colorkey++;

    //             dotnugg.utils.invariantVerbose(0 <= x.colorkey && x.colorkey < 16, 'ENCODE:EMP:CKs - ' + x.colorkey);

    //             res.push({ dat: x.colorkey, bit: 4 });
    //             return res;
    //         })
    //         .flat();
    // }

    static encodeMatrixPixelB(input: EncoderTypes.Group[], palletLen: number, pixBitLen: 4 | 8): EncoderTypes.Byter[][] {
        return input
            .map((x) => {
                let res: EncoderTypes.Byter[][] = [];
                x.len = x.len - 1;
                dotnugg.utils.invariantVerbose(0 <= x.len && x.len < 19, 'ENCODE:EMP:2');

                if (x.len == 0) res.push([{ dat: 0, bit: 2, nam: 'MATRIX LEN' }]);
                else if (x.len == 1) res.push([{ dat: 1, bit: 2, nam: 'MATRIX LEN' }]);
                else if (x.len == 2) res.push([{ dat: 2, bit: 2, nam: 'MATRIX LEN' }]);
                else if (x.len < 19)
                    res.push([
                        { dat: 3, bit: 2, nam: 'MATRIX LEN' },
                        { dat: x.len - 3, bit: 4, nam: 'MATRIX LEN BIG' },
                    ]);
                else dotnugg.utils.invariantVerbose(false, 'ENCODE:EMP:ERROR:SHOULDNOTHAPPEN');
                if (x.colorkey === undefined) x.colorkey = 0;

                dotnugg.utils.invariantVerbose(0 <= x.colorkey && x.colorkey <= palletLen, 'ENCODE:EMP:CKs' + x.colorkey + ' ' + palletLen);

                res.push([{ dat: x.colorkey, bit: pixBitLen, nam: 'MATRIX KEY' }]);
                return res;
            })
            .flat();
    }

    // static encodeMatrixPixelC(input: EncoderTypes.Group[]): EncoderTypes.Byter[] {
    //     return input
    //         .map((x) => {
    //             let res = [];
    //             x.len = x.len - 1;
    //             dotnugg.utils.invariantVerbose(0 <= x.len && x.len < 19, 'ENCODE:EMP:2');

    //             if (x.len == 0) res.push({ dat: 0, bit: 2 });
    //             else if (x.len == 1) res.push({ dat: 1, bit: 2 });
    //             else if (x.len == 2) res.push({ dat: 2, bit: 2 });
    //             else if (x.len == 3) res.push({ dat: 3, bit: 2 });
    //             else dotnugg.utils.invariantVerbose(false, 'ENCODE:EMP:ERROR:SHOULDNOTHAPPEN');
    //             if (x.colorkey === undefined) x.colorkey = 0;

    //             dotnugg.utils.invariantVerbose(0 <= x.colorkey && x.colorkey < 16, 'ENCODE:EMP:CKs');

    //             res.push({ dat: x.colorkey, bit: 4 });
    //             return res;
    //         })
    //         .flat();
    // }

    public static encodeItem(input: EncoderTypes.Item): EncoderTypes.Output {
        let res: EncoderTypes.Byter[] = [this.fileHeader]; // uint56

        res.push(this.encodeFeature(input.feature));

        res.push(this.encodeFeatureId(input.id));

        dotnugg.utils.invariantVerbose(0 < input.versions.length && input.versions.length <= 16, 'ENCODE:ITM:0');
        dotnugg.utils.invariantVerbose(input.pixels.length < 256, 'ENCODE:PIXEL:0');

        let pixBitLen: 4 | 8;
        // res.push({ dat: input.versions.length - 1, bit: 2, nam: 'version len' });
        if (input.pixels.length >= 16) {
            pixBitLen = 8;
            res.push({ dat: 0x1, bit: 1, nam: 'pallet size category' });
        } else {
            pixBitLen = 4;
            res.push({ dat: 0x0, bit: 1, nam: 'pallet size category' });
        }
        res.push({ dat: input.pixels.length - 1, bit: pixBitLen, nam: 'pallet len' }); // pallet length

        input.pixels.forEach((x) => {
            res.push(...this.encodePixel(x));
        });

        res.push(this.encodeGraftable(input.graftable));

        dotnugg.utils.invariantVerbose(0 < input.versions.length && input.versions.length <= 4, 'ENCODE:ITM:1');

        res.push({ dat: input.versions.length - 1, bit: 2, nam: 'version len' }); // pallet length

        input.versions.forEach((x) => {
            res.push(...this.encodeVersion(x, input.pixels.length, pixBitLen));
        });

        return {
            bits: res,
            feature: input.feature,
            fileName: input.fileName,
            id: input.id,
            mtimeMs: input.mtimeMs,
            fileUri: input.fileUri,
            ...input,
        };
    }

    public static encodeFeature(input: number): EncoderTypes.Byter {
        dotnugg.utils.invariantVerbose(0 <= input && input < 8, 'ENCODE:FEA:0');
        return { dat: input, bit: 3 };
    }

    public static encodeFeatureId(input: number): EncoderTypes.Byter {
        dotnugg.utils.invariantVerbose(0 <= input && input < 255, 'ENCODE:FEATID:0');
        return { dat: input + 1, bit: 8 };
    }

    public static encodeGraftable(bool: boolean): EncoderTypes.Byter {
        return { dat: bool ? 0x01 : 0x00, bit: 1, nam: 'graftable' };
    }

    public static encodeVersion(input: EncoderTypes.Version, palletLen: number, pixBitLen: 4 | 8): EncoderTypes.Byter[] {
        let res: EncoderTypes.Byter[] = [];

        res.push(...this.encodeCoordinate(input.len));
        res.push(...this.encodeCoordinate(input.anchor));
        res.push(...this.encodeRlud(input.radii));
        res.push(...this.encodeRlud(input.expanders));

        dotnugg.utils.invariantVerbose(
            0 <= input.receivers.length && input.receivers.length < 16,
            'ENCODE:VERS:0 - ' + input.receivers.length,
        );
        if (input.receivers.length == 1) {
            res.push({ dat: 0x1, bit: 1, nam: 'receiver len == 1 ?' });
        } else {
            res.push({ dat: 0x0, bit: 1, nam: 'receiver len == 1 ?' });
            res.push({ dat: input.receivers.length, bit: 4, nam: 'receivers len' });
        }
        res.push(...this.encodeReceivers(input.receivers));

        const groups = this.encodeMatrixPixelB(input.groups, palletLen, pixBitLen);

        const realgrouplen = input.groups.length;
        dotnugg.utils.invariantVerbose(0 < realgrouplen && realgrouplen <= Math.pow(2, 16), 'ENCODE:VERS:1 - ' + realgrouplen);
        if (realgrouplen <= 256) {
            res.push({ dat: 0x1, bit: 1, nam: 'group len <= 256 ? ' });
            res.push({ dat: realgrouplen - 1, bit: 8, nam: 'group len' });
        } else {
            // TODO
            res.push({ dat: 0x0, bit: 1, nam: 'group len <= 256 ?' });
            res.push({ dat: realgrouplen - 1, bit: 16, nam: 'group len' });
        }
        res.push(...groups.flat());

        return res;
    }

    public static encodeVersions(input: BuilderTypes.Dictionary<EncoderTypes.Version>): EncoderTypes.Byter[] {
        return Object.values(input)
            .map((x) => this.encodeVersion(x, 16, 4))
            .flat();
    }
    public static encodePixels(input: BuilderTypes.Dictionary<EncoderTypes.Pixel>): EncoderTypes.Byter[] {
        return Object.values(input)
            .map((x) => this.encodePixel(x))
            .flat();
    }

    public static encodePixel(input: EncoderTypes.Pixel): EncoderTypes.Byter[] {
        let res: EncoderTypes.Byter[] = [];

        const z = this.encodeLayer(input.zindex);

        res.push(z);

        res.push(...this.encodeGraft(input.graftPalletIndex));

        const color = this.encodeRGB(input.rgba.r, input.rgba.g, input.rgba.b);
        res.push(...color);

        res.push(...this.encodeA(input.rgba.a));

        return res;
    }

    public static encodeGraft(input: number | null): EncoderTypes.Byter[] {
        if (input === null) return [{ dat: 0x0, bit: 1, nam: 'is graft ?' }];

        dotnugg.utils.invariantVerbose(!Number.isNaN(input) && !!input, 'encodeGraft:NAN');

        dotnugg.utils.invariantVerbose(input <= 16, 'encodeGraft: graftPalletIndex too big');

        return [
            { dat: 0x1, bit: 1, nam: 'is graft ?' },
            { dat: input, bit: 4, nam: 'graftPalletIndex ' },
        ];
    }

    public static encodeA(input: number): EncoderTypes.Byter[] {
        //    uint1 | uint9

        dotnugg.utils.invariantVerbose(!Number.isNaN(input), 'ENCODE:A:NAN');
        if (input == 255) return [{ dat: 0x1, bit: 1, nam: 'is A 255 ? ' }];
        return [
            { dat: 0x0, bit: 1, nam: 'is A 255 ? ' },
            { dat: input, bit: 8, nam: 'A' },
        ];
    }

    public static encodeRGB(r: number, g: number, b: number): EncoderTypes.Byter[] {
        // uint1 | uint25
        if (r === 0 && g === 0 && b === 0)
            return [
                { dat: 0x1, bit: 1, nam: 'is RBG black ?' },
                { dat: 0x0, bit: 1, nam: 'is RBG white ?' },
            ];
        if (r === 255 && g === 255 && b === 255)
            return [
                { dat: 0x0, bit: 1, nam: 'is RBG black ?' },
                { dat: 0x1, bit: 1, nam: 'is RBG white ?' },
            ];

        dotnugg.utils.invariantVerbose(0 <= r && r < 256, 'ENCODE:ER:R');
        dotnugg.utils.invariantVerbose(0 <= g && g < 256, 'ENCODE:ER:G');
        dotnugg.utils.invariantVerbose(0 <= b && b < 256, 'ENCODE:ER:B');
        return [
            { dat: 0x0, bit: 1, nam: 'is RGB black ?' },
            { dat: 0x0, bit: 1, nam: 'is RGB white ?' },
            { dat: b, bit: 8, nam: 'B' },
            { dat: g, bit: 8, nam: 'G' },
            { dat: r, bit: 8, nam: 'R' },
            // { dat: (r << 16) | (g << 8) | b, bit: 24, nam: 'non black rgb' },
        ];
    }

    public static encodeLayer(input: number): EncoderTypes.Byter {
        //uint8
        dotnugg.utils.invariantVerbose(0 <= input && input < 15, 'ENCODE:LAYER:0');
        return { bit: 4, dat: input, nam: 'layer' };
    }

    // public static encodeMatrix(input: EncoderTypes.Matrix): EncoderTypes.Byter[] {}
}
