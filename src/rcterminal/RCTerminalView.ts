import * as vscode from 'vscode';

const defaultLine = "→ ";

const keys = {
    enter: "\r",
    backspace: "\x7f",
};

const actions = {
    cursorBack: "\x1b[D",
    deleteChar: "\x1b[P",
    eraseLine: "\x1b[1K\x1B[0G",
    clear: "\x1b[2J\x1b[3J\x1b[;H",
};

export interface RCTerminalEvents {
    onTerminalInput(text: string): void
    onTerminalClosed(): void
    onTerminalOpened(): void
}

export class RCTerminalView
{
    private userInput: string = defaultLine;
    private readonly writeEmitter = new vscode.EventEmitter<string>();
    private readonly closeEmitter = new vscode.EventEmitter<void>();
    private isOpen: boolean = false;

    constructor(private readonly context: RCTerminalEvents) {
        this.initializeTerminal();
    }

    public get opened(): boolean {
        return this.isOpen;
    }
    
    public closeTerminal(): void {
        this.closeEmitter.fire();
    }

    public clearTerminal(): void {
        this.writeEmitter.fire(actions.clear);
		this.writeEmitter.fire(`${this.userInput}`);
    }

    public writeToTerminal(text: string): void {
		this.writeEmitter.fire(actions.eraseLine);
		this.writeEmitter.fire(`${text}\r\n`);
		this.writeEmitter.fire(`${this.userInput}`);
    }

    private initializeTerminal(): void {
        const pty: vscode.Pseudoterminal = {
            onDidWrite: this.writeEmitter.event,
            onDidClose: this.closeEmitter.event,
            open: () => { this.writeEmitter.fire(this.userInput); this.context.onTerminalOpened(); this.isOpen = true; },
            close: () => { this.context.onTerminalClosed(); },
            handleInput: async (char: string) => {
                switch (char) {
                    case keys.enter:
                        // preserve the run command line for history
                        // writeEmitter.fire(`\r${content}\r\n`);

                        // trim off leading default prompt
                        const command = this.userInput.slice(defaultLine.length);
                        this.userInput = defaultLine;

                        // erase line, and restore default prompt
                        this.writeEmitter.fire(`${actions.eraseLine}\r${defaultLine}`);

                        // send command
                        this.context.onTerminalInput(command);

                        return;

                    case keys.backspace:
                        if (this.userInput.length <= defaultLine.length) {
                            return;
                        }

                        // remove last character
                        this.userInput = this.userInput.slice(0, this.userInput.length - 1);
                        this.writeEmitter.fire(actions.cursorBack);
                        this.writeEmitter.fire(actions.deleteChar);
                        return;

                    default:
                        // typing a new character
                        this.userInput += char;
                        this.writeEmitter.fire(char);
                        return;
                }
            },
        };
        
        const terminal = vscode.window.createTerminal({
            name: `Remote Control`,
            pty,
        });
        terminal.show(true);
    }
}

function colorText(text: string): string {
	let output = '';
	let colorIndex = 1;
	for (let i = 0; i < text.length; i++) {
		const char = text.charAt(i);
		if (char === ' ' || char === '\r' || char === '\n') {
			output += char;
		} else {
			output += `\x1b[3${colorIndex++}m${text.charAt(i)}\x1b[0m`;
			if (colorIndex > 6) {
				colorIndex = 1;
			}
		}
	}
	return output;
}
