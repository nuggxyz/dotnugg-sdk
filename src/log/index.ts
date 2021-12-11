import { ethers } from 'ethers';

import { dotnugg } from '..';

import * as constants from './constants/console';

export class Console {
    private static CreateNumberedRow(num: number): string {
        let res = '   ';
        for (let i = 0; i < num; i++) {
            res += (i % 10).toString() + ' ';
        }
        return res;
    }

    public static drawOutputFromBytes(input: ethers.BytesLike) {
        const decode = (new ethers.utils.AbiCoder().decode(['uint[]'], input) as ethers.BigNumber[][])[0];
        return this.drawConsole(decode);
    }

    public static drawConsole(input: ethers.BigNumber[]) {
        // console.log({ decode });
        // console.log(decode);

        const tmp = input[input.length - 1];
        const tmp2 = input[input.length - 1];
        const width = tmp.shr(63).and(0x3f).toNumber();
        const height = tmp2.shr(69).and(0x3f).toNumber();

        // console.log(width, height, input[input.length - 1], tmp, tmp2);

        const res: string[] = [];
        res.push(Console.CreateNumberedRow(width));
        let index = 0;
        const mapper: { [_: string]: string } = {};
        for (let y = 0; y < height; y++) {
            let tmp = '';
            for (let x = 0; x < width; x++) {
                const color = input[Math.floor(index / 6)].shr(40 * (index % 6)).and('0xffffffff')._hex;
                if (!mapper[color]) mapper[color] = constants.colorLookup[Object.keys(mapper).length];
                tmp += mapper[color] + mapper[color];
                index++;
                if (x + 1 < width) {
                    tmp += '';
                }
                //add the color to the map if
            }
            res.push(y.toString().padEnd(2) + ' ' + tmp + ' ' + y.toString().padStart(2));
        }
        res.push(this.CreateNumberedRow(width));

        res.forEach((x) => {
            console.log(x);
        });
        console.log('----------');
        Object.entries(mapper).map(([k, v]) => {
            console.log(v, '|', ethers.utils.hexZeroPad(k, 4));
        });

        console.log('----------');
        return res;
    }

    private static getPixelAt = (arr: ethers.BigNumber[], x: number, y: number, width: number): dotnugg.types.log.Pixel => {
        const index = x + y * width;
        const val = arr[Math.floor(index / 6)].shr(40 * (index % 6)).and('0xffffffffff');
        const color = ethers.utils.hexZeroPad(val.and('0xffffffff')._hex, 4).replace('0x', '#');
        return {
            color: color === '#00000000' ? 'nope' : color,
            z: val.shr(32).and('0xf').toNumber(),
            feature: val.shr(36).and('0xf').toNumber(),
        };
    };

    public static drawSvg(input: ethers.BigNumber[], multip: number, prettyPrint: boolean = false): string {
        const tmp = input[input.length - 1];
        const tmp2 = input[input.length - 1];
        const width = tmp.shr(63).and(0x3f).toNumber();
        const height = tmp2.shr(69).and(0x3f).toNumber();
        let res = '';

        res += String(
            "<svg viewBox='0 0 " +
                width * multip +
                ' ' +
                width * multip +
                "' width='" +
                width * multip +
                "' height='" +
                width * multip +
                "' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>" +
                (prettyPrint ? '\n' : ''),
        );

        const getRekt = (pix: dotnugg.types.log.Pixel, x: number, y: number, xlen: number, ylen: number): string => {
            if (pix.color === 'nope') return '';
            return String(
                (prettyPrint ? '\t' : '') +
                    "<rect fill='" +
                    pix.color +
                    "' x='" +
                    x * multip +
                    "' y='" +
                    y * multip +
                    "' width='" +
                    xlen * multip +
                    "' height='" +
                    ylen * multip +
                    "'/>" +
                    (prettyPrint ? '\n' : ''),
            );
        };

        // bytes memory footer = hex'3c2f7376673e';

        let last = this.getPixelAt(input, 0, 0, width);
        let count = 1;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < height; x++) {
                if (y == 0 && x == 0) x++;
                let curr = this.getPixelAt(input, x, y, width);
                if (curr.color === last.color) {
                    count++;
                    continue;
                } else {
                    // curr.log('yup');
                    // rects[index++] = getRekt(last, x - count, y, count, 1);
                    res += getRekt(last, x - count, y, count, 1);
                    last = curr;
                    count = 1;
                }
            }
            res += getRekt(last, width - count, y, count, 1);
            last = { color: 'nope', z: 0, feature: 0 };
            count = 0;
        }
        console.log(res + '</svg>');
        return res + '</svg>';
    }
}
