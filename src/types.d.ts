declare module 'vscode';

declare namespace NL.DotNugg {
    type RangeOf<T> = {
        value: T;
        token: ParsedToken;
        endToken?: ParsedToken;
    };

    //  type Decoration = {
    //      range: import('vscode').Range;
    //      hoverMessage: string;
    //      type: DecorationType;
    //  };

    //  type BaseHelpers = 'topWidth' | 'topHeight' | 'eyeWidth' | 'mouthWidth' | 'midWidth' | 'midHeight' | 'botWidth' | 'botHeight';

    //  type DecorationType = 'expander' | 'vertical_expander';

    type Collection = {
        features: RangeOf<CollectionFeatures>;
        width: RangeOf<number>;
    };

    type CollectionFeatures = Dictionary<RangeOf<CollectionFeature>>;

    type CollectionFeature = {
        name: RangeOf<string>;
        zindex: RangeOf<ZIndex>;
        receivers: RangeOf<Receiver>[];
        expandableAt: RangeOf<RLUD<number>>;
    };

    type Document = {
        collection: RangeOf<Collection> | undefined;
        //   bases: RangeOf<Base>[];
        items: RangeOf<Item>[];
    };

    type Colors = Dictionary<RangeOf<Color>>;

    type Item = {
        isDefault: boolean;
        feature: RangeOf<string>;
        colors: RangeOf<Colors>;
        versions: RangeOf<Versions>;
    };
    type Versions = Dictionary<RangeOf<Version>>;
    type Version = {
        name: RangeOf<string>;
        radii: RangeOf<RLUD<number>>;
        expanders: RangeOf<RLUD<number>>;
        anchor: RangeOf<Coordinate>;
        receivers: RangeOf<Receiver>[];
        data: RangeOf<Data>;
    };
    type Coordinate = {
        x: RangeOf<number>;
        y: RangeOf<number>;
    };

    type Receiver = {
        a: RangeOf<Offset>;
        b: RangeOf<Offset>;
        feature: RangeOf<string>;
        type: 'calculated' | 'static';
    };

    type RLUD<T> = {
        l: RangeOf<T>;
        r: RangeOf<T>;
        u: RangeOf<T>;
        d: RangeOf<T>;
    };

    type Color = {
        name: RangeOf<string>;
        zindex: RangeOf<ZIndex>;
        rgba: RangeOf<RGBA>;
    };

    type RGBA = `rgba(${_}${number}${_},${_}${number}${_},${_}${number}${_},${_}${number}${_})`;

    type _ = '';

    type ZIndex = {
        direction: Operator;
        offset: number;
    };

    type Offset = {
        direction: Operator;
        offset: number;
    };

    type Data = {
        matrix: RangeOf<DataRow>[];
    };

    type DataRow = RangeOf<Pixel>[];

    type PixelType = 'transparent' | 'filter' | 'color';

    type Pixel = {
        label: RangeOf<string>;
        type: RangeOf<PixelType>;
    };

    type ParsedToken = {
        token: import('vscode-textmate').IToken;
        ruleStack: import('vscode-textmate').StackElement;
        line: string;
        value: string;
        lineNumber: number;
    };

    type Dictionary<T> = {
        [_: string]: T;
    };

    type Operator = '+' | '-';

    type UnparsedAnchor = `${number}${Operator}${number}`;

    type Split<S extends string, D extends string> = string extends S
        ? string[]
        : S extends ''
        ? []
        : S extends `${infer T}${D}${infer U}`
        ? [T, ...Split<U, D>]
        : [S];
}
