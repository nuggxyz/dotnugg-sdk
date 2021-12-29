import { BigNumber, ethers } from 'ethers';

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

    public static decompressA(a: BigNumber): BigNumber {
        if (a.eq(7)) return BigNumber.from(255);
        else return a.mul(36);
    }

    public static drawConsole(input: ethers.BigNumber[]) {
        // console.log({ decode });
        // console.log(decode);

        const usethis: BigNumber[] = [];

        // for (var i = 0; i < input.length; i++) {
        //     console.log(input[i]._hex);
        //     if (input[i].and(0xf).eq(0xf)) {
        //         let numzeros = input[i].shr(4).toNumber();
        //         for (var j = 0; j < numzeros; j++) {
        //             usethis.push(BigNumber.from(0));
        //         }
        //     } else {
        //         usethis.push(input[i].shr(4));
        //     }

        //     console.log(usethis[usethis.length - 1]._hex);

        //     console.log('--');
        // }
        let zerosSaved = 0;
        let byteLen = 0;

        for (var i = 0; i < input.length; i++) {
            // console.log(input[i]._hex);

            byteLen += input[i]._hex.length;

            let numzeros = input[i].and(0xf);

            if (numzeros.eq(0xf)) {
                numzeros = input[i++].shr(4);
            }

            for (var j = 0; j < numzeros.toNumber(); j++) {
                usethis.push(BigNumber.from(0));
            }

            usethis.push(input[i].shr(4));

            // console.log(usethis[usethis.length - 1]._hex);

            // console.log('--');
            zerosSaved += numzeros.toNumber();
        }

        console.log(input.length, zerosSaved, byteLen / 2);

        const tmp = usethis[usethis.length - 1];
        const tmp2 = usethis[usethis.length - 1];
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
                const pix = usethis[Math.floor(index / 6)].shr(42 * (index % 6));
                const a = this.decompressA(pix.and(0x7));
                const rgb_ = pix.shl(5).and(0xffffff00);
                const color = rgb_.or(a)._hex;
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

        const pix = arr[Math.floor(index / 6)].shr(42 * (index % 6));
        const a = this.decompressA(pix.and(0x7));
        const rgb_ = pix.shl(5).and(0xffffff00);
        const color = rgb_.or(a)._hex;

        const val = arr[Math.floor(index / 6)].shr(42 * (index % 6)).and('0xffffffffff');
        const color2 = ethers.utils.hexZeroPad(color, 4).replace('0x', '#');
        return {
            color: color2 === '#00000000' ? 'nope' : color2,
            id: val.shr(27).and('0xff').toNumber(),
            z: val.shr(35).and('0xf').toNumber(),
            feature: val.shr(39).and('0x7').toNumber(),
        };
    };

    public static drawSvg(_input: ethers.BigNumber[], multip: number, prettyPrint: boolean = false): string {
        const usethis: BigNumber[] = [];

        for (var i = 0; i < _input.length; i++) {
            console.log(_input[i]._hex);

            // byteLen += _input[i]._hex.length;

            let numzeros = _input[i].and(0xf);

            if (numzeros.eq(0xf)) {
                numzeros = _input[i++].shr(4);
            }

            for (var j = 0; j < numzeros.toNumber(); j++) {
                usethis.push(BigNumber.from(0));
            }

            usethis.push(_input[i].shr(4));

            // console.log(usethis[usethis.length - 1]._hex);

            // console.log('--');
            // zerosSaved += numzeros.toNumber();
        }
        const tmp = usethis[usethis.length - 1];
        const tmp2 = usethis[usethis.length - 1];
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

        let last = this.getPixelAt(usethis, 0, 0, width);
        let count = 1;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < height; x++) {
                if (y == 0 && x == 0) x++;
                let curr = this.getPixelAt(usethis, x, y, width);
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
            last = { color: 'nope', z: 0, feature: 0, id: 0 };
            count = 0;
        }
        console.log(res + '</svg>');
        return res + '</svg>';
    }
}
