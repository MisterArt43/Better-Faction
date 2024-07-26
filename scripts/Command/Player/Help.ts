import { ChatSendAfterEvent, Player } from "@minecraft/server";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";
import { Command, SubCommand, addSubCommand, commands, getSubCommandPerAlias, havePermissionForSubCommand } from "../CommandManager";
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
		let msg = "\nlist of root commands:\n" + buildCursorMessage(ply, player, commands);
		player.sendMessage(msg);
	}
	else {
		if (commands.has(args[1])) {
			recurUsageSubCommand(ply, player, commands.get(args[1]) as SubCommand, args, 2);
		}
		else {
			tellraw(player, `§cUnknown command. Try ${globalThis.prefix}help for a list of commands.`);
		}
	}
}

function recurUsageSubCommand(ply: Ply, player: Player, subCommand: SubCommand, args: string[], i: number) {
	if (subCommand instanceof Command) {
		if (subCommand.isEnable) {
			if (subCommand.permission <= ply.permission) {
				tellraw(ply.name, `§7${subCommand.command}§r - §e${subCommand.description}\n§7Usage: ${subCommand.usage} §r\n§7Aliases: ${subCommand.aliases.join(", ")}\n`);	
			}
		}
	}
	else {
		if (subCommand.has(args[i])) {
			recurUsageSubCommand(ply, player, subCommand.get(args[i]) as SubCommand, args, i++);
		}
		else {
			if (args.length == i && subCommand instanceof Map) {
				const msg = "list of subcommands:\n" + buildCursorMessage(ply, player, subCommand);
				tellraw(ply.name, msg);
			}
			else
				tellraw(ply.name, `§cUnknown command. Try ${globalThis.prefix}help for a list of commands.`);
		}
	}
}

function buildCursorMessage(ply: Ply, player: Player, cursor: Map<string, SubCommand>): string {
	let msg = "";
	let cmds = getSubCommandPerAlias(cursor, ply, player, true);

	cmds.seenCommands.forEach((v) => {
		msg += `§7${globalThis.prefix + v.command}§r - [${v.aliases.join(", ")}] - §e§o${v.description}\n§r`;
	});
	if (cmds.seenSubCommands.length > 0) msg += "\nList of subcommands:\n";
	cmds.seenSubCommands.forEach((v) => {
		msg += `§7§l > ${v.keys.join(", ")}§r\n`;
	});
	return msg
}