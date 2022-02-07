import * as ParserTypes from '../../parser/types/ParserTypes';
import * as TransformTypes from '../../builder/types/TransformTypes';

enum LintSeverity {
    Error = 1,
    Warning = 2,
    Information = 3,
    Hint = 4,
}

type LintResult = LintDescriptor;

type LintDescriptor = {
    loc: LintRange;
    sim: string;
    fix: string[];
    cod: string;
    lev: LintSeverity;
    rng: LintRange;
};

type LintPosition = {
    line: number;
    character: number;
};

type LintRange = {
    start: LintPosition;
    end: LintPosition;
};

export class Linter {
    private static innerRangeOf(start: ParserTypes.RangeOf<any>): LintRange {
        const res = {
            start: { line: start.token.lineNumber, character: start.token.token.endIndex },
            end: { line: start.endToken.lineNumber, character: start.endToken.token.endIndex },
        };

        return res;
    }

    private static rangeOf(token: ParserTypes.ParsedToken): LintRange {
        const res = {
            start: { line: token.lineNumber, character: token.token.startIndex },
            end: { line: token.lineNumber, character: token.token.endIndex },
        };

        return res;
    }

    private static rangeOfLine(token: ParserTypes.ParsedToken): LintRange {
        return {
            start: { line: token.lineNumber, character: token.line.indexOf(token.line.trimStart()) },
            end: { line: token.lineNumber, character: token.line.length },
        };
    }

    private static rangeOfEmptyLine(line: number): LintRange {
        return {
            start: { line, character: 0 },
            end: { line, character: 10 },
        };
    }

    private get collectionFeatureKeys() {
        return Object.keys(this.collection.features);
    }

    private _version;

    private get version() {
        if (!this._version) {
            if (Object.values(this.item.value.versions.value).length === 1) {
                this._version = Object.values(this.item.value.versions.value)[0];
            } else {
                return undefined;
            }
        }
        return this._version;
    }

    private get matrixSize(): { x: number; y: number } {
        return {
            y: this.version.value.data.value.matrix.length,
            x: this.version.value.data.value.matrix[0].value.length,
        };
    }

    private results: LintResult[] = [];

    private item: ParserTypes.RangeOf<ParserTypes.Item>;
    private collection: TransformTypes.Collection;
    private text: string[];

    private get startLine() {
        return this.item.token.lineNumber;
    }

    static lintItemWithCollection(item: ParserTypes.RangeOf<ParserTypes.Item>, text: string, collection: TransformTypes.Collection) {
        let me = new Linter();

        me.text = text.split('\n');

        me.item = item;
        me.collection = collection;

        me.lint();

        return me.results;
    }

    private lint() {
        if (!this.version) {
            // compiler does not support muliple versions
        }
        for (var i = this.item.token.lineNumber; i < this.item.endToken.lineNumber; i++) {
            if (this.text[i].trim().length === 0) {
                this.results.push({
                    loc: Linter.rangeOfEmptyLine(this.startLine + i),
                    rng: Linter.rangeOfEmptyLine(this.startLine + i),
                    cod: 'INVALID:WHITESPACE:0x72',
                    sim: `invalid whitespace line in item definition`,

                    fix: [
                        `the compiler does not understand whitespace lines`,

                        // `set the dotnugg formatter in your setting.json file to auto fix this`,
                        // `confused? inside a file called ".vscode/settings.json" `,
                        // `add --- "[dotnugg]": { "editor.defaultFormatter": "nuggxyz.dotnugg" }`,
                    ],
                    lev: LintSeverity['Error'],
                });
                return;
            }
        }

        //lint feature
        this.lintFeature(this.item.value.feature);
        // lint colors
        Object.values(this.item.value.colors.value).forEach((color) => {
            this.lintColorName(color.value.name);
            this.lintColorRgba(color.value.rgba);
            this.lintColorZindex(color.value.zindex);
        });
        // lint versions
        Object.values(this.item.value.versions.value).forEach((version) => {
            this.lintVersionData(version.value.data);
            this.lintVersionAnchor(version.value.anchor, version.value.data);
            this.lintVersionName(version.value.name);
            this.lintVersionReceivers(version.value.receivers);
        });
    }

    private lintFeature(feature: ParserTypes.RangeOf<string>) {
        if (this.collection && this.collectionFeatureKeys.indexOf(feature.value) === -1) {
            this.results.push({
                loc: Linter.rangeOf(feature.token),
                rng: Linter.rangeOf(feature.token),
                cod: 'UNDEFINED:ITEM:NAME:0x72',
                fix: [`collection only has ` + JSON.stringify(this.collectionFeatureKeys)],
                sim: `undefined feature name ${feature.value}`,
                lev: LintSeverity['Error'],
            });
        }
    }

    private lintColorRgba(rgba: ParserTypes.RangeOf<ParserTypes.RGBA>) {}
    private lintColorName(name: ParserTypes.RangeOf<string>) {}

    private lintColorZindex(zindex: ParserTypes.RangeOf<ParserTypes.ZIndex>) {
        if ((zindex.value.offset > 10 && zindex.value.offset !== 100) || (zindex.value.direction === '-' && zindex.value.offset > 4)) {
            this.results.push({
                rng: Linter.rangeOf(zindex.token),
                loc: Linter.rangeOf(zindex.token),
                cod: 'UNDEFINED:ZINDEX:0x75',
                sim: `undefined zindex ${zindex.value.direction}${zindex.value.offset}`,
                fix: [
                    'must be between -4 and +9 (inclusive)',
                    'for default value from collection.nugg, use "+D"',
                    'sign (+ or -) is required',
                ],
                lev: LintSeverity.Error,
            });
        }
    }

    private lintVersionData(data: ParserTypes.RangeOf<ParserTypes.Data>) {
        let last = undefined;
        let lasterr = false;
        for (let i = 0; i < data.value.matrix.length; i++) {
            if (!lasterr && last !== undefined && last !== data.value.matrix[i].value.length) {
                this.results.push({
                    rng: Linter.innerRangeOf(data.value.matrix[i]),
                    loc: Linter.innerRangeOf(data.value.matrix[i]),
                    cod: 'INVALID:ROW:LEN:0x66',
                    sim: 'invalid row length',
                    fix: ['expected row to be length ' + last + ' - instead it is ' + data.value.matrix[i].value.length],
                    lev: LintSeverity.Error,
                });
                lasterr = true;
                break;
            }
            last = data.value.matrix[i].value.length;
        }
    }
    private lintVersionName(name: ParserTypes.RangeOf<string>) {}

    private lintVersionReceivers(recs: ParserTypes.RangeOf<ParserTypes.Receiver>[]) {
        for (let i = 0; i < recs.length; i++) {
            if (this.collection && this.collectionFeatureKeys.indexOf(recs[i].value.feature.value) === -1) {
                this.results.push({
                    rng: Linter.rangeOfLine(recs[i].token),
                    loc: Linter.rangeOf(recs[i].token),
                    cod: 'UNDEFINED:ITEM:NAME:0x72',
                    fix: [`must be one of ` + JSON.stringify(this.collectionFeatureKeys)],
                    sim: `undefined feature name "${recs[i].value.feature.value}"`,
                    lev: LintSeverity['Error'],
                });
            }
            if (recs[i].value.a.value.offset > this.matrixSize.x || recs[i].value.a.value.offset < 1) {
                this.results.push({
                    rng: Linter.rangeOfLine(recs[i].token),
                    loc: Linter.rangeOf(recs[i].token),
                    cod: 'INVALID:RECEIVER:X:0x74',
                    fix: [` must be between 1 and ${this.matrixSize.x} (inclusive)`],
                    sim: `invalid receiver x value "${recs[i].value.a.value.offset}"`,

                    lev: LintSeverity.Error,
                });
            }

            if (recs[i].value.b.value.offset > this.matrixSize.y || recs[i].value.b.value.offset < 1) {
                this.results.push({
                    rng: Linter.rangeOfLine(recs[i].token),
                    loc: Linter.rangeOf(recs[i].token),
                    cod: 'INVALID:RECEIVER:Y:0x75',
                    fix: [`must be between 1 and ${this.matrixSize.y} (inclusive)`],
                    sim: `invalid receiver y value ${recs[i].value.b.value.offset}`,
                    lev: LintSeverity.Error,
                });
            }
        }
    }
    private lintVersionAnchor(anchor: ParserTypes.RangeOf<ParserTypes.Coordinate>, data: ParserTypes.RangeOf<ParserTypes.Data>) {
        if (anchor.value.x.value > this.matrixSize.x || anchor.value.x.value < 1) {
            this.results.push({
                rng: Linter.rangeOfLine(anchor.value.x.token),
                loc: Linter.rangeOf(anchor.value.x.token),
                cod: 'INVALID:ANCHOR:X:0x66',
                sim: `invalid anchor x value ${anchor.value.x.value}`,
                fix: [`must be between 1 and ${this.matrixSize.x} (inclusive)`],
                lev: LintSeverity.Error,
            });
        }

        if (anchor.value.y.value > this.matrixSize.y || anchor.value.y.value < 1) {
            this.results.push({
                rng: Linter.rangeOfLine(anchor.value.y.token),
                loc: Linter.rangeOf(anchor.value.y.token),
                cod: 'INVALID:ANCHOR:Y:0x67',
                sim: `invalid anchor y value ${anchor.value.y.value}`,
                fix: [`must be between 1 and ${this.matrixSize.y} (inclusive)`],
                lev: LintSeverity.Error,
            });
        }
    }
}
