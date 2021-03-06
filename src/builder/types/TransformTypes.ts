import { BytesLike } from 'ethers';

import { PixelType, ReceiverType } from '../../parser/types/ParserTypes';

import * as BuilderTypes from './BuilderTypes';

export type Collection = {
    features: BuilderTypes.Dictionary<CollectionFeature>;
    width: BuilderTypes.uint8;
};

export type CollectionFeature = {
    name: string;
    zindex: LevelNullable;
    graftable: boolean;
    receivers: Receiver[];
    expandableAt: Rlud;
};

export type Pixel = {
    name: string;
    zindex: Level;
    rgba: string;
    graft: boolean;
    graftName: string;
};

export type Rgba = {
    r: number;
    g: number;
    b: number;
    a: number;
};

export type Coordinate = {
    x: BuilderTypes.uint8;
    y: BuilderTypes.uint8;
};

export type Matrix = {
    matrix: MatrixPixel[][];
};

export type Document = {
    collection: Collection;
    items: Item[];
};

export type Direction = '+' | '-';

export type Item = {
    fileName: string;
    fileUri: string;
    isDefault: boolean;
    feature: string;
    colors: BuilderTypes.Dictionary<Pixel>;
    versions: BuilderTypes.Dictionary<Version>;
    weight: number;
    order: number;
    mtimeMs?: number;
    warings: string[];
};

export type Level = {
    offset: BuilderTypes.uint8;
    direction: Direction;
};

export type LevelNullable = {
    offset: BuilderTypes.uint8;
    direction: Direction;
} | null;

export type MatrixPixel = {
    l: string;
    t: PixelType;
};

export type Receiver = {
    type: ReceiverType;
    feature: string;
    a: { offset: BuilderTypes.uint8; direction: Direction };
    b: { offset: BuilderTypes.uint8; direction: Direction };
};

export type Rlud = {
    r: BuilderTypes.uint8;
    l: BuilderTypes.uint8;
    u: BuilderTypes.uint8;
    d: BuilderTypes.uint8;
};

export type Version = {
    name: string;
    radii: Rlud;
    expanders: Rlud;
    anchor: Coordinate;
    data: Matrix;
    receivers: Receiver[];
};
