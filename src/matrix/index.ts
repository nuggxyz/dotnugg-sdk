import { BigNumber } from '@ethersproject/bignumber';

import { dotnugg } from '..';

export class Matrix {
    public static mockHexArray(item: BigNumber[]): BigNumber[] {
        return [BigNumber.from(item.length), ...item];
    }

    public static mockHexArrays(items: BigNumber[][]): BigNumber[][] {
        return items.map((x) => this.mockHexArray(x));
    }
}
