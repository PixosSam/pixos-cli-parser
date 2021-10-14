import { describe, it } from 'mocha';
import expect from 'expect';
import sinon from 'sinon';
import { 
    BooleanCommandParameter,
    CLI, 
    CLICommandHandler, 
    IntCommandEntry, 
    IntCommandParameter, 
    NumberCommandEntry, 
    NumberCommandParameter, 
    StringCommandEntry,
    StringCommandParameter, 
     
} from './index';

describe("CLI Instance", () => {
    it("should instanciate", () => {
        const cli = new CLI({
            commands: []
        });

        expect(cli).toBeTruthy();
    });

    it("should run handler with matching schema", () => {
        const handler = sinon.spy((command: any[]) => {
            expect(command).toEqual(["move", 15]);
        });

        const cli = new CLI({
            commands: [{
                schema: [new StringCommandEntry({ allowedValues: ["move"] }), new IntCommandEntry({ min: 10, max: 20 })],
                handler: handler
            }]
        });

        cli.parse("move 15");
        expect(handler.called).toEqual(true);
    });
    
    it("should throw error on no match", () => {
        const handler: CLICommandHandler = (command: string[]) => {};
        const errorHandler = sinon.spy(() => {});

        const cli = new CLI({
            commands: [{
                schema: [new StringCommandEntry({ allowedValues: ["move"] }), new IntCommandEntry({ min: 10, max: 20 })],
                handler: handler
            }]
        });

        try{
            cli.parse("other 15"); // Fails on string comparison "other"
        }
        catch (err) {
            errorHandler();
        }

        expect(errorHandler.called).toEqual(true);
    });

    it("should run overflow handler if provided instead of throwing error on no match", () => {
        const handler: CLICommandHandler = (command: string[]) => {};
        const errorHandler = sinon.spy((command: string[]) => {});

        const cli = new CLI({
            commands: [{
                schema: [new StringCommandEntry({ allowedValues: ["move"] }), new IntCommandEntry({ min: 10, max: 20 })],
                handler: handler
            }]
        });
        try {
            cli.parse("move 15.5"); // Fails on int check as not whole number
        }
        catch(err){
            errorHandler(err);
        }

        expect(errorHandler.called).toEqual(true);
    });

    it("should match longer schemas first", () => {
        const handler = sinon.spy((command: string[]) => {
            expect(command).toEqual(["move", 15]);
        });
        const secondHandler = sinon.spy((command: string[]) => {
            expect(command).toEqual(["move", "26"]);
        });

        const cli = new CLI({
            commands: [
                {
                    schema: [new StringCommandEntry({ allowedValues: ["move"] }), new IntCommandEntry({ min: 10, max: 20 })],
                    handler: handler
                },
                {
                    schema: [new StringCommandEntry({ allowedValues: ["move"] })],
                    handler: secondHandler
                }
            ]
        });

        cli.parse("move 15");
        expect(handler.called).toEqual(true);
        expect(secondHandler.called).toEqual(false);

        handler.called = false;
        secondHandler.called = false;
        cli.parse("move 26");
        expect(handler.called).toEqual(false);
        expect(secondHandler.called).toEqual(true);
    });

    it("should prioritise child cli instance when both child cli and handler provided on matching schema, but command string has remainder on match", () => {
        const handler = sinon.spy((command: string[]) => {
            expect(command).toEqual(["move"]);
        });
        const secondHandler = sinon.spy((command: string[]) => {
            expect(command).toEqual(["move", 15.5]);
        });
        const noMatchHandler = sinon.spy((err: Error) => {});

        const cli = new CLI({
            commands: [
                {
                    schema: [new StringCommandEntry({ allowedValues: ["move"] })],
                    handler: handler,
                    childCLI: new CLI({
                        commands: [
                            {
                                schema: [new NumberCommandEntry({ min: 10, max: 20 })],
                                handler: secondHandler
                            }
                        ]
                    })
                }
            ]
        });

        try {
            cli.parse("move");
        }
        catch(err){
            noMatchHandler(err);
        }
        expect(handler.called).toEqual(true);
        expect(secondHandler.called).toEqual(false);
        expect(noMatchHandler.called).toEqual(false);

        handler.called = false;
        secondHandler.called = false;
        noMatchHandler.called = false;
        try {
            cli.parse("move 15.5");
        }
        catch(err){
            noMatchHandler(err);
        }
        expect(handler.called).toEqual(false);
        expect(secondHandler.called).toEqual(true);
        expect(noMatchHandler.called).toEqual(false);

        handler.called = false;
        secondHandler.called = false;
        noMatchHandler.called = false;
        try {
            cli.parse("move 26");
        }
        catch(err){
            noMatchHandler(err);
        }
        expect(handler.called).toEqual(false);
        expect(secondHandler.called).toEqual(false);
        expect(noMatchHandler.called).toEqual(true);
    });
});

describe("CLI Entries", () => {
    it("should successfully parse a string", () => {
        const handler = sinon.spy((command: any[]) => {
            expect(command).toEqual(["test"]);
        });
        
        const cli = new CLI({
            commands: [
                {
                    schema: [new StringCommandEntry({ allowedValues: ["test"] })],
                    handler: handler
                }
            ]
        });

        cli.parse("test");
        expect(handler.called).toEqual(true);
    });

    it("should successfully parse a number", () => {
        const handler = sinon.spy((command: any[]) => {
            expect(command).toEqual([30.5]);
        });
        
        const cli = new CLI({
            commands: [
                {
                    schema: [new NumberCommandEntry({ min: 20, max: 40 })],
                    handler: handler
                }
            ]
        });

        cli.parse("30.5");
        expect(handler.called).toEqual(true);
    });

    it("should successfully parse a int", () => {
        const handler = sinon.spy((command: any[]) => {
            expect(command).toEqual([30]);
        });
        
        const cli = new CLI({
            commands: [
                {
                    schema: [new IntCommandEntry({ min: 20, max: 40 })],
                    handler: handler
                }
            ]
        });

        cli.parse("30");
        expect(handler.called).toEqual(true);
    });

    it("should fail to parse a string", () => {
        const errorHandler = sinon.spy((err: Error) => {});
        
        const cli = new CLI({
            commands: [
                {
                    schema: [new StringCommandEntry({ allowedValues: ["test"] })]
                }
            ]
        });

        try {
            cli.parse("30");
        }
        catch(err) {
            errorHandler(err);
        }
        expect(errorHandler.called).toEqual(true);
    });

    it("should fail to parse a number", () => {
        const errorHandler = sinon.spy((err: Error) => {});
        
        const cli = new CLI({
            commands: [
                {
                    schema: [new NumberCommandEntry({ })]
                }
            ]
        });

        try{
            cli.parse("test");
        }
        catch(err){
            errorHandler(err);
        }
        expect(errorHandler.called).toEqual(true);
    });

    it("should fail to parse a int", () => {
        it("should fail to parse a number", () => {
            const errorHandler = sinon.spy((command: string[]) => {});
            
            const cli = new CLI({
                commands: [
                    {
                        schema: [new IntCommandEntry({ })]
                    }
                ]
            });
    
            try{
                cli.parse("20.2");
            }
            catch(err){
                errorHandler(err);
            }
            expect(errorHandler.called).toEqual(true);
        });
    });
});

describe("CLI Parameters", () => {
    it("should process an optional boolean parameter if it exists", () => {
        const handler = sinon.spy((command: string[], parameters: { [name:string]: any }) => {
            expect(command).toEqual(["test"]);
            expect(parameters).toEqual({ "active": true });
        });
        
        const cli = new CLI({
            commands: [
                {
                    schema: [new StringCommandEntry({ allowedValues: ["test"] })],
                    parameters: [new BooleanCommandParameter("active", "a")],
                    handler: handler
                }
            ]
        });

        ["test --active", "test -a", "test --active=true", "test -a=true"].forEach(s => {
            handler.called = false;
            cli.parse(s);
            expect(handler.called).toEqual(true);
        });
    });

    it("should process an optional string parameter if it exists", () => {
        [
            { c: "test --tag=\"This is some text\"", t: "This is some text" }, 
            { c: "test -t=test", t: "test" },
            { c: "test --tag", t: "true" },  
            { c: "test -t", t: "true" }
        ].forEach(o => {
            const handler = sinon.spy((command: string[], parameters: { [name:string]: any }) => {
                expect(command).toEqual(["test"]);
                expect(parameters).toEqual({ "tag": o.t });
            });

            const cli = new CLI({
                commands: [
                    {
                        schema: [new StringCommandEntry({ allowedValues: ["test"] })],
                        parameters: [new StringCommandParameter("tag", "t")],
                        handler: handler
                    }
                ]
            });

            cli.parse(o.c);
            expect(handler.called).toEqual(true);
        });
    });

    it("should process an optional number parameter if it exists", () => {
        const handler = sinon.spy((command: string[], parameters: { [name:string]: any }) => {
            expect(command).toEqual(["test"]);
            expect(parameters).toEqual({ "num": 23.5 });
        });

        const errorHandler = sinon.spy(err => {
            expect(err.message).toEqual("--num must be a number");
        });
        
        const cli = new CLI({
            commands: [
                {
                    schema: [new StringCommandEntry({ allowedValues: ["test"] })],
                    parameters: [new NumberCommandParameter("num", "n")],
                    handler: handler
                }
            ]
        });

        ["test --num=\"23.5\"", "test -n=23.5"].forEach(s => {
            handler.called = false;
            cli.parse(s);
            expect(handler.called).toEqual(true);
        });

        try{
            cli.parse("test --num=\"Test text\"");
        }
        catch(err){
            errorHandler(err);
        }

        expect(errorHandler.called).toEqual(true);
    });

    it("should process an optional int parameter if it exists", () => {
        const handler = sinon.spy((command: string[], parameters: { [name:string]: any }) => {
            expect(command).toEqual(["test"]);
            if(parameters.num)
                expect(parameters.num).toEqual(23);
            else
                expect(parameters).toEqual({});
        });

        const errorHandler = sinon.spy(err => {
            expect(err.message).toEqual("--num must be an integer");
        });
        
        const cli = new CLI({
            commands: [
                {
                    schema: [new StringCommandEntry({ allowedValues: ["test"] })],
                    parameters: [new IntCommandParameter("num", "n")],
                    handler: handler
                }
            ]
        });

        ["test --num=\"23\"", "test -n=23"].forEach(s => {
            handler.called = false;
            cli.parse(s);
            expect(handler.called).toEqual(true);
        });

        try{
            cli.parse("test --num=23.5");
        }
        catch(err){
            errorHandler(err);
        }
        
        expect(errorHandler.called).toEqual(true);

        errorHandler.called = false;
        try{
            console.log("CALLING");
            cli.parse("test");
        }
        catch(err){
            errorHandler(err);
        }
        
        expect(errorHandler.called).toEqual(false);
    });

    it("should process a string parameter that passes validation");

    it("should fail with a required parameter missing");
    it("should fail parameter validation");
    it("should pass validation via a custom parameter validation handler");
    it("should fail validation via a custom parameter validation handler");
});