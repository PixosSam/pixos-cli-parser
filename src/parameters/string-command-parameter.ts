import { CommandParameter, CommandParameterOptions } from "./command-parameter";

export type StringCommandParameterOptions = {} & CommandParameterOptions;

export class StringCommandParameter extends CommandParameter {
    constructor(name: string, shortName: string, options?: StringCommandParameterOptions){
        super(name, shortName, options);
    }

    extract(parameters: { [key: string]: string }): string | null {
        let value = super.extract(parameters);
        if(value === undefined)
            return null;

        return value;
    }

    validate(value: string | null | undefined) {
        super.validate(value);
    }
}
