import { Player, world } from "@minecraft/server";
import { Chunk } from "../Object/chunk/Chunk";
import { cmd_module, cmd_permission, DB_Map } from "../Object/database/db_map";
import { Display } from "../Object/display/Display";
import { Faction } from "../Object/faction/Faction";
import { Ply } from "../Object/player/Ply";
import { Warp } from "../Object/warp/Warp";
import { addSubCommand } from "./CommandManager";
import { log, sleep } from "../Object/tool/tools";

addSubCommand(
	"update",
	"Update the database (only for owner)",
	`${globalThis.prefix}update`,
	["update"],
	cmd_module.commoncommand,
	cmd_permission.owner,
	true,
	false,
	update
)

async function update(args: string[], player: Player, ply: Ply) {
	world.sendMessage("§aUpdating the database..., §eAll script will be paused for a moment")
	isLoaded = false

	try {
		await sleep(10);

		await DB_Map.UpdateDB();

		await Ply.UpdateDB();

		await Faction.UpdateDB();
		await Chunk.UpdateDB();

		await Warp.UpdateDB();

		await Display.UpdateDB();
	}
	catch (e) {
		if (e instanceof Error) {
			log(`§cError: ${e.message}\n\n${e.stack}\n`);
		}
	}

	world.sendMessage("§aDatabase updated")
	isLoaded = true;
}