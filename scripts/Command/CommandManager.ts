import { ChatSendBeforeEvent, Player, world } from "@minecraft/server";
import { DB } from "../Object/database/database";
import { cmd_module, cmd_permission } from "../Object/database/db_map";
import { Ply } from "../Object/player/Ply";
import { log, tellraw } from "../Object/tool/tools";
import { customChat } from "../Chat/CustomChat";
import { ActionFormData } from "@minecraft/server-ui";

world.beforeEvents.chatSend.subscribe(data => {
	try {
		if (data.message.substring(0, DB.db_map.prefix.length) === prefix) {
			if (data.sender.nameTag === undefined) {
				data.sender.nameTag = data.sender.name;
			}
			const msg = data.message.substring(prefix.length).replace(/@"/g, "\"").trim();
			subCommandExecuter(msg.match(/[\""].+?[\""]|[^ ]+/g) ?? [], data);
			data.cancel = true;
		}
		else if (DB.db_map.default_cmd_module.includes(cmd_module.chat)) {
			customChat(data);
			data.cancel = true;
		}
	} catch (e) {
		console.warn(`beforeChat: ${e}\n`)
	}
})

async function subCommandExecuter(args: string[], data: ChatSendBeforeEvent, it: number = 0, cursor?: SubCommand, pl?: Player) {
	if (cursor === undefined) cursor = commands.get(args[it]);
	else if (!(cursor instanceof Command)) cursor = cursor.get(args[it]);

	if (cursor === undefined)
		return tellraw(data.sender, `§cUnknown command. Try ${prefix}help for a list of commands.`);

	if (cursor instanceof Command) {
		if (cursor.isEnable) {
			const ply = DB.db_player.get(data.sender.name);
			const player = pl ? pl : world.getPlayers({ name: data.sender.name })?.[0];

			if (ply === undefined || player === undefined)
				return tellraw(data.sender, `§cError You are not registered yet. Wait a few seconds and try again.`);
			if (cursor.module == cmd_module.all || ply.cmd_module.includes(cmd_module.all) || ply.cmd_module.includes(cursor.module)) {
				if (cursor.permission <= ply.permission) {
					cursor.func(args, player, ply);
				}
				else {
					tellraw(data.sender, `§cYou don't have permission to use this command.`);
				}
			}
			else {
				tellraw(data.sender, `§cThe module of this command is disabled.`);
			}
		}
		else {
			tellraw(data.sender, `§cThis command is disabled.`);
		}
	}
	else {
		if (args.length <= it + 1) {
			subCommandExecuter(args, data, it + 1, cursor, pl);
		}
		else {
			const form = new ActionFormData().title(args[it]);
			const listCmd = new Array<string>();
			const player = pl ? pl : world.getPlayers({ name: data.sender.name })?.[0];

			for (const [key, value] of cursor) {
				if (value instanceof Command && !listCmd.includes(value.command)) {
					form.button(value.command);
					listCmd.push(value.command);
				}
				else if (!listCmd.includes(key)) {
					form.button(key);
					listCmd.push(key);
				}
			}
			const dataForm = await form.show(player);
			if (dataForm.canceled || dataForm.selection === undefined) return;
			args[it++] = listCmd[dataForm.selection];
			subCommandExecuter(args, data, it, cursor, player);
		}
	}
}

export class Command {
	constructor(
		public command: string,
		public module: (typeof cmd_module[keyof typeof cmd_module]),
		public description: string,
		public usage: string,
		public permission: (typeof cmd_permission[keyof typeof cmd_permission]),
		public aliases: string[],
		public isEnable: boolean,
		public isUI: boolean,
		public func: CommandFunction) {}
}

type CommandFunction = (args: string[], player: Player, ply: Ply) => void;
export type SubCommand = Command | Map<string, SubCommand>

export function addSubCommand(
	command: string,
	description: string,
	usage: string,
	aliases: string[],
	module: (typeof cmd_module[keyof typeof cmd_module]),
	permission: (typeof cmd_permission[keyof typeof cmd_permission]),
	isEnable: boolean,
	isUI: boolean,
	func: CommandFunction,
	subCommandPath?: string[] | string[][]) { // [string | string[]] can contain alias of subcommand with same reference
		let cmd = new Command(
			command,
			module,
			description,
			usage,
			permission,
			aliases,
			isEnable,
			isUI,
			func
		);
		if (!commands) {
			commands = new Map<string, SubCommand>();
			commands.set("all", commands);
		}
	let cursor = commands;
	log("Add new command: " + command);
	if (subCommandPath !== undefined) {
		// create path in the map (keep same reference)
		for (const path of subCommandPath) {
			if (path instanceof Array) {
				const newMap = new Map<string, SubCommand>();
				path.forEach(p => {
					if (!cursor.has(p))
						cursor.set(p, newMap)
				})
				cursor = cursor.get(path[0]) as Map<string, SubCommand>;
			}
			else {
				if (!cursor.has(path))
					cursor.set(path, new Map<string, SubCommand>)
				cursor = cursor.get(path) as Map<string, SubCommand>;
			}
		}
	}
	while (true) {
		const it = cursor.get(cmd.command);
		if (it === undefined) break;
		if (it instanceof Command) break;
		cursor = it;
	}
	cmd.aliases.forEach(alias => {
		cursor.set(alias, cmd);
	})
}

export var commands : Map<string, SubCommand> = new Map<string, SubCommand>();