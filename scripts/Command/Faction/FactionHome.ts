import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { Server, tellraw, tpsound } from "../../Object/tool/tools";
import { DB } from "../../Object/database/database";
import { translate } from "../../lang";
import { addSubCommand, cmd_permission } from "../CommandManager";
import { cmd_module } from "../../Object/database/db_map";
import { Delay } from "../../Object/player/Delay";

addSubCommand(
	"home",
	"teleport to your faction home",
	`${globalThis.prefix}faction home`,
	["home", "h"],
	cmd_module.faction,
	cmd_permission.member,
	true,
	false,
	Factionhome,
	[["faction", "f"]]
)

function Factionhome(args: string[], player: Player, ply: Ply) {
	if (Delay.isTpCanceled(player)) return;
	const fac = DB.db_faction.get(ply.faction_name ?? "");

	if (fac !== undefined) {
		if (fac.isFhome === true && fac.Fhome !== null) {
			ply.remove_to_update_player();
			ply.back.x = Math.ceil(player.location.x + 0.0001) - 1;
			ply.back.y = Math.floor(player.location.y + 0.4999);
			ply.back.z = Math.ceil(player.location.z + 0.0001) - 1;
			ply.add_to_update_player();
			Server.runCommandAsync(`tp "${player.name}" ${fac.Fhome?.x} ${fac.Fhome?.y} ${fac.Fhome?.z}`);
			tpsound(player);
		}
	}
	else {
		tellraw(player, translate(ply.lang)?.error_find_faction ?? "no translation");
	}
}