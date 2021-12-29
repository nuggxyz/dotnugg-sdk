import { BigNumber, ethers } from 'ethers';

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

    // public static async build(address: string, input: BigNumber[][]): Promise<ethers.PopulatedTransaction> {
    //     const res = new ethers.Contract(address, IDotNuggHolder__factory.abi) as IDotNuggHolder;
    //     return await res.populateTransaction.dotNuggUpload(input, '');
    // }
}
