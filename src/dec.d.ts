type uint8 = number;

type Dictionary<T> = {
    [_: string]: T;
};

type NumberDictionary<T> = {
    [_: number]: T;
};

interface Array<T> {
    first(count?: number): Array<T>;
}
