import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { DB } from "../../Object/database/database";
import { tellraw } from "../../Object/tool/tools";
import { translate } from "../../Object/tool/lang";
import { factionRank } from "../../Object/faction/Faction";
import { addSubCommand } from "../CommandManager";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";
import { Vector_3 } from "../../Object/tool/object/Vector";
import { haveFaction, isLeader } from "./_UtilsFaction";

addSubCommand(
	"sethome",
	"Set the faction home.",
	`${globalThis.prefix}faction sethome`,
	["sethome", "sh"],
	cmd_module.faction,
	cmd_permission.member,
	true,
	false,
	factionSetHome,
	[["faction", "f"]],
	isLeader
)

function factionSetHome(args: string[], player: Player, ply: Ply) {
	const fac = DB.db_faction.get(ply.faction_name ?? "");

	if (fac === undefined)
		return tellraw(player, translate(ply.lang)?.error_cant_do_that ?? "no translation");
	
	//is Leader ?
	if (fac.getRankFromName(ply.name) !== factionRank.Leader)
		return tellraw(player, translate(ply.lang)?.error_cant_do_that ?? "no translation"); 

	if (fac.isFhome) {
		if (player.dimension.id === "minecraft:overworld") {
			fac.remove_to_update_faction();
			fac.setFhome(player.location);
			fac.add_to_update_faction();
			tellraw(player, translate(ply.lang, fac.Fhome!.x, fac.Fhome!.y, fac.Fhome!.z)?.faction_home ?? "no translation");
		}
		else {
			tellraw(player, translate(ply.lang)?.error_faction_home ?? "no translation")
		}
	}
	else {
		tellraw(player, translate(ply.lang)?.error_faction_home_off ?? "no translation");
	}
}