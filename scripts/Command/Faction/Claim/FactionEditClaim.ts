import { Player } from "@minecraft/server";
import { Ply } from "../../../Object/player/Ply";
import { DB } from "../../../Object/database/database";
import { translate } from "../../../Object/tool/lang";
import { Faction, factionRank } from "../../../Object/faction/Faction";
import { Chunk, db_chunk } from "../../../Object/chunk/Chunk";
import { BFActionFormData, BFModalFormData } from "../../../Object/formQueue/formQueue";
import { addSubCommand } from "../../CommandManager";
import { cmd_module, cmd_permission } from "../../../Object/database/db_map";
import { isAtLeastOfficer } from "../_UtilsFaction";
import { tellraw } from "../../../Object/tool/tools";

addSubCommand(
	"edit",
	"Edit a claim",
	"+f claim edit",
	["edit", "ed"],
	cmd_module.claim,
	cmd_permission.member,
	true,
	true,
	editClaimChunk,
	[["faction", "f"], ["claim"]],
	isAtLeastOfficer
)

function editClaimChunk(args: string[], player: Player, ply: Ply) {
	const fac = DB.db_faction.get(ply.faction_name ?? "");

	if (fac === undefined)
		return tellraw(player, translate(ply.lang)?.error_no_faction ?? "no translation");

	const rank = fac.getRankFromName(ply.name);
	if (rank === undefined || rank > factionRank.Officer)
		return tellraw(player, translate(ply.lang)?.error_cant_do_that ?? "no translation");

	editClaimUI(player, ply, fac);
}

function editClaimUI(player: Player, ply: Ply, fac: Faction) {
	new BFActionFormData()
	.title("choose method")
	.button("edit the chunk on my position")
	.button("select a chunk in a group")
	.show(player).then((res) => {
		if (res === undefined || res.selection === undefined) return;

		if (res.selection === 0) {
			editUI(player, ply, fac, db_chunk.get((player.location.x >> 4) + "," + (player.location.z >> 4) + player.dimension.id))
		} else {
			selectChunkInGroup(player, ply, fac);
		}
	})
}

function editUI(player: Player, ply: Ply, fac: Faction, chunk?: Chunk) {
	if (chunk === undefined) return tellraw(player, "This chunk is not claimed");

	if (chunk.faction_name !== fac.name) return tellraw(player, "This chunk is not claimed by your faction");

	const listGroup = Array.from(fac.groupClaim.keys());
	if (listGroup.length === 0) listGroup.push("none");

	const form = new BFModalFormData()
	.title("edit claim")
	.dropdown("claim group", listGroup, listGroup.indexOf(chunk.group))
	
	for(const rank of Object.keys(factionRank)) {
		let test = chunk.rankPermission.find(p => p.rank === Object.keys(factionRank).indexOf(rank));
		form.dropdown("\nCan Break permission for " + rank, ["true", "false"], chunk.rankPermission.find(p => p.rank === Object.keys(factionRank).indexOf(rank))?.permission.canBreak? 0 : 1);
		form.dropdown("Can Place permission for " + rank, ["true", "false"], chunk.rankPermission.find(p => p.rank === Object.keys(factionRank).indexOf(rank))?.permission.canPlace? 0 : 1);
		form.dropdown("Can Interact permission for " + rank, ["true", "false"], chunk.rankPermission.find(p => p.rank === Object.keys(factionRank).indexOf(rank))?.permission.canInteract? 0 : 1);
	}

	form.dropdown("\n\n stranger player permission :\n Can Break", ["true", "false"], chunk.defaultPermission.canBreak ? 0 : 1);
	form.dropdown("Can Place", ["true", "false"], chunk.defaultPermission.canPlace ? 0 : 1);
	form.dropdown("Can Interact", ["true", "false"], chunk.defaultPermission.canInteract ? 0 : 1);

	form.show(player).then((res) => {
		if (res === undefined || !res.formValues) return;

		chunk.remove_to_update_chunk();
		chunk.group = listGroup[res.formValues[0] as number];
		for(const rank of Object.keys(factionRank)) {
			const rankPermission = chunk.rankPermission.find(p => p.rank === Object.keys(factionRank).indexOf(rank));
			if (rankPermission === undefined) continue;

			rankPermission.permission.canBreak = (res.formValues[1 + Object.keys(factionRank).indexOf(rank)] === 0);
			rankPermission.permission.canPlace = (res.formValues[1 + Object.keys(factionRank).indexOf(rank) + Object.keys(factionRank).length] === 0);
			rankPermission.permission.canInteract = (res.formValues[1 + Object.keys(factionRank).indexOf(rank) + Object.keys(factionRank).length * 2] === 0);
		}

		chunk.defaultPermission.canBreak = (res.formValues[1 + Object.keys(factionRank).length * 3] === 0);
		chunk.defaultPermission.canPlace = (res.formValues[1 + Object.keys(factionRank).length * 3 + 1] === 0);
		chunk.defaultPermission.canInteract = (res.formValues[1 + Object.keys(factionRank).length * 3 + 2] === 0);
		chunk.add_to_update_chunk();
		tellraw(player, "claim edited");
	})


}

function selectChunkInGroup(player: Player, ply: Ply, fac: Faction) {
	let form = new BFActionFormData()
	.title("select a group")
	
	const groupNames = Array.from(fac.groupClaim.keys());

	for (const name of groupNames) {
		form.button(name);
	}

	form.show(player).then((res) => {
		if (res === undefined || res.selection === undefined) return;
		
		const group = Array.from(fac.groupClaim.get(groupNames[res.selection])!.values());
		if (group === undefined) return;

		form = new BFActionFormData()
		.title("select a chunk")
		
		for (const chunk of group) {
			form.button(chunk.x + " " + chunk.z);
		}

		form.show(player).then((res) => {
			if (res === undefined || res.selection === undefined) return;

			const chunk = group[res.selection];
			if (chunk === undefined) return;
			editUI(player, ply, fac, chunk);
		})
	})
}