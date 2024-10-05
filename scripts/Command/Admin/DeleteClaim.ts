import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { BFActionFormData } from "../../Object/formQueue/formQueue";
import { UI_find_faction } from "../../Object/tool/find_factions_UI";
import { Faction } from "../../Object/faction/Faction";
import { DB } from "../../Object/database/database";
import { log, tellraw } from "../../Object/tool/tools";
import { formatCreationFullDate } from "../../Object/tool/dateTools";
import { Chunk } from "../../Object/chunk/Chunk";
import { addSubCommand } from "../CommandManager";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";
import { haveChunk } from "./_UtilsAdmin";

addSubCommand(
	"remove",
	"Delete a claim as an admin",
	`${globalThis.prefix}admin claim remove`,
	["remove", "rm", "delete", "del", "d"],
	cmd_module.claim,
	cmd_permission.admin,
	true,
	true,
	deleteClaim,
	[["admin", "adm"], ["claim", "c"]],
	haveChunk
)

function deleteClaim(args: string[], player: Player, ply: Ply) {
	const form = new BFActionFormData()
	.title("Select Claim type")
	.button("Admin §8§l(Work in progress)")
	.button("Faction")

	if (DB.db_chunk.has((player.location.x >> 4) + "," + (player.location.z >> 4) + player.dimension.id))
		form.button("select Chunk on your position");

	form.show(player).then(async res => {
		if (!res || res.canceled) return;

		if (res.selection === 0)
			tellraw(player, "§cWork in progress")
		// 	selectMode(player, ply, "admin");
		else if (res.selection === 1)
			selectMode(player, ply, await UI_find_faction(player));
		else 
			deleteChunk(player, ply);
	})
}

function selectMode(player: Player, ply: Ply, fac: Faction | undefined) {
	if (!fac) return;

	new BFActionFormData()
	.title("Select mode")
	.button("Select Group")
	.button("delete all")
	.show(player).then(res => {
		if (!res || res.canceled) return;

		if (res.selection === 0) {
			const form = new BFActionFormData()
			.title("Select Group")

			let lstGroup = new Array<string>();

			for (const [key, value] of fac.groupClaim) {
				form.button(key)
				lstGroup.push(key);
			}

			form.show(player).then(res => {
				if (!res || res.canceled) return;

				deleteGroup(player, ply, fac, lstGroup[res.selection!]);
			})
		}
		else
			deleteAll(player, ply, fac);
	})
}

function deleteAll(player: Player, ply: Ply, fac: Faction) {
	for (const [key, value] of fac.groupClaim) {
		log(key + "DEBUG");
		deleteGroup(player, ply, fac, key);
	}
	tellraw(player, "§aAll claims of this faction has been deleted");
}

function deleteGroup(player: Player, ply: Ply, fac: Faction | undefined, group: string) {
	if (!fac) {
		tellraw(player, "§cThis faction does not exist")
		return;
	}

	const claims = fac.groupClaim.get(group);

	if (!claims) {
		tellraw(player, "§cThis group has no claim")
		return;
	}

	for (const [key, claim] of claims) {
		Chunk.remove_chunk(claim);
	}
	tellraw(player, `§aAll claims of §l${group}§r§a group has been deleted`);
}

function deleteChunk(player: Player, ply: Ply) {
	const chunk = DB.db_chunk.get((player.location.x >> 4) + "," + (player.location.z >> 4) + player.dimension.id)

	if (!chunk) {
		tellraw(player, "§cThis chunk is not claimed")
		return;
	}
	
	new BFActionFormData()
	.body("Chunk info :" 
		+ "\nFaction : " 
		+ chunk.faction_name 
		+ "\nClaimed by : " 
		+ chunk.owner 
		+ "\nClaimed at : " 
		+ formatCreationFullDate(chunk.date, DB.db_map.UTC) 
		+ "\nClaim group : "
		+ chunk.group
		+ "\nposition : " 
		+ chunk.x 
		+ ", " 
		+ chunk.z)
		.button("Delete this claim")
		.button("Delete all claims of this group")
		.show(player).then(res => {
			if (!res || res.canceled) return;

			if (res.selection === 0) {
				Chunk.remove_chunk(chunk);
				tellraw(player, "§aClaim deleted")
			} else {
				deleteGroup(player, ply, DB.db_faction.get(chunk.faction_name), chunk.group);
				tellraw(player, "§aClaim deleted")
			}
		})
}