export type CommandEntryParseResult<T> = {
    success: boolean,
    value?: T
};

export interface ICommandEntry<T> {
    parse(input: string): CommandEntryParseResult<T>;
}