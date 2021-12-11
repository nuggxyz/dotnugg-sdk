import { ethers } from 'ethers';

import * as constants from './constants/console';

export class Console {
    private static CreateNumberedRow(num: number): string {
        let res = '   ';
        for (let i = 0; i < num; i++) {
            res += (i % 10).toString() + ' ';
        }
        return res;
    }

    public static drawOutput(input: ethers.BytesLike) {
        const decode = (new ethers.utils.AbiCoder().decode(['uint[]'], input) as ethers.BigNumber[][])[0];

        // console.log({ decode });
        // console.log(decode);

        const tmp = decode[decode.length - 1];
        const tmp2 = decode[decode.length - 1];
        const width = tmp.shr(63).and(0x3f).toNumber();
        const height = tmp2.shr(69).and(0x3f).toNumber();

        // console.log(width, height, decode[decode.length - 1], tmp, tmp2);

        const res: string[] = [];
        res.push(Console.CreateNumberedRow(width));
        let index = 0;
        const mapper: { [_: string]: string } = {};
        for (let y = 0; y < height; y++) {
            let tmp = '';
            for (let x = 0; x < width; x++) {
                const color = decode[Math.floor(index / 6)].shr(40 * (index % 6)).and('0xffffffff')._hex;
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
}
