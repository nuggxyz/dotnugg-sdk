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

        let ptr = BigNumber.from(1);

        let beginres: BytesLike = ethers.utils.hexConcat(input.map((x) => x._hex));

        for (var i = 0; i < input.length; i++) {
            const len = ethers.utils.hexDataLength(input[i]._hex);
            working.push({ dat: ptr._hex, bit: 16, nam: 'pos' });

            ptr = ptr.add(len);
        }

        for (var i = 0; i < input.length; i++) {}

        let res: BytesLike = '';
        res += ethers.utils.hexZeroPad(ethers.utils.hexValue(working[0].dat), 1).replace('0x', '');

        for (var i = 1; i < working.length; i++) {
            res += ethers.utils.hexZeroPad(ethers.utils.hexValue(working[i].dat), 2).replace('0x', '');
        }

        res += beginres.replace('0x', '');

        res = '0x60125981380380925939F3646F746E75676700' + res + keccak256('0x' + res).replace('0x', '');

        return res;
    }
}
