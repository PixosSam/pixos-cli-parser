export type CommandParameterOptions = {
    required?: boolean
    errorMessage?: string
};

export abstract class CommandParameter {
    constructor(public name: string, public shortName: string, public options?: CommandParameterOptions) {
        
    }

    // success prop denotes a successful operation as a whole NOT a successfull extraction
    // Eg. if it fails to find the parameter but its not required anyway, it will return success: true but found: false
    // The success property is mainly for derived classes to know to continue thier own derived processing
    public extract(parameters: { [key: string]: string }): any | null {
        for(const key in parameters) {
            if(key === this.name || key === this.shortName) {
                return parameters[key];
            }
        }

        return null;
    }

    public validate(value: any) {
        if(this.options?.required && (value === null || value === undefined)) {
            throw new Error(this.options.errorMessage || `--${this.name} is required for this command`);
        }
    }
}