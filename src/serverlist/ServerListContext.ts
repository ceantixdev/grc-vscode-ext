import * as grc from '@xtjoeytx/node-grc';
import * as vscode from 'vscode';
import { VSCodeContext } from "../VSCodeContext";
import { ServerlistNode } from "./ServerListNode";
import { ServerListProvider, ServerListView } from './ServerListView';

export class ServerListContext implements ServerListProvider {
	private serverListView: ServerListView;

	constructor(private readonly context: VSCodeContext) {
		this.serverListView = new ServerListView(context.vsContext, this);
	}

	connectToServer(server: grc.ServerEntry): void {
		let confirmMsg = `Please confirm connecting to ${server.name}.`;
		if (this.context.rcInstance) {
			confirmMsg += ` This will disconnect you from your current session on ${this.context.rcInstance.server.name}`;
		}

		vscode.window.showInformationMessage(confirmMsg, ...["Yes", "No"])
		.then((answer) => {
			if (answer === "Yes") {
				console.log(`Connecting to ${server.name}`);

				this.context.connectRemoteControl(server);
			}
		});
	}

	getServerList(): Thenable<ServerlistNode[]> {
		return grc.Serverlist.request(this.context.config).then((servers) => {
			const serverListData = ServerListView.getDefaultRootNodes();

			for (const server of servers) {
				serverListData[server.category].children?.push({
					resource: vscode.Uri.parse("serverlist:///" + server.name),
					server: server,
					label: server.name
				});
			}

			return serverListData.filter((v: ServerlistNode) => v.children && v.children.length > 0);
		}, (err) => {
			console.log("Error: ", err);
			return [];
		});
	}
}
