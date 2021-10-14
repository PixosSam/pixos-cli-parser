import { CommandParameter, CommandParameterOptions } from "./command-parameter";

export type BooleanCommandParameterOptions = {} & CommandParameterOptions;

export class BooleanCommandParameter extends CommandParameter {
    constructor(name: string, shortName: string, options?: BooleanCommandParameterOptions){
        super(name, shortName, options);
    }

    extract(parameters: { [key: string]: string }): boolean | null {
        let value = super.extract(parameters);
        if(value === null || value === undefined)
            return null;

        value = value.toLowerCase();

        if(["", "true"].indexOf(value) !== -1)
            return true;

        if(value === "false")
            return false;

        return null;
    }

    validate(value: boolean | null | undefined) {
        super.validate(value);
    }
}