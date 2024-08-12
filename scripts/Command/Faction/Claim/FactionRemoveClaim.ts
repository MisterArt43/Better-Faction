import { Player } from "@minecraft/server";
import { Ply } from "../../../Object/player/Ply";
import { DB } from "../../../Object/database/database";
import { translate } from "../../../Object/tool/lang";
import { Faction, factionRank } from "../../../Object/faction/Faction";
import { Chunk, db_chunk, db_group_chunk } from "../../../Object/chunk/Chunk";
import { BFActionFormData, BFModalFormData } from "../../../Object/formQueue/formQueue";
import { addSubCommand } from "../../CommandManager";
import { cmd_module, cmd_permission } from "../../../Object/database/db_map";
import { isAtLeastOfficer } from "../_UtilsFaction";
import { log, tellraw } from "../../../Object/tool/tools";



// +f claim :
//  - add claim
//  - list group
//  - add group
//  - remove group (transfert in another group)
//  if player is on a chunk, add option : - edit claim at my position

// +faction claim add <group>
// +faction claim list [<group>]
// +faction claim removegroup <group>
// +faction claim edit <x> <z>
// +faction claim edit <group>
// +faction claim remove <x> <z>
// +faction claim info <x> <z>
// +faction claim info <group>

addSubCommand(
	"add",
	"Add a claim to the faction",
	"+f claim add",
	["add"],
	cmd_module.claim,
	cmd_permission.member,
	true,
	true,
	removeClaimChunk,
	[["faction", "f"], ["claim"]],
	isAtLeastOfficer
)

function removeClaimChunk(args: string[], player: Player, ply: Ply) {
	const fac = DB.db_faction.get(ply.faction_name ?? "");
	
	if (fac === undefined) 
		return tellraw(player, translate(ply.lang)?.error_no_faction ?? "no translation");
	
	const rank = fac.getRankFromName(ply.name);
	if (rank === undefined || rank > factionRank.Officer)
		return tellraw(player, translate(ply.lang)?.error_cant_do_that ?? "no translation");
	
	if (DB.db_chunk.has((player.location.x >> 4) + "," + (player.location.z >> 4) + player.dimension.id))
		return tellraw(player, "This chunk is already claimed");
	
	removeClaimUI(player, ply, fac);
}

function removeClaimUI(player: Player, ply: Ply, fac: Faction) {
	new BFActionFormData()
	.title("choose method")
	.button("remove the chunk on my position")
	.button("select a chunk in a group")
	.show(player).then((res) => {

	})
}

function removeClaimChunkOnPosition(player: Player, ply: Ply, fac: Faction) {
	const chunk = db_chunk.get((player.location.x >> 4) + "," + (player.location.z >> 4) + player.dimension.id);
	if (chunk === undefined) return tellraw(player, "This chunk is not claimed");

	if (chunk.faction_name !== fac.name) return tellraw(player, "This chunk is not claimed by your faction");

	fac.removeClaim(chunk);
}