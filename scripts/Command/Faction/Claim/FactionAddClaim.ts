import { Player } from "@minecraft/server";
import { Ply } from "../../../Object/player/Ply";
import { DB } from "../../../Object/database/database";
import { translate } from "../../../Object/tool/lang";
import { Faction, factionRank } from "../../../Object/faction/Faction";
import { Chunk, db_group_chunk } from "../../../Object/chunk/Chunk";
import { BFModalFormData } from "../../../Object/formQueue/formQueue";
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
	AddClaimChunk,
	[["faction", "f"], ["claim"]],
	isAtLeastOfficer
)

function AddClaimChunk(args: string[], player: Player, ply: Ply) {
	const fac = DB.db_faction.get(ply.faction_name ?? "");
	
	if (fac === undefined) 
		return tellraw(player, translate(ply.lang)?.error_no_faction ?? "no translation");
	
	const rank = fac.getRankFromName(ply.name);
	if (rank === undefined || rank > factionRank.Officer)
		return tellraw(player, translate(ply.lang)?.error_cant_do_that ?? "no translation");
	
	if (fac.power < fac.claim.size)
		return tellraw(player, "You don't have enough power to claim this chunk");
	
	if (DB.db_chunk.has((player.location.x >> 4) + "," + (player.location.z >> 4) + player.dimension.id))
		return tellraw(player, "This chunk is already claimed");
	
	AddClaimUI(player, ply, fac);
}

function AddClaimUI(player: Player, ply: Ply, fac: Faction) {
	const setGroupName = new Set<string>();
	Array.from(fac.claim.values()).map((chunk) => setGroupName.add(chunk.group));
	const listGroupName = Array.from(setGroupName);
	if (listGroupName.length === 0) listGroupName.push("none");

	log(JSON.stringify(listGroupName));
	
	new BFModalFormData()
	.title("Add Claim " + (player.location.x >> 4) + " " + (player.location.z >> 4))
	.dropdown("claim group", listGroupName)
	.show(player).then((res) => {
		if (res.canceled || !res.formValues) return;
		
		if (DB.db_chunk.has((player.location.x >> 4) + "," + (player.location.z >> 4) + player.dimension.id))
			return tellraw(player, "This chunk is already claimed");

		if (ply.faction_name === null)
			return tellraw(player, "You are not in a faction");

		const chunk = new Chunk(player.location.x >> 4, player.location.z >> 4, ply.name, Date.now(), fac.name, player.dimension.id, undefined, listGroupName[res.formValues[0] as number]);
		Chunk.add_chunk(chunk);
		tellraw(player, "§aClaim added");
	})
}