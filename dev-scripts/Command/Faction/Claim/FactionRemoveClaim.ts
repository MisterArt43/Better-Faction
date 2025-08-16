import { Player } from "@minecraft/server";
import { Ply } from "../../../Object/player/Ply";
import { DB } from "../../../Object/database/database";
import { translate } from "../../../Object/tool/lang";
import { Faction, factionRank } from "../../../Object/faction/Faction";
import { Chunk, db_chunk } from "../../../Object/chunk/Chunk";
import { BFActionFormData } from "../../../Object/formQueue/formQueue";
import { addSubCommand } from "../../CommandManager";
import { cmd_module, cmd_permission } from "../../../Object/database/db_map";
import { isAtLeastOfficer } from "../_UtilsFaction";
import { tellraw } from "../../../Object/tool/tools";

addSubCommand(
	"remove",
	"Remove a claim to the faction",
	"+f claim remove",
	["remove", "rm"],
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
	
	removeClaimUI(player, ply, fac);
}

function removeClaimUI(player: Player, ply: Ply, fac: Faction) {
	new BFActionFormData()
	.title("choose method")
	.button("remove the chunk on my position")
	.button("select a chunk in a group")
	.show(player).then((res) => {
		if (res === undefined || res.selection === undefined) return;

		if (res.selection === 0) {
			removeClaimChunkOnPosition(player, ply, fac);
		} else {
			selectChunkInGroup(player, ply, fac);
		}
	})
}

function removeClaimChunkOnPosition(player: Player, ply: Ply, fac: Faction) {
	const key = (player.location.x >> 4) + "," + (player.location.z >> 4) + player.dimension.id;
	if (!DB.db_chunk.has(key)) return tellraw(player, "This chunk is not claimed");

	if (!fac.claim.has(key)) return tellraw(player, "This chunk is not claimed by your faction");

	Chunk.remove_chunk(fac.claim.get(key)!);
}

function selectChunkInGroup(player: Player, ply: Ply, fac: Faction) {
	const form = new BFActionFormData()
	.title("select a group")
	
	const groupNames = Array.from(fac.groupClaim.keys());

	for (const name of groupNames) {
		form.button(name);
	}

	form.show(player).then((res) => {
		if (res === undefined || res.selection === undefined) return;

		const group = Array.from(fac.groupClaim.get(groupNames[res.selection])!.values());
		if (group === undefined) return;

		const form = new BFActionFormData()
		.title("select a chunk")
		
		for (const chunk of group) {
			form.button(chunk.x + " " + chunk.z);
		}

		form.show(player).then((res) => {
			if (res === undefined || res.selection === undefined) return;

			const chunk = group[res.selection];
			if (chunk === undefined) return;

			Chunk.remove_chunk(chunk);
			tellraw(player, "Chunk removed");
		})
	})
}