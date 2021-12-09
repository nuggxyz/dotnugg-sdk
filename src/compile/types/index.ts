import { Encoder } from './encoder';
import { Transformer } from './transformer';
import { Parser } from './parser';

export {Encoder, Transformer, Parser}


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

