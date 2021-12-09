export const BOXA = '█';
export const BOXB = '▓';
export const BOXC = '▒';
export const BOXD = '░';

export const Reset = '\x1B[0m';
export const Red = '\x1B[31m';
export const Green = '\x1B[32m';
export const Yellow = '\x1B[33m';
export const Blue = '\x1B[34m';
export const Purple = '\x1B[35m';
export const Cyan = '\x1B[36m';
export const Gray = '\x1B[37m';
export const White = '\x1B[97m';

export const colorLookup: { [_: number]: string } = [
    ' ',
    Green + BOXA + Reset,
    Yellow + BOXA + Reset,
    Blue + BOXA + Reset,
    Cyan + BOXA + Reset,
    Purple + BOXA + Reset,
    Gray + BOXA + Reset,
    Red + BOXA + Reset,
    White + BOXA + Reset,
    Green + BOXB + Reset,
    Yellow + BOXB + Reset,
    Blue + BOXB + Reset,
    Cyan + BOXB + Reset,
    Purple + BOXB + Reset,
    Gray + BOXB + Reset,
    Red + BOXB + Reset,
    White + BOXB + Reset,
    Green + BOXC + Reset,
    Yellow + BOXC + Reset,
    Blue + BOXC + Reset,
    Cyan + BOXC + Reset,
    Purple + BOXC + Reset,
    Gray + BOXC + Reset,
    Red + BOXC + Reset,
    White + BOXC + Reset,
    Green + BOXD + Reset,
    Yellow + BOXD + Reset,
    Blue + BOXD + Reset,
    Cyan + BOXD + Reset,
    Purple + BOXD + Reset,
    Gray + BOXD + Reset,
    Red + BOXD + Reset,
    White + BOXD + Reset,
];
