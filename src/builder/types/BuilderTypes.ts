export type uint8 = number;
export type uint12 = number;
export type uint16 = number;

export type uint1 = number;
export type uint25 = number;
export type uint9 = number;
export type uint41 = number;

export type Dictionary<T> = {
    [_: string]: T;
};

export type NumberDictionary<T> = {
    [_: number]: T;
};
