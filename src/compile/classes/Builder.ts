import { BigNumber, ethers } from 'ethers';

export class Builder {
    public static init(input: BigNumber[]) {}

    public static breakup(input: BigNumber): BigNumber[] {
        let len = ethers.utils.hexDataLength(input._hex);
        let res = [];
        while (len > 0) {
            res.push(BigNumber.from(ethers.utils.hexDataSlice(input._hex, len >= 32 ? len - 32 : 0, len)));

            len -= 32;
        }
        res = res.reverse();

        return res;
    }

    // public static async build(address: string, input: BigNumber[][]): Promise<ethers.PopulatedTransaction> {
    //     const res = new ethers.Contract(address, IDotNuggHolder__factory.abi) as IDotNuggHolder;
    //     return await res.populateTransaction.dotNuggUpload(input, '');
    // }
}
