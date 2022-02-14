import * as inv from 'tiny-invariant';
import colorParse from 'color-parse';

export const randIntBetween = (max: number) => {
    inv.default(max <= 1000000, 'RANDBETWEEN:TOBIG');
    return Math.floor(Math.random() * 1000000) % max;
};

export const parseColor = (
    input: string,
    fatal: boolean = true,
): [
    boolean,
    string,
    {
        r: number;
        g: number;
        b: number;
        a: number;
    },
] => {
    let res = colorParse(input);

    inv.default(res.space === 'rgb', "color must be have 'rgb' space - found: " + JSON.stringify(res));

    if (res.alpha <= 1 && res.alpha !== 0) {
        res.alpha = Math.round(res.alpha * 255);
    }

    let [err, dat] = invariant(Math.round(res.alpha) === res.alpha && res.alpha >= 0 && res.alpha <= 255, fatal, [
        'INVALID:ALPHA - must resolve to uint8 - found',
        res.alpha,
    ]);

    if (!fatal && err) return [true, dat, undefined];

    return [
        false,
        '',
        {
            r: res.values[0],
            g: res.values[1],
            b: res.values[2],
            a: res.alpha,
        },
    ];
};

export const invariant = (check: boolean, fatal: boolean, data: (number | string)[]): [boolean, string] => {
    if (!check) {
        if (fatal) {
            inv.default(false, data.join(' : '));
        } else {
            return [true, ''];
        }
    }
    return [false, ''];
};

export const invariantNonFatal = (check: boolean, data: (number | string)[]): [boolean, string] => {
    return invariant(check, false, data);
};

export const invariantFatal = (check: boolean, data: (number | string)[]) => {
    invariant(check, true, data);
};
