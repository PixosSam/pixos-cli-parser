import { describe, it } from 'mocha';
import expect from 'expect';
import sinon, { assert } from 'sinon';
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
        const handler = sinon.spy((command: any[]) => {
            expect(command).toEqual(["move", 15]);
        });
        const secondHandler = sinon.spy((command: any[]) => {
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
        const handler = sinon.spy((command: any[]) => {
            expect(command).toEqual(["move"]);
        });
        const secondHandler = sinon.spy((command: any[]) => {
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
            if(parameters.num)
                expect(parameters).toEqual({ "num": 23.5 });
            else
                expect(parameters).toEqual({});
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

        errorHandler.called = false;
        try{
            cli.parse("test");
        }
        catch(err){
            errorHandler(err);
        }
        
        expect(errorHandler.called).toEqual(false);
    });

    it("should process an optional int parameter if it exists", () => {
        const handler = sinon.spy((command: string[], parameters: { [name:string]: any }) => {
            expect(command).toEqual(["test"]);
            if(parameters.num)
                expect(parameters).toEqual({ "num": 23 });
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
            cli.parse("test");
        }
        catch(err){
            errorHandler(err);
        }
        
        expect(errorHandler.called).toEqual(false);
    });

    it("should parse number with min/max", () => {
        const handler = sinon.spy((command: string[], parameters: { [name:string]: any }) => {
            expect(command).toEqual(["test"]);
            expect(parameters).toEqual({ "num": 23.5 });
        });
        
        const cli = new CLI({
            commands: [
                {
                    schema: [new StringCommandEntry({ allowedValues: ["test"] })],
                    parameters: [new NumberCommandParameter("num", "n", { min: 22, max: 24 })],
                    handler: handler
                }
            ]
        });

        const errorHandler = sinon.spy(err => {
            console.error(err);
            assert.fail("Error handler should not have been called");
        });

        try{
            ["test --num=\"23.5\"", "test -n=23.5"].forEach(s => {
                handler.called = false;
                cli.parse(s);
                expect(handler.called).toEqual(true);
            });
        }
        catch(err){
            errorHandler(err);
        }
        
        expect(errorHandler.called).toEqual(false);
    })

    it("should fail to parse number with min/max", () => {
        const handler = sinon.spy((command: string[], parameters: { [name:string]: any }) => {
            assert.fail("Handler should not have been called");
        });
        
        const cli = new CLI({
            commands: [
                {
                    schema: [new StringCommandEntry({ allowedValues: ["test"] })],
                    parameters: [new NumberCommandParameter("num", "n", { min: 22, max: 24 })],
                    handler: handler
                }
            ]
        });

        const errorHandler = sinon.spy(err => {
            expect(err.message).toEqual("--num must be no less than 22");
        });

        const errorHandler2 = sinon.spy(err => {
            expect(err.message).toEqual("--num must be no greater than 24");
        });

        try{
            cli.parse("test --num=21");
            expect(handler.called).toEqual(false);
        }
        catch(err){
            errorHandler(err);
        }
        expect(errorHandler.called).toEqual(true);
        
        try{
            cli.parse("test -n=25");
            expect(handler.called).toEqual(false);
        }
        catch(err){
            errorHandler2(err);
        }
        expect(errorHandler2.called).toEqual(true);
    });

    it("should process a string parameter with regex validation", () => {
        const handler = sinon.spy((command: string[], parameters: { [name:string]: any }) => {
            expect(command).toEqual(["test"]);
            if(parameters.val)
                expect(parameters).toEqual({ "val": "123" });
            else
                expect(parameters).toEqual({});
        });

        const errorHandler = sinon.spy(err => {
            expect(err.message).toEqual("--val must match regex /123/");
        });
        
        const cli = new CLI({
            commands: [
                {
                    schema: [new StringCommandEntry({ allowedValues: ["test"] })],
                    parameters: [new StringCommandParameter("val", "v", {
                        regex: /123/
                    })],
                    handler: handler
                }
            ]
        });

        ["test --val=\"123\"", "test -v=123"].forEach(s => {
            handler.called = false;
            cli.parse(s);
            expect(handler.called).toEqual(true);
        });

        try{
            cli.parse("test --val=\"124\"");
        }
        catch(err){
            errorHandler(err);
        }
        
        expect(errorHandler.called).toEqual(true);
    });

    it("should fail with a required parameter missing", () => {
        const handler = sinon.spy((command: string[], parameters: { [name:string]: any }) => {
            if(parameters.val)
                expect(parameters).toEqual({ val: "123" });
            else
                assert.fail("Match handler should not have been called");
        });

        const errorHandler = sinon.spy(err => {
            expect(err.message).toEqual("--val is required for this command");
        });
        
        const cli = new CLI({
            commands: [
                {
                    schema: [new StringCommandEntry({ allowedValues: ["test"] })],
                    parameters: [new StringCommandParameter("val", "v", {
                        required: true
                    })],
                    handler: handler
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

        errorHandler.called = false;
        try{
            cli.parse("test --val=123");
        }
        catch(err){
            errorHandler(err);
        }
        
        expect(errorHandler.called).toEqual(false);
    });

    it("should pass validation via a custom parameter validation handler", () => {
        const handler = sinon.spy((command: string[], parameters: { [name:string]: any }) => {
            expect(parameters).toEqual({ val: "123" });
        });

        const errorHandler = sinon.spy(err => {
            assert.fail("Error handler should not have been called");
        });
        
        const cli = new CLI({
            commands: [
                {
                    schema: [new StringCommandEntry({ allowedValues: ["test"] })],
                    parameters: [new StringCommandParameter("val", "v", {
                        required: true,
                        customValidation: (val) => val === "123"
                    })],
                    handler: handler
                }
            ]
        });

        try{
            cli.parse("test --val=123");
        }
        catch(err){
            errorHandler(err);
        }
        
        expect(handler.called).toEqual(true);
        expect(errorHandler.called).toEqual(false);
    });

    it("should fail validation via a custom parameter validation handler", () => {
        const handler = sinon.spy((command: string[], parameters: { [name:string]: any }) => {
            assert.fail("Handler should not have been called");
        });

        const errorHandler = sinon.spy(err => {
            expect(err.message).toEqual("--val is invalid");
        });
        
        const cli = new CLI({
            commands: [
                {
                    schema: [new StringCommandEntry({ allowedValues: ["test"] })],
                    parameters: [new StringCommandParameter("val", "v", {
                        required: true,
                        customValidation: (val) => val === "124"
                    })],
                    handler: handler
                }
            ]
        });

        try{
            cli.parse("test --val=123");
        }
        catch(err){
            errorHandler(err);
        }
        
        expect(handler.called).toEqual(false);
        expect(errorHandler.called).toEqual(true);
    });

    it("should parse command array", () => {
        const handler = sinon.spy((command: string[], parameters: { [name:string]: any }) => {
            expect(command).toEqual(["test", "ing"]);
            expect(parameters).toEqual({ "val": "123" });
        });

        const cli = new CLI({
            commands: [
                {
                    schema: [new StringCommandEntry({ allowedValues: ["test"] })],
                    parameters: [new StringCommandParameter("val", "v")],
                    handler: handler
                }
            ]
        });

        const errorHandler = sinon.spy(err => {
            assert.fail("Error handler should not have been called");
        });

        try{
            cli.parse(["test", "--val=123", "ing"]);
        }
        catch(err){
            errorHandler(err);
        }
    });

    it("should fail with invalid command type", () => {

        const cli = new CLI({
            commands: []
        });

        const errorHandler = sinon.spy(err => {
            expect(err.message).toEqual("Invalid command parameter");
        });

        try{
            cli.parse({ "arg1": "arg1val" } as any);
        }
        catch(err){
            errorHandler(err);
        }
    });
});