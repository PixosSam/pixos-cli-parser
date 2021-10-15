import { CommandParameter, CommandParameterOptions } from "./command-parameter";

export type NumberCommandParameterOptions = {
    min: number,
    max: number
} & CommandParameterOptions<number>;

export class NumberCommandParameter extends CommandParameter {

    private min: number | null;
    private max: number | null;

    constructor(name: string, shortName: string, options?: NumberCommandParameterOptions){
        super(name, shortName, options);
        this.min = options?.min || null;
        this.max = options?.max || null;
    }

    extract(parameters: { [key: string]: string }): number | null {
        let value = super.extract(parameters);
        if(value === null || value === undefined || value === "")
            return null;

        const num = Number(value);
        if(num === 0)
            return 0;

        if(!num || isNaN(num))
            throw new Error(this.options?.errorMessage || `--${this.name} must be a number`);

        if(this.min !== undefined && this.min !== null && !isNaN(this.min) && num < this.min) {
            throw new Error(this.options?.errorMessage || `--${this.name} must be no less than ${this.min}`);
        }

        if(this.max !== undefined && this.max !== null && !isNaN(this.max) && num > this.max) {
            throw new Error(this.options?.errorMessage || `--${this.name} must be no greater than ${this.max}`);
        }

        return num;
    }

    validate(value: number | null | undefined) {
        super.validate(value);
    }
}