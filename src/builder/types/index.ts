import { Encoder } from './encoder';
import { Transform } from './transform';

export {Encoder, Transform}


export namespace Compiler {
    

    // export namespace Parser {}
    // export namespace Encoder {}
    // export namespace Transformer {}

     export type Result = {
        feature: number;
        bits: Byter[];
        hex: import('ethers').BigNumber[];
    }
     export type Byter = {
        dat: string | number;
        bit: number;
        nam?: string;
    };
}

