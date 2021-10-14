import { ICommandEntry, CommandEntryParseResult } from "./command-entry";

export class BooleanCommandEntry implements ICommandEntry<boolean> {
    parse(input: string): CommandEntryParseResult<boolean> {
        const lower = input.toLowerCase();
        const result = {
            "true": true,
            "false": false
        }[lower];

        if(result === undefined) {
            return { success: false };
        }

        return { success: true, value: result };
    }
}