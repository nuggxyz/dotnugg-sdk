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

export type Weight = { id: number; cuml: number; indv: number };
import * as TransformTypes from '../types/TransformTypes';
import * as EncoderTypes from '../types/EncoderTypes';
export type Output = {
    id: number;
    fileName: string;
    fileUri: string;
    feature: number;
    bits: EncoderTypes.Byter[];
    mtimeMs?: number;
    percentWeight: number;
    wanings: string[];
};

export type OutputByItem = Dictionary<Dictionary<Output>>;

export type CacheArray = { hash: string; input: TransformTypes.Item; output: EncoderTypes.Output }[];

export type Cache = Dictionary<{ hash: string; input: TransformTypes.Item; output: EncoderTypes.Output }>;
export type PreCache = Dictionary<{ hash: string; input: TransformTypes.Item }>;
export type PostCache = Dictionary<{ hash: string; input: TransformTypes.Item; output?: EncoderTypes.Output }>;
