import * as grc from '@ceantixdev/node-grc';
import * as vscode from 'vscode';
import { RCTerminal } from './rcterminal/RCTerminal';
import { ServerExplorer } from './explorer/ServerExplorer';
import { ServerList } from './serverlist/ServerList';

const defaultConfig: VSConfiguration = {
	host: "listserver.graal.in",
	port: 14922,
	account: "",
	password: "",
	nickname: "unknown",
	saveDir: ""
};

export interface VSConfiguration extends grc.ServerlistConfig {
	saveDir: string
};

export class VSCodeContext implements grc.RemoteControlEvents {
	public readonly vsContext: vscode.ExtensionContext;
	public readonly config: VSConfiguration;

	public readonly rcTerminal: RCTerminal;
	public readonly serverList: ServerList;
	public readonly serverExplorer: ServerExplorer;

	private rcInstance?: grc.RemoteControl;

	public get rcSession(): grc.RemoteControl | undefined {
		return this.rcInstance;
	}

	constructor(context: vscode.ExtensionContext, config: Partial<VSConfiguration>) {
		this.vsContext = context;
		this.config = { ...defaultConfig, ...config };

		this.rcTerminal = new RCTerminal(this);
		this.serverList = new ServerList(this);
		this.serverExplorer = new ServerExplorer(this);
	}

	public connectRemoteControl(server: grc.ServerEntry): void {
		this.rcTerminal.start();

		if (this.rcInstance) {
			this.rcInstance.disconnect();
		}

		this.rcInstance = new grc.RemoteControl(this.config, server, this);
	}

	public disconnectRemoteControl(): void {
		if (this.rcInstance) {
			this.rcInstance.disconnect();
			this.rcInstance = undefined;
		}
	}

	private getServerNameLabel(): string {
		let serverName = "Disconnected";
		if (this.rcInstance) {
			serverName = "Connected to " + this.rcInstance.server.name;
		}
		
		return `RC (${serverName})`;
	}

	// grc.RemoteControlEvents

	onRCChat(text: string) {
		const vsConfig = vscode.workspace.getConfiguration();
		if(vsConfig.get<boolean>('graalRC.enableTimestamp') === false) {
			this.rcTerminal.write(text);
			return;
		}
		// Create a new Date object
		const now = new Date();

		// Get hours, minutes, and seconds, and pad them with a '0' if they are single digits
		const hours = now.getHours().toString().padStart(2, '0');
		const minutes = now.getMinutes().toString().padStart(2, '0');
		const seconds = now.getSeconds().toString().padStart(2, '0');

		// Create the timestamp string
		const timestamp = `[${hours}:${minutes}:${seconds}]`;
		
		// Write the timestamp and the original text
		this.rcTerminal.write(`${timestamp} ${text}`);
	}

	onRCConnected(instance: grc.RCInterface) {
		console.log("onRCConnected");

		const vsConfig = vscode.workspace.getConfiguration();
		const nickname = vsConfig.get<string>('graalRC.login.Nickname') || vsConfig.get<string>('graalRC.login.Account') || "";
		this.rcInstance?.setNickName(nickname);

		this.serverExplorer.serverExplorerView.updateTitle(this.getServerNameLabel());

		this.rcTerminal.write(`RC Connected / Authenticated to ${this.rcInstance?.server.name}`);
	}

	onRCDisconnected(instance: grc.RCInterface, text?: string) {
		if (this.rcInstance && this.rcInstance === instance) {
			this.rcInstance = undefined;
		}

		this.rcTerminal.write("You have been disconnected.");
		if (text) {
			this.rcTerminal.write(`Reason: ${text}`);
		}

		this.serverExplorer.serverExplorerView.updateTitle(this.getServerNameLabel());
		console.log("onRCDisconnected");
	}

	onNCConnected() {
		console.log("onNCConnected");

		this.rcInstance?.NpcControl?.requestWeaponList();
	}

	onNCDisconnected() {
		console.log("onNCDisconnected");
	}

	onNCChat(text: string) {
		const vsConfig = vscode.workspace.getConfiguration();
		if(vsConfig.get<boolean>('graalRC.enableTimestamp') === false) {
			this.rcTerminal.write(text);
			return;
		}
		// Create a new Date object
		const now = new Date();

		// Get hours, minutes, and seconds, and pad them with a '0' if they are single digits
		const hours = now.getHours().toString().padStart(2, '0');
		const minutes = now.getMinutes().toString().padStart(2, '0');
		const seconds = now.getSeconds().toString().padStart(2, '0');

		// Create the timestamp string
		const timestamp = `[${hours}:${minutes}:${seconds}]`;
		
		// Write the timestamp and the original text
		this.rcTerminal.write(`${timestamp} ${text}`);
	}
}
