import * as fs from 'fs';

import { Item, ParsedToken, RangeOf } from '../../parser/types/ParserTypes';

type Range = {
    start: number;
    end: number;
    lineNumber: number;
};

export class Injector {
    public static injectRange(file: string, replacement: string | number, range: Range) {
        var data = fs.readFileSync(file).toString().split('\n');
        let line = data[range.lineNumber];
        data[range.lineNumber] = line.substring(0, range.start) + replacement + line.substring(range.end + 1);
        var text = data.join('\n');

        fs.writeFileSync(file, text);
    }

    public static injectParserRange(file: string, replacement: string | number, token: ParsedToken) {
        var data = fs.readFileSync(file).toString().split('\n');
        let line = data[token.lineNumber];
        console.log({ data, line });

        data[token.lineNumber] = line.substring(0, token.token.startIndex) + replacement + line.substring(token.token.endIndex);
        var text = data.join('\n');

        fs.writeFileSync(file, text);
    }

    public static injectFeatureType(item: RangeOf<Item>, rep: string) {
        this.injectParserRange(item.value.fileUri, rep, item.value.feature.token);
    }

    public static injectAnchorX(item: RangeOf<Item>, rep: number) {
        console.log(item.value.versions.value[0].value.anchor.value.x.token);
        this.injectParserRange(item.value.fileUri, rep, item.value.versions.value[0].value.anchor.value.x.token);
    }

    public static injectAnchorY(item: RangeOf<Item>, rep: number) {
        console.log(item.value.versions.value[0].value.anchor.value.x.token);

        this.injectParserRange(item.value.fileUri, rep, item.value.versions.value[0].value.anchor.value.y.token);
    }
}
