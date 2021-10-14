import { ICommandEntry, CommandEntryParseResult } from "./command-entry";

export type NumberCommandEntryOptions = {
    min?: number,
    max?: number,
    allowedValues?: number[]
};

export class NumberCommandEntry implements ICommandEntry<number> {
    constructor(private numberOptions: NumberCommandEntryOptions) {}

    parse(input: string): CommandEntryParseResult<number> {
        const num = Number(input);
        if(!num || isNaN(num)) {
            //throw new Error("Provided value is not a valid number");
            return { success: false };
        }

        if(this.numberOptions.allowedValues && !this.numberOptions.allowedValues.includes(num))
            return { success: false };

        if(this.numberOptions.min !== undefined && this.numberOptions.min !== null && !isNaN(this.numberOptions.min) && num < this.numberOptions.min) {
            //throw new Error(`Provided value is less than minimum (${this.numberOptions.min.toString()})`);
            return { success: false };
        }

        if(this.numberOptions.max !== undefined && this.numberOptions.max !== null && !isNaN(this.numberOptions.max) && num > this.numberOptions.max) {
            //throw new Error(`Provided value is more than maximum (${this.intOptions.max.toString()})`);
            return { success: false };
        }

        return { success: true, value: num };
    }
}