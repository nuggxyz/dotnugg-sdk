import { BigNumber, BytesLike, ethers } from 'ethers';

import { Compiler as CompilerTypes } from '../types';

export class Builder {
    public static init(input: BigNumber[]) {}

    public static breakup(input: BigNumber): BigNumber[] {
        let len = ethers.utils.hexDataLength(input._hex);
        let res: BigNumber[] = [];
        while (len > 0) {
            res.push(BigNumber.from(ethers.utils.hexDataSlice(input._hex, len >= 32 ? len - 32 : 0, len)));

            len -= 32;
        }

        res = res.reverse();

        // const lenmask = BigNumber.from(res.length).shl(250);

        // if (res[0].gt(BigNumber.from(2).pow(250).sub(1))) {
        //     res.unshift(BigNumber.from(res.length + 1).shl(250));
        // } else {
        //     res[0] = res[0].or(lenmask);
        // }

        return res;
    }

    public static squish(input: BigNumber[]): BytesLike {
        let working: CompilerTypes.Byter[] = [];
        working.push({
            dat: input.length,
            bit: 8,
            nam: 'length',
        });

        let ptr = BigNumber.from(1);

        let beginres: BytesLike = ethers.utils.hexConcat(input.map((x) => x._hex));

        for (var i = 0; i < input.length; i++) {
            const len = ethers.utils.hexDataLength(input[i]._hex);
            working.push({ dat: ptr._hex, bit: 16, nam: 'pos' });

            ptr = ptr.add(len);
        }
        for (var i = 0; i < input.length; i++) {}

        let res: BytesLike = '';
        res += ethers.utils.hexZeroPad(ethers.utils.hexValue(working[0].dat), 1).replace('0x', '');

        for (var i = 1; i < working.length; i++) {
            res += ethers.utils.hexZeroPad(ethers.utils.hexValue(working[i].dat), 2).replace('0x', '');
        }

        // for (var i = 0; i < working.length; i++) {
        //     // console.log(working[i].dat);
        //     res += ethers.utils.hexValue(working[i].dat).replace('0x', '');
        // }
        res += beginres.replace('0x', '');

        // let len = ethers.utils.hexDataLength(input._hex);
        // let res: BigNumber[] = [];
        // while (len > 0) {
        //     res.push(BigNumber.from(ethers.utils.hexDataSlice(input._hex, len >= 32 ? len - 32 : 0, len)));

        //     len -= 32;
        // }

        // res = res.reverse();

        // const lenmask = BigNumber.from(res.length).shl(250);

        // if (res[0].gt(BigNumber.from(2).pow(250).sub(1))) {
        //     res.unshift(BigNumber.from(res.length + 1).shl(250));
        // } else {
        //     res[0] = res[0].or(lenmask);
        // }

        // console.log(res);

        return '0x600B5981380380925939F300' + '646F746E756767' + res;
    }

    // public static async build(address: string, input: BigNumber[][]): Promise<ethers.PopulatedTransaction> {
    //     const res = new ethers.Contract(address, IDotNuggHolder__factory.abi) as IDotNuggHolder;
    //     return await res.populateTransaction.dotNuggUpload(input, '');
    // }
}
