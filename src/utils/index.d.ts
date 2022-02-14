declare module 'color-parse' {
    export default function (input: string): {
        space: 'rgb' | string;
        values: number[];
        alpha: number;
    };
}
