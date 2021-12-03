import { BigNumber, ethers } from 'ethers';
import invariant from 'tiny-invariant';

import { Transformer } from './Transformer';

export class Encoder {
    main: Uint8Array;

    static output: Byter[][] = [];

    static fileHeader: Byter = { dat: '4e554747', bit: 32 };

    public static init() {
        const input = Transformer.output;

        this.output = input.items.map((x) => this.encodeItem(x));
    }

    static encodeCoordinate(input: NL.DotNugg.Encoder.Coordinate): Byter {
        // uint12
        const x = input.x;
        const y = input.y;
        invariant(x < 64 && y < 64 && x >= 0 && y >= 0, 'ENCODE:EC:0');
        return { dat: (x << 6) | y, bit: 12 };
    }

    static encodeRlud(input: NL.DotNugg.Encoder.Rlud): Byter {
        //uint1 | uint25
        if (input.exists) {
            invariant(0 <= input.r && input.r < 64, 'ENCODE:ER:0');
            invariant(0 <= input.l && input.l < 64, 'ENCODE:ER:1');
            invariant(0 <= input.u && input.u < 64, 'ENCODE:ER:2');
            invariant(0 <= input.d && input.d < 64, 'ENCODE:ER:3');
            return {
                dat: (1 << 24) | (input.r << 18) | (input.l << 12) | (input.u << 6) | input.d,
                bit: 25,
            };
        } else {
            return {
                dat: 0x0,
                bit: 1,
            };
        }
    }
    // ┌────────────────────────────────────────────────────────────┐
    // │                                                            │
    // │             ______              _                          │
    // │             | ___ \            (_)                         │
    // │             | |_/ /___  ___ ___ ___   _____ _ __           │
    // │             |    // _ \/ __/ _ \ \ \ / / _ \ '__|          │
    // │             | |\ \  __/ (_|  __/ |\ V /  __/ |             │
    // │             \_| \_\___|\___\___|_| \_/ \___|_|             │
    // │                                                            │
    // │                                                            │
    // │  ┌─────┬────────────────────────────────────────────────┐  │
    // │  │  0  │  preset | x (uint4) & yoffset | y (int4)       │  │
    // │  ├─────┼────────────────────────────────────────────────┤  │
    // │  │  1  │  type (1 byte)                                 │  │
    // │  └─────┴────────────────────────────────────────────────┘  │
    // │                                                            │
    // └────────────────────────────────────────────────────────────┘
    //     // type = uint1

    // feature = uint3
    // x = uint6
    // y = uint6
    static encodeReceiver(input: NL.DotNugg.Encoder.Receiver): Byter {
        let c = input.calculated ? 0x1 : 0x0;
        invariant(0 <= input.feature && input.feature < 8, 'ENCODE:ER:0');
        invariant(0 <= input.xorZindex && input.xorZindex < 64, 'ENCODE:ER:2');
        invariant(0 <= input.yorYoffset && input.yorYoffset < 64, 'ENCODE:ER:3');
        return { dat: (c << 15) | (input.feature << 3) | (input.xorZindex << 6) | (input.yorYoffset << 0), bit: 16 };
    }

    static encodeReceivers(input: NL.DotNugg.Encoder.Receiver[]): Byter[] {
        //uint16[]
        return input.map((x) => this.encodeReceiver(x));
    }

    static encodeMatrixPixel(input: NL.DotNugg.Encoder.Group[]): Byter[] {
        // /uint4[]\

        input.map((x) => {
            invariant(0 <= x && x < 16, 'ENCODE:EMP:2');

            +x.label;
        });
    }
    // ┌───────────────────────────────────────────────────────────────────┐
    // │                                                                   │
    // │                     _____ _                                       │
    // │                    |_   _| |                                      │
    // │                      | | | |_ ___ _ __ ___                        │
    // │                      | | | __/ _ \ '_ ` _ \                       │
    // │                     _| |_| ||  __/ | | | | |                      │
    // │                     \___/ \__\___|_| |_| |_|                      │
    // │                                                                   │
    // │                                                                   │
    // │     ┌─────┬────────────────────────────────────────────────┐      │
    // │     │ 0-6 │  "DOTNUGG" (7 bytes in ascii)                  │      │
    // │     ├─────┼────────────────────────────────────────────────┤      │
    // │     │ 7-8 │  checksum - (2 bytes)                          │      │
    // │     ├─────┼────────────────────────────────────────────────┤      │
    // │     │  9  │  feature key - (1 byte)                        │      │
    // │     ├─────┼────────────────────────────────────────────────┤      │
    // │     │10-11│  colors array index from 0 (uint16)            │      │
    // │     ├─────┼────────────────────────────────────────────────┤      │
    // │     │12-* │  version index array - ([*][2]byte)            │      │
    // │     ├─────┼────────────────────────────────────────────────┤      │
    // │     │ *-* │  color array - ([*][6]byte)                    │      │
    // │     ├─────┼────────────────────────────────────────────────┤      │
    // │     │ *-* │  version array ([*][*]byte)                    │      │
    // │     └─────┴────────────────────────────────────────────────┘      │
    // │                                                                   │
    // │                                                                   │
    // └───────────────────────────────────────────────────────────────────┘

    public static encodeItem(input: NL.DotNugg.Encoder.Item): Byter[] {
        let res: Byter[] = [this.fileHeader]; // uint56

        res.push(this.encodeFeature(input.feature));

        input.pixels.forEach((x) => {});

        input.versions.forEach((x) => {
            res.push(...this.encodeVersion(x));
        });

        return res;
    }

    public static encodeFeature(input: number): Byter {
        invariant(0 <= input && input < 8, 'ENCODE:ER:2');
        invariant(0 <= input && input < 8, 'ENCODE:ER:2');
        return { dat: input, bit: 4 };
    }

    public static encodeVersion(input: NL.DotNugg.Encoder.Version): Byter[] {
        let res: Byter[] = [];

        res.push(this.encodeCoordinate(input.len));
        res.push(this.encodeCoordinate(input.anchor));
        res.push(this.encodeRlud(input.radii));
        res.push(this.encodeRlud(input.expanders));
        res.push(...this.encodeReceivers(input.receivers));
        res.push(...this.encodeMatrixPixel(input.groups));
        return res;
    }

    public static encodeVersions(input: Dictionary<NL.DotNugg.Encoder.Version>): Byter[] {
        return Object.values(input)
            .map((x) => this.encodeVersion(x))
            .flat();
    }
    public static encodePixels(input: Dictionary<NL.DotNugg.Encoder.Pixel>): Byter[] {
        return Object.values(input)
            .map((x) => this.encodePixel(x))
            .flat();
    }

    public static encodePixel(input: NL.DotNugg.Encoder.Pixel): Byter[] {
        //    uint1 | uint9
        let res: Byter[] = [];
        res.push(this.encodeLayer(input.zindex));
        res.push(this.encodeRGB(input.rgba.r, input.rgba.g, input.rgba.b));
        res.push(this.encodeA(input.rgba.a));

        return res;
    }

    public static encodeA(input: number): Byter {
        //    uint1 | uint9
        if (input == 255) return { dat: 0x1, bit: 1 };
        return { dat: (1 << 8) | input, bit: 9 };
    }

    public static encodeRGB(r: number, g: number, b: number): Byter {
        // uint1 | uint25
        if (r === 0 && g === 0 && b === 0) return { dat: 0x1, bit: 1 };
        invariant(0 <= r && r < 256, 'ENCODE:ER:R');
        invariant(0 <= g && g < 256, 'ENCODE:ER:G');
        invariant(0 <= b && b < 256, 'ENCODE:ER:B');
        return { dat: (r << 16) | (r << 8) | b, bit: 25 };
    }

    public static encodeLayer(input: number): Byter {
        //uint8
        invariant(0 <= input && input < 16, 'ENCODE:LAYER:0');
        return { bit: 4, dat: input };
    }

    public static encodeMatrix(input: NL.DotNugg.Encoder.Matrix): Byter[] {}
}
