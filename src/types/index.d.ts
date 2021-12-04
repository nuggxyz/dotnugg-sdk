/// <reference types="./encoder" />
/// <reference types="./transformer" />
/// <reference types="./parser" />

type uint8 = number;
type uint12 = number;
type uint16 = number;

type uint1 = number;
type uint25 = number;
type uint9 = number;
type uint41 = number;

type Dictionary<T> = {
    [_: string]: T;
};

type NumberDictionary<T> = {
    [_: number]: T;
};
type Byter = {
    dat: string | number;
    bit: number;
    nam?: string;
};
interface Array<T> {
    first(count?: number): Array<T>;
}

declare namespace NL.DotNugg.Compiler {
    type Result = {
        feature: number;
        bits: Byter[];
        hex: import('ethers').BigNumber[];
    }
}

