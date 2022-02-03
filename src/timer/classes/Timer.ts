import { Dictionary } from '../../builder/types/BuilderTypes';

export class Timer {
    private _start: Date;
    private _hrstart: [number, number];

    private _end: Date;
    private _hrend: [number, number];

    private _name: string;

    private static _map: Dictionary<Timer> = {};

    private constructor() {}

    public static start(name: string) {
        let me = new Timer();
        me._start = new Date();
        me._hrstart = process.hrtime();
        me._name = name;
        Timer._map[name] = me;
    }

    public static stop(name: string) {
        let me = Timer._map[name];
        me._end = new Date();
        me._hrend = process.hrtime(me._hrstart);
        me.calc();
    }

    public calc() {
        const dtime = this._end.getTime() - this._start.getTime();
        console.log(`=========== time for ${this._name} ============`);
        console.info('Execution time: %dms', dtime);
        console.info('Execution time (hr): %ds %dms', this._hrend[0], this._hrend[1] / 1000000);
        console.log('===============================================');
    }
}
