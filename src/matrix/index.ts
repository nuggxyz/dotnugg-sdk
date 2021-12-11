import { BigNumber } from '@ethersproject/bignumber';

import { dotnugg } from '..';

export class Matrix {
    public mockItems(
        items: dotnugg.types.compile.Encoder.EncoderOutput[],
        selectors: { 0: number; 1: number; 2: number; 3: number; 4: number; 5: number; 6: number; 7: number },
    ): BigNumber[][] {
        return [];
        // return items.filter(x => x.id)
    }
}
