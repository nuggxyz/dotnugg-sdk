import * as fs from 'fs';

import { BigNumber, BytesLike, ethers } from 'ethers';
import { AbiCoder, keccak256 } from 'ethers/lib/utils';
import invariant from 'tiny-invariant';

import { DotnuggV1Storage, DotnuggV1Storage__factory } from '../../typechain';
import * as TransformTypes from '../types/TransformTypes';
import * as EncoderTypes from '../types/EncoderTypes';
import * as BuilderTypes from '../types/BuilderTypes';
import { dotnugg } from '../..';
import { Config } from '../../parser/classes/Config';

import { Transform } from './Transform';
import { Encoder } from './Encoder';

export class Builder {
    public static transform = Transform;

    output: BuilderTypes.Output[] = [];

    public outputByFileUriIndex: BuilderTypes.NumberDictionary<BuilderTypes.NumberDictionary<string>> = {};

    public outputByItemIndex: BuilderTypes.NumberDictionary<BuilderTypes.NumberDictionary<number>> = {};

    unbrokenArray: BigNumber[][] = [];

    compileTimeBytecode: BytesLike[];
    compileTimeBytecodeEncoded: BytesLike;

    cumlWeights: { [_: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    cumlWeightsArray: { [_: number]: Array<BuilderTypes.Weight> } = {
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
        7: [],
    };

    normalizedCumlWeights: { [_: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    normalizedCumlWeightsArray: { [_: number]: Array<BuilderTypes.Weight> } = {
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
        7: [],
    };

    adjustedCumlWeights: { [_: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    adjustedCumlWeightsArray: { [_: number]: Array<BuilderTypes.Weight> } = {
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
        7: [],
    };

    lastSeenId: { [_: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };

    public static fromObject(obj: TransformTypes.Document) {
        return new Builder(obj);
    }

    public static fromString(json: string) {
        return new Builder(JSON.parse(json));
    }

    public static fromParser(parser: dotnugg.parser) {
        return new Builder(JSON.parse(parser.json));
    }

    public static adjustWeight(input: number) {
        invariant(input > 0, 'Item found with weight of 0');
        invariant(input <= 1, 'Item found with weight > 1');
    }

    public static normaize(val: number, max: number, min: number) {
        // const PERCISION = 1000000;
        // return Math.ceil(PERCISION * ((val - min) / (max - min))) / PERCISION;
        return (val - min) / (max - min);
    }

    public adjustWeights() {
        const MAX = 0xffff; // max uint12 0xfff

        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < this.cumlWeightsArray[i].length; j++) {
                const myindex = j;
                const indv = Builder.normaize(this.cumlWeightsArray[i][j].indv, this.cumlWeights[i], 0);
                this.normalizedCumlWeights[i] += indv;
                this.normalizedCumlWeightsArray[i].push({
                    indv,
                    cuml: this.normalizedCumlWeights[i],
                    id: this.cumlWeightsArray[i][j].id,
                });

                const res = {
                    indv: Math.ceil(this.normalizedCumlWeightsArray[i][myindex].indv * MAX),
                    cuml: Math.ceil(this.normalizedCumlWeightsArray[i][myindex].cuml * MAX),
                    id: this.cumlWeightsArray[i][j].id,
                };

                invariant(res.indv !== 0, 'individual weight cannot be 0');

                invariant(
                    res.cuml > (myindex === 0 ? 0 : this.adjustedCumlWeightsArray[i][myindex - 1].cuml),
                    'ajusted:normaized weight did not increase',
                );

                this.adjustedCumlWeightsArray[i].push(res);
            }
            if (this.cumlWeightsArray[i].length > 0)
                this.adjustedCumlWeightsArray[i][this.adjustedCumlWeightsArray[i].length - 1].cuml = MAX;
        }
    }

    public static transformWithCache(dir: string, input: TransformTypes.Document) {
        const cachepath = Config.cachePath(dir, 'transformer');

        let needsProcessing: TransformTypes.Document = { collection: input.collection, items: [] };
        let processed: EncoderTypes.Output[] = [];
        let postCache: BuilderTypes.PostCache = {};
        let cache: BuilderTypes.Cache = {};

        const precache: BuilderTypes.PreCache = input.items.reduce((prev, curr) => {
            return { ...prev, [curr.fileName]: { hash: keccak256([...Buffer.from(JSON.stringify(curr))]), input: curr } };
        }, {});

        try {
            let rawdata = fs.readFileSync(cachepath, 'utf8');
            cache = JSON.parse(rawdata);

            if (cache[`${undefined}`]) cache = {};
        } catch (err) {
            console.log('no cache file found at: ', cachepath);
        }

        const keys = Object.keys(precache);

        for (var i = 0; i < keys.length; i++) {
            if (cache[keys[i]] && cache[keys[i]].hash === precache[keys[i]].hash) {
                processed.push(cache[keys[i]].output);
                postCache[keys[i]] = cache[keys[i]];
            } else {
                needsProcessing.items.push(precache[keys[i]].input);
                postCache[keys[i]] = precache[keys[i]];
            }
        }

        // cache.reduce((prev, curr) => {
        //     const hash = keccak256(curr.)
        // }, { ok: [], old: [] });
    }

    protected constructor(trans: TransformTypes.Document) {
        const input = Transform.fromObject(trans).output;

        for (var i = 0; i < 8; i++) {
            this.outputByItemIndex[i] = {};
            this.outputByFileUriIndex[i] = {};
            this.unbrokenArray[i] = [];
        }

        const res1: BuilderTypes.Output[] = input.items
            .map((x: EncoderTypes.Item, index) => {
                return { output: Encoder.encodeItem(x), input: x };
            })
            .sort((a, b) => a.input.feature - b.input.feature || a.input.id - b.input.id)

            .map((item, index) => {
                this.cumlWeights[item.output.feature] += item.input.weight;
                this.cumlWeightsArray[item.output.feature].push({
                    id: item.output.id,
                    cuml: this.cumlWeights[item.output.feature],
                    indv: item.input.weight,
                });

                invariant(
                    this.lastSeenId[item.output.feature] + 1 === item.output.id,
                    `BUILDER:ID-INCREMENT-BY-1: duplicate or missing item found for ${item.input.fileName}:  ${
                        this.lastSeenId[item.output.feature]
                    } + 1 !== ${item.output.id}`,
                );

                this.lastSeenId[item.output.feature]++;

                const bet = Encoder.strarr(item.output.bits);

                const bu = Builder.breakup(bet);

                let res: BuilderTypes.Output = {
                    ...item.output,
                    hex: bu,
                    fileName: item.input.fileName,
                    fileUri: item.input.fileUri,
                    percentWeight: 0,
                    feature: item.input.feature,
                    wanings: item.input.warnings,
                };

                delete (res as any).bits;

                this.unbrokenArray[item.input.feature].push(bet);
                this.outputByItemIndex[item.input.feature][item.input.id] = index;
                this.outputByFileUriIndex[item.input.fileUri] = index;

                return res;
            });

        this.adjustWeights();

        this.compileTimeBytecode = [
            Builder.squish(this.unbrokenArray[0], this.adjustedCumlWeightsArray[0]),
            Builder.squish(this.unbrokenArray[1], this.adjustedCumlWeightsArray[1]),
            Builder.squish(this.unbrokenArray[2], this.adjustedCumlWeightsArray[2]),
            Builder.squish(this.unbrokenArray[3], this.adjustedCumlWeightsArray[3]),
            Builder.squish(this.unbrokenArray[4], this.adjustedCumlWeightsArray[4]),
            Builder.squish(this.unbrokenArray[5], this.adjustedCumlWeightsArray[5]),
            Builder.squish(this.unbrokenArray[6], this.adjustedCumlWeightsArray[6]),
            Builder.squish(this.unbrokenArray[7], this.adjustedCumlWeightsArray[7]),
        ];

        this.compileTimeBytecodeEncoded = new AbiCoder().encode([ethers.utils.ParamType.fromString('bytes[]')], [this.compileTimeBytecode]);

        this.output = res1.map((x) => {
            return { ...x, percentWeight: this.adjustedCumlWeightsArray[x.feature][x.id - 1].indv / 0xffff };
        });
    }

    public outputByItem(feature: number, pos: number): BuilderTypes.Output {
        return this.output[this.outputByItemIndex[feature][pos]];
    }

    public outputByFileUri(uri: string): BuilderTypes.Output {
        return this.output[this.outputByFileUriIndex[uri]];
    }

    public static breakup(input: BigNumber): BigNumber[] {
        let len = ethers.utils.hexDataLength(input._hex);
        let res: BigNumber[] = [];
        while (len > 0) {
            res.push(BigNumber.from(ethers.utils.hexDataSlice(input._hex, len >= 32 ? len - 32 : 0, len)));

            len -= 32;
        }

        res = res.reverse();

        return res;
    }

    public static squish(input: BigNumber[], weights: BuilderTypes.Weight[]): BytesLike {
        invariant(input.length == weights.length, 'SQUISH:0x01: weights and input length do not match');
        let working: EncoderTypes.Byter[] = [];
        let weighting: EncoderTypes.Byter[] = [];

        // working.push({
        //     dat: input.length,
        //     bit: 8,
        //     nam: 'length',
        // });

        // 602060023D35810280820182800180858481600f0101903983513D85528091510380869006860381838239013DF3 /

        // 0x60376020601b80380380913D390380918082039020815114023DF36020600260043581026004808483603801903982513D845280918051903D905203808590066040036001868304013D5281838239013DF3

        // 0x603A6020601b80380380913D390380918082039020815114023DF36020600260043581026004808483603b01903982513D8452809180519086801B90520380859006606003600186830401865281838239013DF3
        let ptr = BigNumber.from(1);

        // let RUNTIME =
        //     '6020_6002_6004_35_81_02_60_04_80_84_83_603a_01_90_39_82_51_3D_84_52_80_91_80_51_90_86_80_1B_90_52_03_80____85_90_06_6060_03__6001_86_83_04_01_86_52__81_83_82_39_01_3D_F3'.replaceAll(
        //         '_',
        //         '',
        //     );

        let res: BytesLike = '';

        ptr = ptr.add(res.length / 2);

        // console.log(res, ptr);

        let beginres: BytesLike = ethers.utils.hexConcat(input.map((x) => x._hex));

        res += ethers.utils.hexZeroPad(ethers.utils.hexValue(input.length), 1).replace('0x', '');

        for (var i = 0; i < input.length; i++) {
            // weighting.push({ dat: weights[i].cuml, bit: 16, nam: 'weight' });
            ptr = ptr.add(2);
            res += ethers.utils.hexZeroPad(ethers.utils.hexValue(+weights[i].cuml), 2).replace('0x', '');
        }

        for (var i = 0; i < input.length; i++) {
            const len = ethers.utils.hexDataLength(input[i]._hex);
            working.push({ dat: ptr._hex, bit: 16, nam: 'pos' });

            ptr = ptr.add(len);
        }

        working.push({ dat: ptr._hex, bit: 16, nam: 'fpos' });

        for (var i = 0; i < working.length; i++) {
            res += ethers.utils.hexZeroPad(ethers.utils.hexValue(+working[i].dat + working.length * 2), 2).replace('0x', '');
        }

        res += beginres.replace('0x', '');

        res =
            '0x60_00_60_20_60_1b_80_38_03_80_91_3D_39_03_80_91_80_82_03_90_20_81_51_14_02_3D_F3_00'.replaceAll('_', '') +
            res +
            keccak256('0x' + res).replace('0x', '');

        // keccak256('0x' + res.substring(RUNTIME.length)).replace('0x', '');

        // console.log(res);
        return res;
    }
}

// public static squish(input: BigNumber[]): BytesLike {
//     let working: EncoderTypes.Byter[] = [];
//     working.push({
//         dat: input.length,
//         bit: 8,
//         nam: 'length',
//     });

//     // 602060023D35810280820182800180858481600f0101903983513D85528091510380869006860381838239013DF3 /

//     let ptr = BigNumber.from(1);

//     let res: BytesLike =
//         '6020_6002_3D_35_81_02_80_82_01_82_80_01_80_85_84_602d_01_90_39_83_51_3D_85_52_80_91_51_03_80____86_90_06_86_03_81_83_82_39_01_3D_F3'.replaceAll(
//             '_',
//             '',
//         );

//     ptr = ptr.add(res.length / 2);

//     console.log(res, ptr);

//     let beginres: BytesLike = ethers.utils.hexConcat(input.map((x) => x._hex));

//     for (var i = 0; i < input.length; i++) {
//         const len = ethers.utils.hexDataLength(input[i]._hex);
//         working.push({ dat: ptr._hex, bit: 16, nam: 'pos' });

//         ptr = ptr.add(len);
//     }

//     working.push({ dat: ptr._hex, bit: 16, nam: 'fpos' });

//     for (var i = 0; i < input.length; i++) {}

//     res += ethers.utils.hexZeroPad(ethers.utils.hexValue(working[0].dat), 1).replace('0x', '');

//     working.shift();

//     for (var i = 0; i < working.length; i++) {
//         res += ethers.utils.hexZeroPad(ethers.utils.hexValue(+working[i].dat + working.length * 2), 2).replace('0x', '');
//     }

//     res += beginres.replace('0x', '');

//     res =
//         '0x3D_60_20_80_80_80_38_03_80_91_85_39_03_80_82_20_83_51_14_02_90_F3_00_04_20_00_00_69_00_00_00_00'.replaceAll('_', '') +
//         keccak256('0x' + res).replace('0x', '') +
//         res;

//     return res;
// }

// bytes32 internal constant DOTNUGG_HEADER_HASH = 0x9952cbfc17ef0998324fa64b8f7d3c36ab326c8ac22c07a9074c75357a326edd;

// 0x60_2c_60_20_60_1b_80_38_03_80_91_3d_39_03_80_91_80_82_03_90_20_81_51_14_02_3d_f3_602060023d358102808201828001808584602d01903983513d85528091510380869006860381838239013df3
//0x602c6020601b80380380913d390380918082039020815114023df3602060023d358102808201828001808584602d01903983513d85528091510380869006860381838239013df3
