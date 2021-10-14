import { CommandParameter, CommandParameterOptions } from "./command-parameter";

export type StringCommandParameterOptions = {
    regex?: RegExp
} & CommandParameterOptions<string>;

export class StringCommandParameter extends CommandParameter {
    private regex: RegExp | null = null;

    constructor(name: string, shortName: string, options?: StringCommandParameterOptions) {
        super(name, shortName, options);

        if(options?.regex) {
            this.regex = options.regex;
        }
    }

    extract(parameters: { [key: string]: string }): string | null {
        let value = super.extract(parameters);
        if(value === undefined)
            return null;

        return value;
    }

    validate(value: string | null | undefined) {
        super.validate(value);

        if(this.regex && value !== null && value !== undefined && !this.regex.test(value)) {
            throw new Error(this.options?.errorMessage || `--${this.name} must match regex ${this.regex}`);
        }
    }
}
