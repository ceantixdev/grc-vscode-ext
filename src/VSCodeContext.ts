import * as grc from '@xtjoeytx/node-grc';
import * as vscode from 'vscode';
import { RCTerminal } from './rcterminal/RCTerminal';
import { ServerExplorer } from './explorer/ServerExplorer';
import { ServerList } from './serverlist/ServerList';

const defaultConfig: grc.ServerlistConfig = {
	host: "listserver.graal.in",
	port: 14922,
	account: "",
	password: "",
	nickname: "unknown"
};

export class VSCodeContext implements grc.RemoteControlEvents {
	public readonly vsContext: vscode.ExtensionContext;
	public readonly config: grc.ServerlistConfig;

	public readonly rcTerminal: RCTerminal;
	public readonly serverList: ServerList;
	public readonly serverExplorer: ServerExplorer;

	private rcInstance?: grc.RemoteControl;

	public get rcSession(): grc.RemoteControl | undefined {
		return this.rcInstance;
	}

	constructor(context: vscode.ExtensionContext, config: Partial<grc.ServerlistConfig>) {
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
		const uri = `/npcserver/weapons/${name}`;

		const adjustedScript = `//#IMAGE: ${image}\n\n` + script;
		this.serverExplorer.fileSystem.resolvePromise(uri, adjustedScript);
	}

	onReceiveClassScript(name: string, script: string): void {
		const uri = `/npcserver/scripts/${name}`;

		this.serverExplorer.fileSystem.resolvePromise(uri, script);
	}

	onReceiveNpcScript(name: string, script: string): void {
		const uri = `/npcserver/npcs/${name}`;
		// console.log("here: ", name, uri, script);
		this.serverExplorer.fileSystem.resolvePromise(uri, script);
	}

	onReceiveNpcAttributes(name: string, content: string): void {
		const uri = `/npcserver/npcs/${name}.attrs`;

		this.serverExplorer.fileSystem.resolvePromise(uri, content);
	}
	
	onReceiveNpcFlags(name: string, flags: string): void {
		const uri = `/npcserver/npcs/${name}.flags`;

		this.serverExplorer.fileSystem.resolvePromise(uri, flags);
	}

	onReceiveFolderConfig(content: string): void {
		const uri = `/gserver/config/folderconfig`;

		this.serverExplorer.fileSystem.resolvePromise(uri, content);
	}

	onReceiveServerFlags(content: string): void {
		const uri = `/gserver/config/serverflags`;

		this.serverExplorer.fileSystem.resolvePromise(uri, content);
	}
	
	onReceiveServerOptions(content: string): void {
		const uri = `/gserver/config/serveroptions`;

		this.serverExplorer.fileSystem.resolvePromise(uri, content);
	}
}
