declare module 'vscode';

export type RangeOf<T> = {
    value: T;
    token: ParsedToken;
    endToken?: ParsedToken;
};

//  export type Decoration = {
//      range: import('vscode').Range;
//      hoverMessage: string;
//      type: DecorationType;
//  };

//  export type BaseHelpers = 'topWidth' | 'topHeight' | 'eyeWidth' | 'mouthWidth' | 'midWidth' | 'midHeight' | 'botWidth' | 'botHeight';

//  export type DecorationType = 'expander' | 'vertical_expander';

export type Collection = {
    features: RangeOf<CollectionFeatures>;
    width: RangeOf<number>;
    fileUri: string;
};

export type CollectionFeatures = Dictionary<RangeOf<CollectionFeature>>;

export type CollectionFeature = {
    name: RangeOf<string>;
    zindex: RangeOf<ZIndex>;
    receivers: RangeOf<Receiver>[];
    expandableAt: RangeOf<RLUD<number>>;
};

export type Document = {
    collection: RangeOf<Collection> | undefined;
    //   bases: RangeOf<Base>[];
    items: RangeOf<Item>[];
};

export type Colors = Dictionary<RangeOf<Color>>;

export type Item = {
    isDefault: boolean;
    feature: RangeOf<string>;
    weight: RangeOf<number>;
    order: RangeOf<number>;
    colors: RangeOf<Colors>;
    versions: RangeOf<Versions>;
    fileName: string;
    fileUri: string;
};
export type Versions = Dictionary<RangeOf<Version>>;
export type Version = {
    name: RangeOf<string>;
    radii: RangeOf<RLUD<number>>;
    expanders: RangeOf<RLUD<number>>;
    anchor: RangeOf<Coordinate>;
    receivers: RangeOf<Receiver>[];
    data: RangeOf<Data>;
};
export type Coordinate = {
    x: RangeOf<number>;
    y: RangeOf<number>;
};

export enum ReceiverType {
    CALCULATED,
    STATIC,
}

export type Receiver = {
    a: RangeOf<Offset>;
    b: RangeOf<Offset>;
    feature: RangeOf<string>;
    type: ReceiverType; // calculated, static
};

export type RLUD<T> = {
    l: RangeOf<T>;
    r: RangeOf<T>;
    u: RangeOf<T>;
    d: RangeOf<T>;
};

export type Color = {
    name: RangeOf<string>;
    zindex: RangeOf<ZIndex>;
    rgba: RangeOf<RGBA>;
};

export type RGBA = `rgba(${_}${number}${_},${_}${number}${_},${_}${number}${_},${_}${number}${_})`;

export type _ = '';

export type ZIndex = {
    direction: Operator;
    offset: number;
};

export type Offset = {
    direction: Operator;
    offset: number;
};

export type Data = {
    matrix: RangeOf<DataRow>[];
};

export type DataRow = RangeOf<Pixel>[];

export enum PixelType {
    TRANSPARENT,
    COLOR,
}

export type Pixel = {
    l: RangeOf<string>;
    t: RangeOf<PixelType>;
};

export type ParsedToken = {
    token: import('vscode-textmate').IToken;
    ruleStack: import('vscode-textmate').StackElement;
    line: string;
    value: string;
    lineNumber: number;
};

export type Dictionary<T> = {
    [_: string]: T;
};

export type NumberDictionary<T> = {
    [_: number]: T;
};

export type Operator = '+' | '-';

export type UnparsedAnchor = `${number}${Operator}${number}`;

export type Split<S extends string, D extends string> = string extends S
    ? string[]
    : S extends ''
    ? []
    : S extends `${infer T}${D}${infer U}`
    ? [T, ...Split<U, D>]
    : [S];
