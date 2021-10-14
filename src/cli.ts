import { ICommandEntry } from "./entries/command-entry";
import { CommandParameter } from "./parameters/command-parameter";

export type CLIOptions = {
    commands: CLICommand[]
}

export type CLICommand = {
    schema: ICommandEntry<any>[],
    parameters?: CommandParameter[],
    handler?: CLICommandHandler,
    childCLI?: CLI
}

export type CLICommandHandlerParameters = { [name:string]: any };

export type CLICommandHandler = (command: string[], parameters: CLICommandHandlerParameters) => void;

export class CLI {
    constructor(private options: CLIOptions){}

    parse(commandString: string, commandParseOptions?: { context?: { parsed: any[], remainder: string[], parentParameters: CLICommandHandlerParameters } }){
        if(!commandString)
            throw new Error("Command empty");

        // Extract parameters before parsing command string
        let {
            extractedCommandString,
            parameters
        } = this.extractParameters(commandString);

        const originalSplit = extractedCommandString.trim().split(" ").filter(s => !!s);
        let split: string[] | null = null;
        if(commandParseOptions?.context) {
            split = commandParseOptions.context.remainder;
        }
        else {
            split = [...originalSplit];
        }

        if(extractedCommandString.length === 0)
            throw new Error("Command Empty");

        if(!this.options.commands)
            return;

        // Match commands that have a schema the same length as the split command string
        // Then iterate over schemas that have one less and so on until there is a match
        // Once a match is found pass in the remainder of the command string 
        // Example:
        // input: test 1 2 3
        // Would match [{entry matching test}, {entry matching int}, {entry matching int}, {entry matching int}]
        // And would pass null to handler or child CLI provided
        // If this schema did not exist then could match on
        // This would match [{entry matching test}, {entry matching int}]
        // And pass "2 3" into the handler or child cli
        // If a child cli and handler are provided to the command
        // Then the child cli will be used if there is any remainder of the command string
        // If not then the handler will be called with null

        let longestSchemaCount = 0;
        for(const command of this.options.commands){
            if(command.schema && command.schema.length > longestSchemaCount) {
                longestSchemaCount = command.schema.length;
            }
        }

        // Revert schema count to max the length of the command string
        if(longestSchemaCount > split.length) {
            longestSchemaCount = split.length;
        }

        for(let i = longestSchemaCount; i > 0; i--){
            const commandsAtSchemaLength = this.options.commands.filter(c => c.schema.length === i);
            if(commandsAtSchemaLength.length === 0) {
                continue;
            }

            for(const command of commandsAtSchemaLength){
                let isMatch = true;

                const parsedValues = [];
                for(let j = 0; j < i; j++){
                    const res = command.schema[j].parse(split[j]);
                    if(res.success){
                        parsedValues.push(res.value);
                    }
                    else {
                        isMatch = false;
                        break;
                    }
                }
                
                if(isMatch){
                    // Match
                    let parsedParameters = this.parseParameters(parameters, command.parameters || []);
                    if(commandParseOptions?.context?.parentParameters) {
                        parsedParameters = {...commandParseOptions.context.parentParameters, ...parameters};
                    }
                    
                    
                    let remainder: string[] | null = [...split];
                    for(let j = 0; j < i; j++){
                        remainder.shift();
                    }

                    let parsed: any[] = [];
                    if(commandParseOptions?.context) {
                        parsed = [...commandParseOptions.context.parsed, ...parsedValues];
                    }
                    else {
                        parsed = [...parsedValues]
                    }

                    if(command.childCLI && split.length > command.schema.length) {
                        command.childCLI.parse(extractedCommandString, { context: { parsed, remainder, parentParameters: parsedParameters } });
                    }
                    else if(command.handler) {
                        const finalResult = [...parsed, ...remainder]
                        command.handler(finalResult, parsedParameters);
                    }

                    return;
                }
            }
        }

        // No match found
        throw new Error("No matching command found");
    }

    private extractParameters(commandString: string): { extractedCommandString: string, parameters: { [name: string]: string } }
    {
        const removeDashes = (input: string) => {
            let result = "";
            if(input.startsWith("--"))
                result = input.replace("--", "");
            else
                result = input.replace("-", "");

            return result;
        };
        const extractName = (input: string) => {
            const nameMatch = input.match(/[^=]+/);
            const name = nameMatch && nameMatch.length > 0 ? nameMatch[0] : "";
            return name;
        };

        let extractedCommandString = commandString;
        const parameters: { [name: string]: string } = {};

        // Find all quoted params /(?<= )(--|-)[^=]+=".*?"(?=( |$))/g eg --test2="This is a value with spacing"
        const reg1 = /(?<= )(--|-)[^=]+=".*?"(?=( |$))/g;
        const matches = extractedCommandString.match(reg1);
        if(matches) {
            for(const match of matches) {
                let primed = removeDashes(match);
                let name = extractName(primed);

                primed = primed.replace(`${name}="`, "");
                const value = primed.substr(0, primed.length - 1);
                parameters[name] = value;
            }
        }
        extractedCommandString = extractedCommandString.replace(reg1, "");

        // Then find all non quoted params /(?<= )(--|-)[^=]+=.+?(?=( |$))/g eg --test=testing -p=3
        const reg2 = /(?<= )(--|-)[^=]+=.+?(?=( |$))/g;
        const matches2 = extractedCommandString.match(reg2);
        if(matches2) {
            for(const match of matches2) {
                let primed = removeDashes(match);
                let name = extractName(primed);

                primed = primed.replace(`${name}=`, "");
                parameters[name] = primed;
            }
        }
        extractedCommandString = extractedCommandString.replace(reg2, "");

        // Then find boolean params /(?<= )(--|-)[^=]+?(?=( |$))/g eg --test -t
        const reg3 = /(?<= )(--|-)[^=]+?(?=( |$))/g;
        const matches3 = extractedCommandString.match(reg3);
        if(matches3) {
            for(const match of matches3) {
                let name = removeDashes(match);

                parameters[name] = "true";
            }
        }
        extractedCommandString = extractedCommandString.replace(reg3, "");

        extractedCommandString = extractedCommandString.split(" ").filter(s => !!s).join(" ");

        return {
            extractedCommandString,
            parameters
        };
    }

    private parseParameters(parameters: { [name: string]: string }, commandParameters: CommandParameter[]): { [name: string]: any } 
    {
        const result: { [name: string]: any } = {};
        for(let param of commandParameters) {
            const value = param.extract(parameters);
            param.validate(value);
            if(value !== null)
                result[param.name] = value;
        }

        return result;
    }
}