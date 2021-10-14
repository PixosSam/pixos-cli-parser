import { ICommandEntry, CommandEntryParseResult } from "./command-entry";

export type StringCommandEntryOptions = {
    allowedValues?: string[],
    caseSensitive?: boolean,
    regex?: RegExp,
    minLength?: number,
    maxLength?: number
};

export class StringCommandEntry implements ICommandEntry<string> {
    constructor(private stringOptions: StringCommandEntryOptions) {}

    parse(input: string): CommandEntryParseResult<string> {
        if(this.stringOptions.allowedValues){
            if(this.stringOptions.caseSensitive === true && this.stringOptions.allowedValues.findIndex(v => v === input) === -1)
                return { success: false };
            else if(!this.stringOptions.caseSensitive && this.stringOptions.allowedValues.findIndex(v => v.toLowerCase() === input.toLowerCase()) === -1)
                return { success: false };
        }
        
        if(this.stringOptions.regex && !this.stringOptions.regex.test(input)) {
            //throw new Error(`Invalid value '${input}', must conform to format /${this.stringOptions.regex.source}/${this.stringOptions.regex.flags}`);
            return { success: false };
        }

        if(this.stringOptions.minLength !== undefined && this.stringOptions.minLength !== null && !isNaN(this.stringOptions.minLength) && input.length < this.stringOptions.minLength) {
            //throw new Error(`Provided value length is less than minimum (${this.stringOptions.minLength.toString()})`);
            return { success: false };
        }

        if(this.stringOptions.maxLength !== undefined && this.stringOptions.maxLength !== null && !isNaN(this.stringOptions.maxLength) && input.length > this.stringOptions.maxLength) {
            //throw new Error(`Provided value length is more than maximum (${this.stringOptions.maxLength.toString()})`);
            return { success: false };
        }

        return { success: true, value: input };
    }
}