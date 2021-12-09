export namespace Transformer {
    type uint8 = number;

    type Dictionary<T> = {
        [_: string]: T;
    };

    type Collection = {
        features: Dictionary<CollectionFeature>;
        width: uint8;
    };

    type CollectionFeature = {
        name: string;
        zindex: LevelNullable;

        receivers: Receiver[];
        expandableAt: Rlud;
    };

    type Pixel = {
        name: string;
        zindex: Level;
        rgba: string;
    };

    type Rgba = {
        r: number;
        g: number;
        b: number;
        a: number;
    };

    type Coordinate = {
        x: uint8;
        y: uint8;
    };

    type Matrix = {
        matrix: MatrixPixel[][];
    };

    type Document = {
        collection: Collection;
        items: Item[];
    };

    type Direction = '+' | '-';

    type Item = {
        isDefault: boolean;
        feature: string;
        colors: Dictionary<Pixel>;
        versions: Dictionary<Version>;
    };

    type Level = {
        offset: uint8;
        direction: Direction;
    };

    type LevelNullable = {
        offset: uint8;
        direction: Direction;
    } | null;

    type MatrixPixel = {
        label: string;
        type: string;
    };

    type Receiver = {
        type: string;
        feature: string;
        a: {offset: uint8, direction: Direction};
        b: {offset: uint8, direction: Direction};
    };

    type Rlud = {
        r: uint8;
        l: uint8;
        u: uint8;
        d: uint8;
    };

    type Version = {
        name: string;
        radii: Rlud;
        expanders: Rlud;
        anchor: Coordinate;
        data: Matrix;
        receivers: Receiver[];
    };
}
