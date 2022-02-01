export class Validator {
    private _values: { [_: string]: any } = {};

    public get hasAnyUndefined() {
        return this.undefinedVarNames.length > 0;
    }

    public static isBroadlyUndefined(value: any) {
        return value === undefined || (Array.isArray(value) ? value.length === 0 : false) || JSON.stringify(value) === '{}';
    }

    public get undefinedVarNames() {
        const obj = this._values;
        return Object.keys(obj).filter((x): any => Validator.isBroadlyUndefined(obj[x]));
    }

    public get complete() {
        return !this.hasAnyUndefined;
    }

    public static anyUndefined(args: object) {
        const tmp = new Validator(args);
        return tmp.hasAnyUndefined;
    }

    constructor(args: object) {
        this.add(args);
    }

    public add(args: object) {
        this._values = { ...this._values, ...args };
    }
}
