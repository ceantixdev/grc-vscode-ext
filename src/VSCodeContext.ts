import * as grc from '@xtjoeytx/node-grc';
import * as vscode from 'vscode';
import { RCTerminalContext } from './rcterminal/RCTerminalContext';
import { ServerExplorerContext } from './explorer/ServerExplorerContext';
import { ServerListContext } from './serverlist/ServerListContext';

const defaultConfig: grc.ServerlistConfig = {
	host: "listserver.graal.in",
	port: 14922,
	account: "",
	password: "",
	nickname: "unknown"
};

export class VSCodeContext implements grc.RemoteControlEvents {
	public readonly vsContext: vscode.ExtensionContext;
	public config: grc.ServerlistConfig;

	public readonly rcTerminal: RCTerminalContext;
	public readonly serverList: ServerListContext;
	public readonly serverExplorer: ServerExplorerContext;

	public rcInstance?: grc.RemoteControl;

	constructor(context: vscode.ExtensionContext, config: Partial<grc.ServerlistConfig>) {
		this.vsContext = context;
		this.config = { ...defaultConfig, ...config };

		this.rcTerminal = new RCTerminalContext(this);
		this.serverList = new ServerListContext(this);
		this.serverExplorer = new ServerExplorerContext(this);
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
			return;
		}
	}

	private getServerNameLabel(): string {
		let serverName = "Disconnected";
		if (this.rcInstance) {
			serverName = "Connected to " + this.rcInstance.server.name;
		}
		return `RC (${serverName})`;
	}

	onRCChat(text: string) {
		this.rcTerminal.write(text);
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

		this.rcInstance?.nc?.requestWeaponList();
	}

	onNCDisconnected() {
		console.log("onNCDisconnected");
	}

	onNCChat(text: string) {
		this.rcTerminal.write(text);
	}

	onReceiveWeaponScript(name: string, image: string, script: string): void {
		const uri = `/npcserver/Weapons/${name}`;

		const adjustedScript = `//#IMAGE: ${image}\n\n` + script;
		this.serverExplorer.fileSystem.resolvePromise(uri, adjustedScript);
	}

	onReceiveClassScript(name: string, script: string): void {
		const uri = `/npcserver/scripts/${name}`;

		this.serverExplorer.fileSystem.resolvePromise(uri, script);
	}

	onReceiveNPCScript(name: string, script: string): void {
		const uri = `/npcserver/npcs/${name}`;

		this.serverExplorer.fileSystem.resolvePromise(uri, script);
	}

	onReceiveNPCFlags(name: string, flags: string): void {
		const uri = `/npcserver/npcs/${name}.flags`;

		this.serverExplorer.fileSystem.resolvePromise(uri, flags);
	}
}
