import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { tellraw } from "../../Object/tool/tools";
import { db_faction, factionRank } from "../../Object/faction/Faction";
import { addSubCommand, cmd_permission } from "../CommandManager";
import { cmd_module } from "../../Object/database/db_map";
import { translate } from "../../Object/tool/lang";

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
	[["faction", "f"]]
)

function factionSetHome(args: string[], player: Player, ply: Ply) {
	const fac = db_faction.get(ply.faction_name ?? "");

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