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
	if (args.length == 0) {
		let msg = "";
		for (let [key, value] of commands) {
			msg += recursiveSubCommand(ply, value);
		}
		tellraw(player, msg);
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
				tellraw(ply.name, `§7${subCommand.command}§r - ${subCommand.description}\n§7Usage: ${subCommand.usage}`);
			}
		}
	}
	else {
		if (subCommand.has(args[i])) {
			recurUsageSubCommand(ply, subCommand.get(args[i]) as SubCommand, args, i++);
		}
		else {
			if (args.length == i && subCommand instanceof Map) {
				let msg = "list of subcommands:\n";
				for (const [key, value] of subCommand) {
					msg += value instanceof Command ? `§7${key}§r - ${value.description}\n` : `§7§l${key}§r\n`;
				}
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