import * as fs from 'fs';

import { BigNumber, BytesLike, ethers } from 'ethers';
import { AbiCoder, keccak256 } from 'ethers/lib/utils';
import invariant from 'tiny-invariant';

import * as TransformTypes from '../types/TransformTypes';
import * as EncoderTypes from '../types/EncoderTypes';
import * as BuilderTypes from '../types/BuilderTypes';
import { dotnugg } from '../..';
import { Config } from '../../parser/classes/Config';
import { AppName } from '../../types';

import { Transform } from './Transform';
import { Encoder } from './Encoder';

export class Builder {
    public static transform = Transform;
    public static encode = Encoder;

    output: BuilderTypes.Output[] = [];

    public outputByFileUriIndex: BuilderTypes.NumberDictionary<BuilderTypes.NumberDictionary<string>> = {};

    public outputByItemIndex: BuilderTypes.NumberDictionary<BuilderTypes.NumberDictionary<number>> = {};

    unbrokenArray: BigNumber[][] = [];

    weights: {
        cumlative: { [_: number]: number };
        cumlativeArray: { [_: number]: Array<BuilderTypes.Weight> };
        normalizedCumlative: { [_: number]: number };
        normalizedCumlativeArray: { [_: number]: Array<BuilderTypes.Weight> };
        adjustedCumlative: { [_: number]: number };
        adjustedCumlativeArray: { [_: number]: Array<BuilderTypes.Weight> };
    } = {
        cumlative: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
        cumlativeArray: {
            0: [],
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: [],
            7: [],
        },

        normalizedCumlative: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
        normalizedCumlativeArray: {
            0: [],
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: [],
            7: [],
        },

        adjustedCumlative: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
        adjustedCumlativeArray: {
            0: [],
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: [],
            7: [],
        },
    };

    // compileTimeBytecode: BytesLike[];
    // compileTimeBytecodeEncoded: BytesLike;

    lastSeenId: { [_: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };

    public static fromObject(obj: TransformTypes.Document) {
        return this.fromDoc(obj);
    }

    public static fromString(json: string) {
        return this.fromDoc(JSON.parse(json));
    }

    public static fromParser(parser: dotnugg.parser) {
        return this.fromDoc(JSON.parse(parser.json));
    }

    public static adjustWeight(input: number) {
        dotnugg.utils.invariantVerbose(input > 0, 'Item found with weight of 0');
        dotnugg.utils.invariantVerbose(input <= 1, 'Item found with weight > 1');
    }

    public static normaize(val: number, max: number, min: number) {
        // const PERCISION = 1000000;
        // return Math.ceil(PERCISION * ((val - min) / (max - min))) / PERCISION;
        return (val - min) / (max - min);
    }

    public adjustWeights() {
        const MAX = 0xffff; // max uint12 0xfff

        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < this.weights.cumlativeArray[i].length; j++) {
                const myindex = j;
                const indv = Builder.normaize(this.weights.cumlativeArray[i][j].indv, this.weights.cumlative[i], 0);
                this.weights.normalizedCumlative[i] += indv;
                this.weights.normalizedCumlativeArray[i].push({
                    indv,
                    cuml: this.weights.normalizedCumlative[i],
                    id: this.weights.cumlativeArray[i][j].id,
                });

                const res = {
                    indv: Math.ceil(this.weights.normalizedCumlativeArray[i][myindex].indv * MAX),
                    cuml: Math.ceil(this.weights.normalizedCumlativeArray[i][myindex].cuml * MAX),
                    id: this.weights.cumlativeArray[i][j].id,
                };

                dotnugg.utils.invariantVerbose(res.indv !== 0, 'individual weight cannot be 0');

                dotnugg.utils.invariantVerbose(
                    res.cuml > (myindex === 0 ? 0 : this.weights.adjustedCumlativeArray[i][myindex - 1].cuml),
                    'ajusted:normaized weight did not increase',
                );

                this.weights.adjustedCumlativeArray[i].push(res);
            }
            if (this.weights.cumlativeArray[i].length > 0)
                this.weights.adjustedCumlativeArray[i][this.weights.adjustedCumlativeArray[i].length - 1].cuml = MAX;
        }
    }

    // public static transformWithCache(dir: string, input: TransformTypes.Document) {
    //     const cachepath = Config.cachePath(dir, 'transformer');

    //     let needsProcessing: TransformTypes.Document = { collection: input.collection, items: [] };
    //     let processed: BuilderTypes.CacheArray = [];
    //     let postCache: BuilderTypes.PostCache = {};
    //     let cache: BuilderTypes.Cache = {};
    //     const precache: BuilderTypes.PreCache = input.items.reduce((prev, curr) => {
    //         return { ...prev, [curr.fileName]: { hash: keccak256([...Buffer.from(JSON.stringify(curr))]), input: curr } };
    //     }, {});

    //     try {
    //         let rawdata = fs.readFileSync(cachepath, 'utf8');
    //         cache = JSON.parse(rawdata);

    //         if (cache[`${undefined}`]) cache = {};
    //     } catch (err) {
    //         console.log('no cache file found at: ', cachepath);
    //     }

    //     const keys = Object.keys(precache);

    //     for (var i = 0; i < keys.length; i++) {
    //         if (cache[keys[i]] && cache[keys[i]].hash === precache[keys[i]].hash) {
    //             processed.push(cache[keys[i]]);
    //             postCache[keys[i]] = cache[keys[i]];
    //             console.log('ayyyyyeeeee');
    //         } else {
    //             needsProcessing.items.push(precache[keys[i]].input);
    //             postCache[keys[i]] = precache[keys[i]];
    //         }
    //     }
    //     let cacheUpdate = false;
    //     console.log('amt: ', needsProcessing.items.length);
    //     let me = new Builder(needsProcessing, processed, (input) => {
    //         cacheUpdate = true;
    //         postCache[input.fileUri].output = input;
    //     });

    //     if (cacheUpdate) {
    //         console.log('updating render cache at: ', cachepath);
    //         dotnugg.utils.ensureDirectoryExistence(cachepath);

    //         fs.writeFileSync(cachepath, JSON.stringify(postCache));
    //     }

    //     return me;
    // }

    public static fromDoc(trans: TransformTypes.Document) {
        let me = new Builder();
        const input = Transform.fromObject(trans).output;

        for (var i = 0; i < 8; i++) {
            me.outputByItemIndex[i] = {};
            me.outputByFileUriIndex[i] = {};
            me.unbrokenArray[i] = [];
        }

        const res0: { input: EncoderTypes.Item; output: EncoderTypes.Output }[] = [
            ...input.items.map((x: EncoderTypes.Item, index) => {
                const res = { output: Encoder.encodeItem(x), input: x };
                return res;
            }),
        ];

        const res1: BuilderTypes.Output[] = res0
            .sort((a, b) => a.output.feature - b.output.feature || a.output.id - b.output.id)
            .map((item, index) => {
                me.weights.cumlative[item.output.feature] += item.input.weight;
                me.weights.cumlativeArray[item.output.feature].push({
                    id: item.output.id,
                    cuml: me.weights.cumlative[item.output.feature],
                    indv: item.input.weight,
                });

                dotnugg.utils.invariantVerbose(
                    me.lastSeenId[item.output.feature] + 1 === item.output.id,
                    `BUILDER:ID-INCREMENT-BY-1: duplicate or missing item found for ${item.input.fileName}:  ${
                        me.lastSeenId[item.output.feature]
                    } + 1 !== ${item.output.id}`,
                );

                me.lastSeenId[item.output.feature]++;

                let res: BuilderTypes.Output = {
                    ...item.output,
                    fileName: item.input.fileName,
                    fileUri: item.input.fileUri,
                    percentWeight: 0,
                    feature: item.output.feature,
                    wanings: item.output.warnings,
                };

                // delete (res as any).bits;

                // me.unbrokenArray[item.output.feature].push(bet);
                me.outputByItemIndex[item.output.feature][item.output.id] = index;
                me.outputByFileUriIndex[item.output.fileUri] = index;

                return res;
            });

        me.adjustWeights();

        me.output = res1.map((x) => {
            return { ...x, percentWeight: me.weights.adjustedCumlativeArray[x.feature][x.id - 1].indv / 0xffff };
        });

        return me;
    }

    protected constructor() {}

    public hexFromBits(input: BuilderTypes.Output['bits']) {
        return Encoder.strarr(input);
    }

    public hexArrayFromBits(input: BuilderTypes.Output['bits']) {
        return Builder.breakup(this.hexFromBits(input));
    }

    public hexFromId(feature: number, pos: number) {
        return Encoder.strarr(this.output[this.outputByItemIndex[feature][pos]].bits);
    }

    public hexArrayFromId(feature: number, pos: number) {
        return Builder.breakup(this.hexFromId(feature, pos));
    }

    public hex(input: BuilderTypes.Output) {
        return Encoder.strarr(input.bits);
    }

    public hexArray(input: BuilderTypes.Output) {
        return Builder.breakup(this.hex(input));
    }

    private _compileTimeBytecodeEncoded: BytesLike;

    public get compileTimeBytecodeEncoded() {
        if (!this._compileTimeBytecodeEncoded) {
            this._compileTimeBytecodeEncoded = new AbiCoder().encode(
                [ethers.utils.ParamType.fromString('bytes[]')],
                [this.compileTimeBytecode],
            );
        }
        return this._compileTimeBytecodeEncoded;
    }

    private _compileTimeBytecode: BytesLike[];

    public get compileTimeBytecode() {
        if (!this._compileTimeBytecode) {
            Object.keys(this.outputByItemIndex).forEach((x) => {
                Object.keys(this.outputByItemIndex[x]).forEach((y) => {
                    if (y !== '0') this.unbrokenArray[+x].push(this.hexFromId(+x, +y));
                });
            });
            this._compileTimeBytecode = [
                Builder.squish(this.unbrokenArray[0], this.weights.adjustedCumlativeArray[0]),
                Builder.squish(this.unbrokenArray[1], this.weights.adjustedCumlativeArray[1]),
                Builder.squish(this.unbrokenArray[2], this.weights.adjustedCumlativeArray[2]),
                Builder.squish(this.unbrokenArray[3], this.weights.adjustedCumlativeArray[3]),
                Builder.squish(this.unbrokenArray[4], this.weights.adjustedCumlativeArray[4]),
                Builder.squish(this.unbrokenArray[5], this.weights.adjustedCumlativeArray[5]),
                Builder.squish(this.unbrokenArray[6], this.weights.adjustedCumlativeArray[6]),
                Builder.squish(this.unbrokenArray[7], this.weights.adjustedCumlativeArray[7]),
            ];
        }
        return this._compileTimeBytecode;
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

    public static readFromExternalCache(dir: string, appName: AppName): Builder | undefined {
        const cachepath = Config.externalCachePath(dir, appName, 'builder');

        try {
            let rawdata = fs.readFileSync(cachepath, 'utf8');

            let cache = JSON.parse(rawdata) as Builder;
            if (cache[`${undefined}`]) return undefined;
            let me = new Builder();
            me.output = cache.output;
            me.lastSeenId = cache.lastSeenId;
            me.weights = cache.weights;
            me.outputByFileUriIndex = cache.outputByFileUriIndex;
            me.outputByItemIndex = cache.outputByItemIndex;
            me.unbrokenArray = cache.unbrokenArray;

            return me;
        } catch (err) {
            console.log('no cache file found at: ', cachepath);
        }
        return undefined;
    }

    public static readFromCache(dir: string): Builder {
        const cachepath = Config.cachePath(dir, 'builder');

        try {
            let rawdata = fs.readFileSync(cachepath, 'utf8');

            let cache = JSON.parse(rawdata) as Builder;
            if (cache[`${undefined}`]) return undefined;
            let me = new Builder();
            me.output = cache.output;
            me.lastSeenId = cache.lastSeenId;
            me.weights = cache.weights;
            me.outputByFileUriIndex = cache.outputByFileUriIndex;
            me.outputByItemIndex = cache.outputByItemIndex;
            me.unbrokenArray = cache.unbrokenArray;

            return me;
        } catch (err) {
            console.log('no cache file found at: ', cachepath);
        }
        return undefined;
    }

    public saveToCache(dir: string) {
        const cachepath = Config.cachePath(dir, 'builder');
        console.log('updating builder cache at: ', cachepath);
        dotnugg.utils.ensureDirectoryExistence(cachepath);
        fs.writeFileSync(cachepath, JSON.stringify(this));
    }

    public static numberToBytes(input: number, bytelen: 1 | 2): string {
        return ethers.utils.hexZeroPad(ethers.utils.hexValue(input), bytelen).replace('0x', '');
    }
    public static numberToBytesNoPrexfix(input: number, bytelen: 1 | 2): string {
        return this.numberToBytes(input, bytelen).replace('0x', '');
    }

    public static squish(input: BigNumber[], weights: BuilderTypes.Weight[]): BytesLike {
        invariant(input.length == weights.length, 'SQUISH:0x01: weights and input length do not match');

        let w: string[] = [];
        let indexes: string[] = [];
        let data: string[] = [];

        let indexOffset = 1 + 1 + (input.length + 1) * 2 + input.length * 2;

        input.forEach((x, i) => {
            w.push(this.numberToBytesNoPrexfix(weights[i].cuml, 2));
            indexes.push(this.numberToBytesNoPrexfix(indexOffset + data.reduce((prev, curr) => curr.length / 2 + prev, 0), 2));
            data.push(x._hex.replace('0x', ''));
        });

        const lencheck = indexOffset + data.reduce((prev, curr) => curr.length / 2 + prev, 0);

        indexes.push(this.numberToBytesNoPrexfix(lencheck, 2));

        const runtime = '00' + this.numberToBytesNoPrexfix(input.length, 1) + [...w, ...indexes, ...data].join('');

        const HEADER = '0x60_20_80_60_18_80_38_03_80_91_3D_39_03_80_3D_82_90_20_81_51_14_02_3D_F3'.replaceAll('_', '');

        const deployment = HEADER + runtime + keccak256('0x' + runtime).replace('0x', '');

        // keccak256('0x' + res.substring(RUNTIME.length)).replace('0x', '');
        const correctLen = lencheck + 32 + HEADER.length / 2;

        // console.log({ runtime, deployment });
        invariant(
            correctLen == deployment.length / 2,
            `correctLen ${correctLen} (${runtime.length} + ${HEADER.length} + 32)  != deploymentLength ${deployment.length}`,
        );
        // console.log(deployment);
        return deployment;
    }
}

// 0002
// 8000 ffff e9 = 221
// 000c 00e9 0324 1e0392092105e094951052422003e422021431154861402e450c214455314624500372431430850c41535880291c8185503153151188240606163318801955f314320024816736001c616b31801c316f32470c5bcc720316f321316b361316f321314316331895855055d056006050c50c50d050d082406021150c51151050e000e030858c51256100e060835445540c41802e060d592814600f898598881f7203900bc7f08058316031e8005070c850b330a61324ccb5824792ea049dab4789517edc128561f224d67fd0492c9f889128aeb133587dc2401042069001

// 06cf81ec0a722a98d006c0861a4a982b001b0218692c608c006c196420a188c006c1869296c82ca16a790c00ca16a990c00ca0eab90c00c10a24afb003042c82be43242a42c643242de43242de43242de43242de43242a64296c1a9e890a1b20b06a9692cc006c1aa3a4b3001b0728e81a8c006c9ca1a4a3203b06a3b40db1e05c6f8402c18b018f40028386428599853099e14b63128561f224d67fd04894575892593f1124ccb582281842069001
// 0x602080601880380380913D3903803D829020815114023DF3

// 00028000ffff000c00e901981e0392092105e094951052422003e422021431154861402e450c214455314624500372431430850c41535880291c8185503153151188240606163318801955f314320024816736001c616b31801c316f32470c5bcc720316f321316b361316f321314316331895855055d056006050c50c50d050d082406021150c51151050e000e030858c51256100e060835445540c41802e060d592814600f898598881f7203900bc7f08058316031e8005070c850b330a61324ccb5824792ea049dab4789517edc128561f224d67fd0492c9f889128aeb133587dc240104206900106cf81ec0a722a98d006c0861a4a982b001b0218692c608c006c196420a188c006c1869296c82ca16a790c00ca16a990c00ca0eab90c00c10a24afb003042c82be43242a42c643242de43242de43242de43242de43242a64296c1a9e890a1b20b06a9692cc006c1aa3a4b3001b0728e81a8c006c9ca1a4a3203b06a3b40db1e05c6f8402c18b018f40028386428599853099e14b63128561f224d67fd04894575892593f1124ccb582281842069001

// 62f44e9dce0ce29480bb70679a86bc3592b8af9184f561bcb75f83ae48bab9cf
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
