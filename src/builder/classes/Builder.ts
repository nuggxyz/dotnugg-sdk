import { BigNumber, BytesLike, ethers } from 'ethers';
import { AbiCoder, keccak256 } from 'ethers/lib/utils';

import { DotnuggV1Storage, DotnuggV1Storage__factory } from '../../typechain';
import * as TransformTypes from '../types/TransformTypes';
import * as EncoderTypes from '../types/EncoderTypes';
import * as BuilderTypes from '../types/BuilderTypes';
import { dotnugg } from '../..';

import { Transform } from './Transform';
import { Encoder } from './Encoder';

export class Builder {
    public static transform = Transform;

    output: EncoderTypes.EncoderOutput[] = [];

    stats: EncoderTypes.Stats = { features: {} };

    outputByItem: EncoderTypes.OutputByItem = {};
    outputByItemArray: BuilderTypes.Dictionary<BigNumber[][]> = {};

    ouputByFeatureHex: BigNumber[][][] = [];

    ouputByFeaturePlain: BigNumber[][] = [];
    unbrokenArray: BigNumber[][] = [];

    bulkupload: Promise<BytesLike>;
    precompressed: BytesLike[];
    encoded: BytesLike;
    compressed: BytesLike;

    public static fromObject(obj: TransformTypes.Document) {
        return new Builder(Transform.fromObject(obj));
    }

    public static fromString(json: string) {
        return new Builder(Transform.fromString(json));
    }

    public static fromParser(parser: dotnugg.parser) {
        return new Builder(Transform.fromParser(parser));
    }

    protected constructor(transform: Transform) {
        const input = transform.output;

        for (var i = 0; i < 8; i++) {
            this.outputByItemArray[i] = [];
            this.outputByItem[i] = {};
            this.unbrokenArray[i] = [];
            this.ouputByFeatureHex[i] = [];
            this.ouputByFeaturePlain[i] = [];
        }

        const res = input.items.map((x: EncoderTypes.Item) => {
            const item = Encoder.encodeItem(x);

            const bet = Encoder.strarr(item.bits);

            const bu = Builder.breakup(bet);

            const res = { ...item, hex: bu, hexMocked: bu };

            if (this.stats.features[x.feature] === undefined) {
                this.stats.features[x.feature] = { name: x.folderName, amount: 0 };
            }
            this.unbrokenArray[x.feature].push(bet);

            this.outputByItem[x.feature][x.id] = res;
            this.outputByItemArray[x.feature].push(res.hex);

            this.ouputByFeatureHex[x.feature].push(res.hex);
            this.ouputByFeaturePlain[x.feature].push(
                BigNumber.from(new ethers.utils.AbiCoder().encode(['uint256[]'], [res.hex.map((x) => x._hex)])),
            );

            this.stats.features[x.feature].amount++;

            return res;
        });

        this.precompressed = [
            Builder.squish(this.unbrokenArray[0]),
            Builder.squish(this.unbrokenArray[1]),
            Builder.squish(this.unbrokenArray[2]),
            Builder.squish(this.unbrokenArray[3]),
            Builder.squish(this.unbrokenArray[4]),
            Builder.squish(this.unbrokenArray[5]),
            Builder.squish(this.unbrokenArray[6]),
            Builder.squish(this.unbrokenArray[7]),
        ];

        this.compressed = new AbiCoder().encode([ethers.utils.ParamType.fromString('bytes[]')], [this.precompressed]);

        this.encoded = new AbiCoder().encode(
            [ethers.utils.ParamType.fromString('uint256[][][]')],
            [
                [
                    this.outputByItemArray[0],
                    this.outputByItemArray[1],
                    this.outputByItemArray[2],
                    this.outputByItemArray[3],
                    this.outputByItemArray[4],
                    this.outputByItemArray[5],
                    this.outputByItemArray[6],
                    this.outputByItemArray[7],
                ],
            ],
        );

        this.bulkupload = (
            new ethers.Contract(
                ethers.constants.AddressZero,
                DotnuggV1Storage__factory.abi,
                ethers.getDefaultProvider(),
            ) as DotnuggV1Storage
        ).populateTransaction
            .unsafeBulkStore([
                this.outputByItemArray[0],
                this.outputByItemArray[1],
                this.outputByItemArray[2],
                this.outputByItemArray[3],
                this.outputByItemArray[4],
                this.outputByItemArray[5],
                this.outputByItemArray[6],
                this.outputByItemArray[7],
            ])
            .then((tx) => tx.data);

        this.output = res;
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

    public static squish(input: BigNumber[]): BytesLike {
        let working: EncoderTypes.Byter[] = [];
        working.push({
            dat: input.length,
            bit: 8,
            nam: 'length',
        });

        // 602060023D35810280820182800180858481600f0101903983513D85528091510380869006860381838239013DF3 /

        // 0x60376020601b80380380913D390380918082039020815114023DF36020600260043581026004808483603801903982513D845280918051903D905203808590066040036001868304013D5281838239013DF3

        // 0x603A6020601b80380380913D390380918082039020815114023DF36020600260043581026004808483603b01903982513D8452809180519086801B90520380859006606003600186830401865281838239013DF3
        let ptr = BigNumber.from(1);

        let RUNTIME =
            '6020_6002_6004_35_81_02_60_04_80_84_83_603a_01_90_39_82_51_3D_84_52_80_91_80_51_90_86_80_1B_90_52_03_80____85_90_06_6060_03__6001_86_83_04_01_86_52__81_83_82_39_01_3D_F3'.replaceAll(
                '_',
                '',
            );

        let res: BytesLike = RUNTIME;

        ptr = ptr.add(res.length / 2);

        // console.log(res, ptr);

        let beginres: BytesLike = ethers.utils.hexConcat(input.map((x) => x._hex));

        for (var i = 0; i < input.length; i++) {
            const len = ethers.utils.hexDataLength(input[i]._hex);
            working.push({ dat: ptr._hex, bit: 16, nam: 'pos' });

            ptr = ptr.add(len);
        }

        working.push({ dat: ptr._hex, bit: 16, nam: 'fpos' });

        for (var i = 0; i < input.length; i++) {}

        res += ethers.utils.hexZeroPad(ethers.utils.hexValue(working[0].dat), 1).replace('0x', '');

        working.shift();

        for (var i = 0; i < working.length; i++) {
            res += ethers.utils.hexZeroPad(ethers.utils.hexValue(+working[i].dat + working.length * 2), 2).replace('0x', '');
        }

        res += beginres.replace('0x', '');

        res =
            '0x60_39_60_20_60_1b_80_38_03_80_91_3D_39_03_80_91_80_82_03_90_20_81_51_14_02_3D_F3'.replaceAll('_', '') +
            res +
            keccak256('0x' + res.substring(RUNTIME.length)).replace('0x', '');

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
