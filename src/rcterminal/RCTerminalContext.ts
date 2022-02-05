import { VSCodeContext } from "../VSCodeContext";
import { RCTerminalEvents, RCTerminalView } from "./RCTerminalView";

export class RCTerminalContext implements RCTerminalEvents {
	private terminalView?: RCTerminalView;
	private buffered: string[] = [];

	constructor(private readonly context: VSCodeContext) {

	}

	public close(): void {
		this.terminalView?.closeTerminal();
		this.terminalView = undefined;
	}

	public clear(): void {
		this.terminalView?.clearTerminal();
	}

	public start(): void {
		if (this.terminalView) {
			return;
		}

		this.terminalView = new RCTerminalView(this);
	}

	public write(text: string): void {
		if (this.terminalView && this.terminalView.opened) {
			this.writeBufferArray();
			this.terminalView.writeToTerminal(text);
			return;
		}

		this.buffered.push(text);
	}

	private writeBufferArray(): void {
		const buffer = [...this.buffered];
		this.buffered = [];

		for (const buf of buffer) {
			this.write(buf);
		}
	}
	
	onTerminalInput(text: string): void {
		this.context.rcInstance?.sendRCChat(text);
	}

	onTerminalClosed(): void {
		this.context.disconnectRemoteControl();
		this.terminalView = undefined;
	}

	onTerminalOpened(): void {
		this.writeBufferArray();
	}
}
