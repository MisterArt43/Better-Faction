import { Player, world } from "@minecraft/server";
import { DB } from "../Object/database/database";
import { log, tellraw } from "../Object/tool/tools";
import { formatCreationDayTime } from "../Object/tool/dateTools";
import { cmd_permission } from "../Object/database/db_map";
import { Delay } from "../Object/player/Delay";

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
			if (((chunk?.rankPermission.length ?? 0) !== 0)) {
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
			if ((chunk?.rankPermission.length ?? 0) !== 0) {
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
			if ((chunk?.rankPermission?.length ?? 0) !== 0) {
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

world.afterEvents.pistonActivate.subscribe(data => {
	//find a way to block claim pushed block
})

world.afterEvents.entityDie.subscribe(data => {
	let playerKiller = data.damageSource?.damagingEntity;
	let playerKilled = data.deadEntity;
	if (playerKilled instanceof Player) {
		let pl = DB.db_player.get(playerKilled.name)!;
		pl.remove_to_update_player();
		pl.deathCount++;
		if (pl.power > DB.db_map.powerLimit.min) pl.power--;
		pl?.add_to_update_player();
		if (playerKiller instanceof Player) {
			let pl2 = DB.db_player.get(playerKiller.name)!;
			pl2.remove_to_update_player();
			pl2.killCount++;
			pl2.add_to_update_player();
			log(`§7[§cKill§7] §e${pl2.name} §7killed §e${pl.name}`)
		}
		else log(`§7[§cDeath§7] §e${pl.name} §7died`)
	}
});

world.afterEvents.entityHurt.subscribe(data => {
	if (!isLoaded) return;
	if (data.hurtEntity.typeId === "minecraft:player") {
		const player = world.getAllPlayers().find((p) => p.nameTag === data.hurtEntity.nameTag)!;
		if (data.damage < 0) return
		if (data.damageSource.damagingEntity?.typeId === "minecraft:player") {
			if (DB.db_delay.has(player.name)) {
				DB.db_delay.get(player.name)?.update_time(DB.db_map.playerHurtDelay);
			}
			else {
				new Delay(player.name, DB.db_map.playerHurtDelay);
			}
		}
		else {
			if (DB.db_delay.has(player.name)) {
				DB.db_delay.get(player.name)?.update_time(DB.db_map.randomHurtDelay);
			}
			else {
				new Delay(player.name, DB.db_map.randomHurtDelay);
			}
		}
	}
});

world.afterEvents.playerSpawn.subscribe(data => {
	if (isLoaded) {
		const pl = DB.db_player.get(data.player.name)!;
		if (DB.db_map.v != version && pl.permission <= cmd_permission.admin) {
			tellraw(data.player.name, "§7[DB] database version is different from the current version, ask a Owner to do " + globalThis.prefix + "update");
		}
	}
})