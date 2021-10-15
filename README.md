# Pixos CLI Parser
An opinionated CLI parser with built in validation.

The aim of this project was to create a declarative CLI parser where the CLI schema, operation tree and validation are declared up front in a single CLI object without the need for further CLI parsing logic after running CLI.parse().

## Basic Concept
A CLI object is defined with a number of commands, each command must have a schema of command entries defined and optionally a list of parameters. Each command entry and parameter is an instance of a typed entry or paramter with its own options for definition and validation.

## Basic Usage
```typescript
const cli = new CLI({
    commands: [
        {
            schema: [new StringCommandEntry({ allowedValues: ["moveleft"] }), new IntCommandEntry({ min: 10, max: 20, required: true })],
            handler: (command, parameters) => {
                console.log(command); // ["moveleft", 15]
                console.log(parameters); // {}
            }
        },
        {
            schema: [new StringCommandEntry({ allowedValues: ["moveright"] })],
            parameters: [new IntCommandParameter("distance", "d", { min: 10, max: 20, required: true })],
            handler: (command, parameters) => {
                console.log(command); // ["moveright"]
                console.log(parameters); // { "distance": 16 }
            }
        }
    ]
});

try {
    cli.parse("moveleft 15");
    cli.parse("moveright --distance=16");
    cli.parse(["moveright", "-d=10"]);
    var myArgs = process.argv.slice(2);
    cli.parse(myArgs);
}
catch(err){
    console.error(err);
    process.exit(1);
}
```

## ChildCLI
Logic for different commands that share a parent command can be specified using the childCLI property on a command, this allows declaration of a "tree" of functionality to allow handlers to be written purely for their use case.

The decision of whether to run a childCLI or the current scopes handler is dictated by the closes match on schema commands not parameters. Parameters that need to be passed into a child handler must be explicitly defined in that command as they are not processed by the parent before moving to the child.

```typescript

const cli = new CLI({
    commands: [
        {
            schema: [new StringCommandEntry({ allowedValues: ["move"] })],
            handler: handler,
            childCLI: new CLI({
                commands: [
                    {
                        schema: [new NumberCommandEntry({ min: 10, max: 20 })],
                        handler: childHandler
                    }
                ]
            })
        }
    ]
});

try {
    cli.parse("move"); // Will call handler
    cli.parse("move 10"); // Will call childHandler with command parmeter ["move", 10]
}
catch(err){
    console.error(err);
    process.exit(1);
}
```

See cli.spec.ts for more examples