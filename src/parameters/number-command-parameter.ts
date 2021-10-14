import { CommandParameter, CommandParameterOptions } from "./command-parameter";

export type NumberCommandParameterOptions = {} & CommandParameterOptions<number>;

export class NumberCommandParameter extends CommandParameter {
    constructor(name: string, shortName: string, options?: NumberCommandParameterOptions){
        super(name, shortName, options);
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

        return num;
    }

    validate(value: number | null | undefined) {
        super.validate(value);
    }
}