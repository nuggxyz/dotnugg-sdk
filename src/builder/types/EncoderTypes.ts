import * as BuilderTypes from './BuilderTypes';

export type Bytes = import('ethers').Bytes;

export type Document = {
    collection?: Collection;
    items: Item[];
};

export type EncodedDocument = {
    collection: Bytes;
    items: BuilderTypes.Dictionary<Bytes>;
};

// export type Item struct {
// 	Versions []*Version
// 	Pixels   []*Pixel
// 	Feature  BuilderTypes.uint8
// }
export type Stats = { features: BuilderTypes.Dictionary<{ name: string; amount: number }> };
export type Item = {
    id: number;
    fileName: string;
    folderName: string;
    fileUri: string;
    versions: Version[];
    pixels: Pixel[];
    feature: BuilderTypes.uint8;
    mtimeMs?: number;
    order: number;
    weight: number;
    warnings: string[];
};
// export type Version struct {
// 	Groups    []*Group
// 	Len       *Coordinate
// 	Anchor    *Coordinate
// 	Expanders *Rlud
// 	Radii     *Rlud
// 	Receivers []*Receiver
// }

export type Version = {
    groups: Group[];
    len: Coordinate;
    anchor: Coordinate;
    expanders: Rlud;
    radii: Rlud;
    receivers: Receiver[];
};
// export type Collection struct {
// 	DefaultItems []*Item
// 	FeatureLen   BuilderTypes.uint8
// 	Width        BuilderTypes.uint8
// }
export type Collection = {
    featureLen: BuilderTypes.uint8;
    width: BuilderTypes.uint8;
};
// export type Pixel struct {
// 	Rgba   *Rgba
// 	Zindex int8
// }
export type Pixel = {
    rgba: Rgba;
    zindex: BuilderTypes.uint8;
};
// export type Receiver struct {
// 	Feature int8
// 	A       int8
// 	B       int8
// }

export type Receiver = {
    feature: BuilderTypes.uint8;
    xorZindex: BuilderTypes.uint8;
    yorYoffset: BuilderTypes.uint8;
    calculated: boolean;
};
// export type Rgba struct {
// 	R BuilderTypes.uint8
// 	G BuilderTypes.uint8
// 	B BuilderTypes.uint8
// 	A BuilderTypes.uint8
// }

// export type Rlud struct {
// 	Exists bool
// 	R      BuilderTypes.uint8
// 	L      BuilderTypes.uint8
// 	U      BuilderTypes.uint8
// 	D      BuilderTypes.uint8
// }
export type Byter = {
    dat: string | number;
    bit: number;
    nam?: string;
};

export type Result = {
    feature: number;
    bits: Byter[];
    hex: import('ethers').BigNumber[];
};

export type Rlud = {
    exists: boolean;
    r: BuilderTypes.uint8;
    l: BuilderTypes.uint8;
    u: BuilderTypes.uint8;
    d: BuilderTypes.uint8;
};

// export type Coordinate struct {
// 	X BuilderTypes.uint8
// 	Y BuilderTypes.uint8
// }

export type Coordinate = {
    x: BuilderTypes.uint8;
    y: BuilderTypes.uint8;
};

// // To be only one BuilderTypes.uint8
// export type Group struct {
// 	ColorKey BuilderTypes.uint8
// 	Len      BuilderTypes.uint8
// }

export type Group = {
    colorkey: BuilderTypes.uint8;
    len: BuilderTypes.uint8;
};

export type Rgba = {
    r: BuilderTypes.uint8;
    g: BuilderTypes.uint8;
    b: BuilderTypes.uint8;
    a: BuilderTypes.uint8;
};
