import { Player, system } from "@minecraft/server";
import { tellraw } from "../../Object/tool/tools";
import { Ply } from "../../Object/player/Ply";
import { addSubCommand, cmd_permission } from "../CommandManager";
import { cmd_module } from "../../Object/database/db_map";

addSubCommand(
	"ping",
	"Give the ping of the server.",
	`${globalThis.prefix}ping`,
	["ping"],
	cmd_module.commoncommand,
	cmd_permission.member,
	true,
	false,
	ping
);

async function ping(args: string[], player: Player, ply: Ply) {
	const delay = 1000; //in ms
	const waitTime = delay / 50; //in ticks
	const start = Date.now();
	system.runTimeout(() => {
		const end = Date.now();
		const diff = end - start - delay;
		tellraw(ply.name, diff + " ms");
	},waitTime);
}