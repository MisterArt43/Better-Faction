import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { DB } from "../../Object/database/database";
import { translate } from "../../Object/tool/lang";
import { tellraw } from "../../Object/tool/tools";
import { factionRank } from "../../Object/faction/Faction";
import { Chunk, db_group_chunk } from "../../Object/chunk/Chunk";



// +f claim :
//  - add claim
//  - list group
//  - add group
//  - remove group (transfert in another group)
//  if player is on a chunk, add option : - edit claim at my position

// +faction claim add [<group>]
// +faction claim list [<group>]
// +faction claim removegroup [<group>]
// +faction claim edit <x> <z>
// +faction claim edit <group>
// +faction claim remove <x> <z>
// +faction claim info <x> <z>
// +faction claim info <group>
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
	
	if (args.length >= 4) {
		const chunk = new Chunk(player.location.x >> 4, player.location.z >> 4, ply.name, Date.now(), fac.name, player.dimension.id, undefined, undefined);

		Chunk.add_chunk(chunk);
	} 
}