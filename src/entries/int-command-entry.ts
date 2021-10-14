import { CommandEntryParseResult } from "./command-entry";
import { NumberCommandEntry, NumberCommandEntryOptions } from "./number-command-entry";

export type IntCommandEntryOptions = NumberCommandEntryOptions;

export class IntCommandEntry extends NumberCommandEntry {
    constructor(private intOptions: IntCommandEntryOptions) {
        super(intOptions);
    }

    parse(input: string): CommandEntryParseResult<number> {
        const superParseRes = super.parse(input);
        if(!superParseRes.success)
            return superParseRes;

        if(!Number.isInteger(superParseRes.value))
            return { success: false };

        return superParseRes;
    }
}