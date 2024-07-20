import { ChatSendAfterEvent, Player } from "@minecraft/server";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";
import { Command, SubCommand, addSubCommand, commands } from "../CommandManager";
import { Ply } from "../../Object/player/Ply";
import { log, tellraw } from "../../Object/tool/tools";

addSubCommand(
	"help",
	"Gives you a list of all commands, and their usage.",
	`${globalThis.prefix}help [command]`,
	["help"],
	cmd_module.commoncommand,
	cmd_permission.member,
	true,
	false,
	help
)

function help(args: string[], player: Player, ply: Ply) {
	if (args.length <= 1) {
		let msg = "\nlist of root commands:\n" + buildCursorMessage(ply, commands);
		player.sendMessage(msg);
	}
	else {
		if (commands.has(args[1])) {
			recurUsageSubCommand(ply, commands.get(args[1]) as SubCommand, args, 2);
		}
		else {
			tellraw(player, `§cUnknown command. Try ${globalThis.prefix}help for a list of commands.`);
		}
	}
}

function recurUsageSubCommand(ply: Ply, subCommand: SubCommand, args: string[], i: number) {
	if (subCommand instanceof Command) {
		if (subCommand.isEnable) {
			if (subCommand.permission <= ply.permission) {
				tellraw(ply.name, `§7${subCommand.command}§r - §e${subCommand.description}\n§7Usage: ${subCommand.usage} §r\n§7Aliases: ${subCommand.aliases.join(", ")}\n`);	
			}
		}
	}
	else {
		if (subCommand.has(args[i])) {
			recurUsageSubCommand(ply, subCommand.get(args[i]) as SubCommand, args, i++);
		}
		else {
			if (args.length == i && subCommand instanceof Map) {
				const msg = "list of subcommands:\n" + buildCursorMessage(ply, subCommand);
				tellraw(ply.name, msg);
			}
			else
				tellraw(ply.name, `§cUnknown command. Try ${globalThis.prefix}help for a list of commands.`);
		}
	}
}

function recursiveSubCommand(ply: Ply, subCommand: SubCommand): string {
	if (subCommand instanceof Command)
		return buildMessage(subCommand, ply);
	else {
		let msg = "";
		for (const [key, value] of subCommand) {
			msg += recursiveSubCommand(ply, value);
		}
		return msg;
	}
}

function buildMessage(command: Command, ply: Ply): string {
	if (command.isEnable) {
		if (command.permission <= ply.permission) {
			return `§7${command.command}§r\n`;
		}
	}
	return "";
}

function buildCursorMessage(ply: Ply, cursor: Map<string, SubCommand>): string {
	let msg = "";
		let seenCommands = new Array<Command>();
		let seenSubCommands = new Array<{ keys: string[], value: SubCommand }>();

		for (const [key, value] of cursor) {
			if (value instanceof Command) {
				//log("is enable: " + value.isEnable + " permission: " + value.permission + " ply permission: " + ply.permission)
				if (value.isEnable === false || value.permission <= ply.permission) continue;
				if (!seenCommands.includes(value)) {
					seenCommands.push(value);
				}
			} else {
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

		seenCommands.forEach((v) => {
			msg += `§7${globalThis.prefix + v.command}§r - [${v.aliases.join(", ")}] - §e§o${v.description}\n§r`;
		});
		if (seenSubCommands.length > 0) msg += "\nList of subcommands:\n";
		seenSubCommands.forEach((v) => {
			msg += `§7§l > ${v.keys.join(", ")}§r\n`;
		});
		return msg
}