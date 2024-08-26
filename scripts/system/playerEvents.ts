import { world } from "@minecraft/server";
import { DB } from "../Object/database/database";
import { log } from "../Object/tool/tools";
import { formatCreationDayTime } from "../Object/tool/dateTools";
import { factionRank } from "../Object/faction/Faction";
import { cmd_permission } from "../Object/database/db_map";

world.afterEvents.playerJoin.subscribe(data => {
	const date = Date.now();
	let ply = DB.db_player.get(data.playerName);
	if (ply !== undefined) {
		log("§7" + formatCreationDayTime(date, DB.db_map.UTC) + " §7[Join§7] §e" + ply.name);
		ply.remove_to_update_player();
		ply.lastConnect = date;
		ply.add_to_update_player();
	}
});

world.afterEvents.playerLeave.subscribe((data) => {
	const date = Date.now();
	let ply = DB.db_player.get(data.playerName);
	if (ply !== undefined) {
		log("§7" + formatCreationDayTime(date, DB.db_map.UTC) + " §7[Leave§7] §e" + ply.name);
		DB.db_player_online.delete(data.playerName);
		ply.remove_to_update_player();
		ply.lastConnect = date;
		ply.add_to_update_player();
	}
});


world.beforeEvents.explosion.subscribe((data) => {
	data.getImpactedBlocks().forEach((block) => {
		const xChunk = (block.location.x >> 4).toFixed(0);
		const zChunk = (block.location.z >> 4).toFixed(0);
		const chunk = DB.db_chunk.get(xChunk + "," + zChunk + data.dimension.id);
		if (chunk !== undefined && chunk.faction_name === "Admin") {
			data.cancel = true;
			return;
		}
	});
});


world.beforeEvents.playerBreakBlock.subscribe((data) => {
	const player = DB.db_player.get(data.player.name);
	if (!player) {
		data.cancel = true;
		return;
	}
	if (player.permission <= cmd_permission.admin) return;
	const xChunk = (data.block.location.x >> 4).toFixed(0);
	const zChunk = (data.block.location.z >> 4).toFixed(0);
	const chunk = DB.db_chunk.get(xChunk + "," + zChunk + data.dimension.id);
	if (chunk !== undefined) {
		if (chunk.faction_name !== player.faction_name) {
			if (chunk.permission.length !== 0 && 
				(chunk.permission.find((p) => p.name === player.name)?.permission?.canBreak ?? false)) {
			}
		}
		else {
			if (chunk?.rankPermission.length !== 0 ?? false) {
				const faction = DB.db_faction.get(player.faction_name);
				if (faction !== undefined) {
					const rank = faction.playerList.find((p) => p.name === player.name)!.permission;
					const permission = chunk.rankPermission.find((p) => p.rank === rank);
					if (permission?.permission?.canBreak ?? false) {
						return;
					}
				}
			}
		}
		if (chunk.defaultPermission.canBreak) return //log("default permission OK");
		data.cancel = true;
	}
});

world.beforeEvents.playerPlaceBlock.subscribe((data) => {
	const player = DB.db_player.get(data.player.name);
	if (!player) {
		data.cancel = true;
		return;
	}
	if (player.permission <= cmd_permission.admin) return;
	const xChunk = (data.block.location.x >> 4).toFixed(0);
	const zChunk = (data.block.location.z >> 4).toFixed(0);
	const chunk = DB.db_chunk.get(xChunk + "," + zChunk + data.dimension.id);
	if (chunk !== undefined) {
		if (chunk.faction_name !== player.faction_name) {
			if (chunk.permission.length !== 0 && 
				(chunk.permission.find((p) => p.name === player.name)?.permission?.canPlace ?? false)) {
				return;
			}
		}
		else {
			if (chunk?.rankPermission.length !== 0 ?? false) {
				const faction = DB.db_faction.get(player.faction_name);
				if (faction !== undefined) {
					const rank = faction.playerList.find((p) => p.name === player.name)!.permission;
					const permission = chunk.rankPermission.find((p) => p.rank === rank);
					if (permission?.permission?.canPlace ?? false) {
						return;
					}
				}
			}
		}
		if (chunk.defaultPermission.canPlace) return;
		data.cancel = true;
	}
});

world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
	const player = DB.db_player.get(data.player.name);
	if (!player) {
		data.cancel = true;
		return;
	}
	if (player.permission <= cmd_permission.admin) return;
	const xChunk = (data.block.location.x >> 4).toFixed(0);
	const zChunk = (data.block.location.z >> 4).toFixed(0);
	const chunk = DB.db_chunk.get(xChunk + "," + zChunk + data.player.dimension.id);
	if (chunk !== undefined) {
		if (chunk.faction_name !== player.faction_name) {
			if (chunk.permission.length !== 0 && 
				(chunk.permission.find((p) => p.name === player.name)?.permission?.canInteract ?? false)) {
				return;
			}
		}
		else {
			if (chunk?.rankPermission.length !== 0 ?? false) {
				const faction = DB.db_faction.get(player.faction_name);
				if (faction !== undefined) {
					const rank = faction.playerList.find((p) => p.name === player.name)!.permission;
					const permission = chunk.rankPermission.find((p) => p.rank === rank);
					if (permission?.permission?.canInteract ?? false) {
						return;
					}
				}
			}
		}
		if (chunk.defaultPermission.canInteract) return;
		data.cancel = true;
	}
});