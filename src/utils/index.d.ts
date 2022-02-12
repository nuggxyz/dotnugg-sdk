declare module 'color-parse' {
    export default function parse(input: string): {
        space: 'rgb' | string;
        values: number[];
        alpha: number;
    };
}
