import { ChatSendBeforeEvent, Player, system, world } from "@minecraft/server";
import { DB } from "../Object/database/database";
import { cmd_module, cmd_permission } from "../Object/database/db_map";
import { Ply } from "../Object/player/Ply";
import { log, tellraw } from "../Object/tool/tools";
import { customChat } from "../Chat/CustomChat";
import { BFActionFormData } from "../Object/formQueue/formQueue";

world.beforeEvents.chatSend.subscribe(data => {
	try {
		if (data.message.substring(0, DB.db_map.prefix.length) === prefix) {
			if (data.sender.nameTag === undefined) {
				data.sender.nameTag = data.sender.name;
			}
			const msg = data.message.substring(prefix.length).replace(/@"/g, "\"").trim();
			log(`§a${data.sender.name} | ` + (msg.match(/[\""].+?[\""]|[^ ]+/g) ?? []).join(' | '))
			subCommandExecuter(msg.match(/[\""].+?[\""]|[^ ]+/g) ?? [], data);
			data.cancel = true;
		}
		else if (DB.db_map.default_cmd_module.includes(cmd_module.chat) || DB.db_map.default_cmd_module.includes(cmd_module.all)) {
			customChat(data);
			data.cancel = true;
		}
	} catch (e) {
		console.warn(`beforeChat: ${e}\n`)
	}
})

async function subCommandExecuter(args: string[], data: ChatSendBeforeEvent, it: number = 0, cursor?: SubCommand, player?: Player, ply?: Ply) {
	if (cursor === undefined) cursor = commands.get(args[it]);
	else if (!(cursor instanceof Command)) cursor = cursor.get(args[it]);

	player = player ? player : world.getPlayers({ name: data.sender.name })?.[0];
	ply = ply ? ply : DB.db_player.get(data.sender.name)!;

	if (cursor === undefined || cursor instanceof Command && cursor.externalCondition && !cursor.externalCondition(ply, player))
		return tellraw(data.sender, `§cUnknown command. Try ${prefix}help for a list of commands.`);

	if (cursor instanceof Command) {
		if (cursor.isEnable) {

			if (ply === undefined || player === undefined)
				return tellraw(data.sender, `§cError You are not registered yet. Wait a few seconds and try again.`);
			if (cursor.module == cmd_module.all || ply.cmd_module.includes(cmd_module.all) || ply.cmd_module.includes(cursor.module)) {
				if (cursor.permission >= ply.permission) {
					try {
						if (cursor.isUI)
							system.run(() => cursor.func(args, player, ply));
						else
							cursor.func(args, player, ply)
					} catch (error : any) {
						if (error instanceof Error) {
							log(`§cError: ${error.message}\n\n${error.stack}\n`);
						}
					}
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
		if (args.length > it + 1) {
			return subCommandExecuter(args, data, it + 1, cursor, player, ply);
		}
		else {
			// Initialize the form using BFActionFormData
			const form = new BFActionFormData()
				.title(args[it]);
		
			// Populate form buttons
			const listCmd = getSubCommandPerAlias(cursor, ply, player);
			const keyArray = listCmd.seenCommands.sort((a, b) => b.priorityOrder - a.priorityOrder)
				.map((cmd) => cmd.command)
				.concat(listCmd.seenSubCommands.map((cmd) => cmd.keys[0]))
			keyArray.forEach((key) => {
				form.button(key);
			});
		
			system.run(async () => {
					const dataForm = await form.show(player);
					if (dataForm.selection !== undefined)
						log(`§r§a§l$${args[it]} | ${keyArray[dataForm.selection!]}`);
					if (dataForm.canceled || dataForm.selection === undefined) return;
					args[++it] = keyArray[dataForm.selection!];
					return subCommandExecuter(args, data, it, cursor, player, ply);
			});
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
		public func: CommandFunction,
		public priorityOrder = 0,
		public externalCondition?: (ply: Ply, player: Player) => boolean,
	) {}
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
	subCommandPath?: string[] | string[][],
	externalCondition?: (ply: Ply, player: Player) => boolean,
	priorityOrder = 0) { // [string | string[]] can contain alias of subcommand with same reference
		let cmd = new Command(
			command,
			module,
			description,
			usage,
			permission,
			aliases,
			isEnable,
			isUI,
			func,
			priorityOrder,
			externalCondition,
		);
		if (!commands) {
			commands = new Map<string, SubCommand>();
			commands.set("all", commands);
		}
	let cursor = commands;
	// log("Add new command: " + command);
	if (subCommandPath !== undefined) {
		// create path in the map (keep same reference)
		for (const path of subCommandPath) {
			if (path.length === 0) continue;
			if (path instanceof Array) {
				const newMap = new Map<string, SubCommand>();
				path.forEach(p => {
					if (!cursor.has(p))
						cursor.set(p, newMap)
				})
				cursor = cursor.get(path[0]) as Map<string, SubCommand>;
			}
			else {
				tellraw("@a", "§cAn Error occured while adding a new command. Check logs for more informations.");
				log("§cError: subCommandPath must be an array of string or an array of array of string. like this : [['warp', 'w'], ['edit', 'e']]");
				throw new Error("subCommandPath must be an array of string or an array of array of string. like this : [['warp', 'w'], ['edit', 'e']]");
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

export function getSubCommandPerAlias(cursor: Map<string, SubCommand>, ply: Ply, player: Player, includeLoop = false): { seenCommands: Command[], seenSubCommands: { keys: string[], value: SubCommand }[] } {
	let seenCommands = new Array<Command>();
	let seenSubCommands = new Array<{ keys: string[], value: SubCommand }>();

	for (const [key, value] of cursor) {
		// if (key !== 'faction' ) continue;
		// if (key === 'faction' || key === 'f')
			// log(havePermissionForSubCommand(ply, player, value) + " " + key);
		if (!havePermissionForSubCommand(ply, player, value)) continue;
		if (value instanceof Command) {
			//log(value.command + " " + value.isEnable + " " + value.permission + " (" + Object.keys(cmd_permission)[value.permission] + ") >= " + ply.permission + " (" + Object.keys(cmd_permission)[ply.permission] + ")")
			if (value.isEnable === false || value.permission < ply.permission) continue;
			if (!seenCommands.includes(value)) {
				seenCommands.push(value);
			}
		} else {
			if (!includeLoop && value === cursor) continue;
			// Same Value NOT SAME KEYS !!!!
			if (seenSubCommands.some((v) => v.value === value)) {
				seenSubCommands.forEach((v) => {
					if (v.value === value) {
						v.keys.push(key);
					}
				});
			} else {
				seenSubCommands.push({ keys: [key], value: value });
			}
		}
	}
	return { seenCommands, seenSubCommands };
}

export function havePermissionForSubCommand(ply: Ply, player: Player, subCommand: SubCommand) : boolean {
	if (subCommand instanceof Command) {
		//log("command : " + subCommand.command + "ply_perm: " + Object.keys(cmd_permission)[ply.permission] + " <= cmd_perm: " + Object.keys(cmd_permission)[subCommand.permission]);
		if (subCommand.externalCondition !== undefined && !subCommand.externalCondition(ply, player)) {
			return false;
		}
		return ply.permission <= subCommand.permission;
	}
	else {
		for (const [key, value] of subCommand) {
			if ((value instanceof Map && value !== subCommand) || value instanceof Command) //avoid loop (all -> all -> all -> ...) 
				if (havePermissionForSubCommand(ply, player, value))
					return true;
		}
	}
	return false;
}

export var commands : Map<string, SubCommand> = new Map<string, SubCommand>();
commands.set("all", commands);