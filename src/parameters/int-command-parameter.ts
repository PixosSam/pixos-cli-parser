import { NumberCommandParameter, NumberCommandParameterOptions } from "./number-command-parameter";

export type IntCommandParameterOptions = {} & NumberCommandParameterOptions;

export class IntCommandParameter extends NumberCommandParameter {
    constructor(name: string, shortName: string, options?: IntCommandParameterOptions){
        super(name, shortName, options);
    }

    extract(parameters: { [key: string]: string }): number | null {
        return super.extract(parameters);
    }

    validate(value: number | null | undefined) {
        super.validate(value);

        if(value !== null && value !== undefined && !Number.isInteger(value))
            throw new Error(this.options?.errorMessage || `--${this.name} must be an integer`);
    }
}