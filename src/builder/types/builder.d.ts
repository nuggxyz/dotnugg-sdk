
import {Compiler} from '.'

export namespace Builder {
    // type EncodedDocument struct {
    // 	Collection []*byte
    // 	Items      map[uint8][][]*byte
    // }

    type uint8 = number;

    type Dictionary<T> = {
        [_: string]: T;
    };

    type Bytes = import('ethers').Bytes;

    type Document = {
        collection?: Collection;
        items: Item[];
    };

    type EncodedDocument = {
        collection: Bytes;
        items: Dictionary<Bytes>;
    };

    // type Item struct {
    // 	Versions []*Version
    // 	Pixels   []*Pixel
    // 	Feature  uint8
    // }
    type Stats = { features: Dictionary<{ name: string; amount: number }> };
    type Item = {
        id: number;
        fileName: string;
        folderName: string;
        versions: Version[];
        pixels: Pixel[];
        feature: uint8;
    };
    // type Version struct {
    // 	Groups    []*Group
    // 	Len       *Coordinate
    // 	Anchor    *Coordinate
    // 	Expanders *Rlud
    // 	Radii     *Rlud
    // 	Receivers []*Receiver
    // }
    type EncoderOutput = {
        id: number;
        fileName: string;
        feature: number;
        bits: Compiler.Byter[];
        hex: import('ethers').BigNumber[];
        hexMocked: import('ethers').BigNumber[];

    };

    type OutputByItem = Dictionary<Dictionary<EncoderOutput>>;
    type OutputByItemArray = Dictionary<Array<EncoderOutput>>;

    type Version = {
        groups: Group[];
        len: Coordinate;
        anchor: Coordinate;
        expanders: Rlud;
        radii: Rlud;
        receivers: Receiver[];
    };
    // type Collection struct {
    // 	DefaultItems []*Item
    // 	FeatureLen   uint8
    // 	Width        uint8
    // }
    type Collection = {
        featureLen: uint8;
        width: uint8;
    };
    // type Pixel struct {
    // 	Rgba   *Rgba
    // 	Zindex int8
    // }
    type Pixel = {
        rgba: Rgba;
        zindex: uint8;
    };
    // type Receiver struct {
    // 	Feature int8
    // 	A       int8
    // 	B       int8
    // }

    type Receiver = {
        feature: uint8;
        xorZindex: uint8;
        yorYoffset: uint8;
        calculated: boolean;
    };
    // type Rgba struct {
    // 	R uint8
    // 	G uint8
    // 	B uint8
    // 	A uint8
    // }

    // type Rlud struct {
    // 	Exists bool
    // 	R      uint8
    // 	L      uint8
    // 	U      uint8
    // 	D      uint8
    // }

    type Rlud = {
        exists: boolean;
        r: uint8;
        l: uint8;
        u: uint8;
        d: uint8;
    };

    // type Coordinate struct {
    // 	X uint8
    // 	Y uint8
    // }

    type Coordinate = {
        x: uint8;
        y: uint8;
    };

    // // To be only one uint8
    // type Group struct {
    // 	ColorKey uint8
    // 	Len      uint8
    // }

    type Group = {
        colorkey: uint8;
        len: uint8;
    };

    type Rgba = {
        r: uint8;
        g: uint8;
        b: uint8;
        a: uint8;
    };

    // type Rgba = {

    // };
    // func (me *Rgba) ToHex() *[4]byte {
    // 	res := [4]byte{byte(me.R), byte(me.G), byte(me.B), byte(me.A)}
    // 	return &res
    // }
    // type Rlud struct {
    // 	Exists bool
    // 	R      uint8
    // 	L      uint8
    // 	U      uint8
    // 	D      uint8
    // }
    // type Coordinate struct {
    // 	X uint8
    // 	Y uint8
    // }
    // // To be only one uint8
    // type Group struct {
    // 	ColorKey uint8
    // 	Len      uint8
    // }
}
