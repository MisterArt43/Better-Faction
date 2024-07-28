import { world } from "@minecraft/server";
import { DB } from "../Object/database/database";
import { log } from "../Object/tool/tools";
import { formatCreationDayTime } from "../Object/tool/dateTools";

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