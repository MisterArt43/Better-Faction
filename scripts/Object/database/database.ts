import { world } from "@minecraft/server";
import { DB_Map, db_map } from "./db_map";
import { Ply, db_player, db_player_online } from "../player/Ply";
import { Faction, db_faction } from "../faction/Faction";
import { Admin, db_admin } from "../player/Admin";
import { Chunk, db_chunk } from "../chunk/Chunk";
import { Warp, db_warp } from "../warp/Warp";
import { Display, db_display } from "../display/Display";
import { Delay, db_delay } from "../player/Delay";
import { log, sleep } from "../tool/tools";
import { commands } from "../../Command/CommandManager";

export class DB {
	public static db_map : DB_Map;
	public static db_player : Map<string, Ply>;
	public static db_player_online : Map<string, Ply>;
	public static db_faction : Map<string, Faction>;
	public static db_admin : Map<string, Admin>;
	public static db_chunk : Map<string, Chunk>;
	public static db_warp : Map<string, Warp>;
	public static db_display = db_display;
	public static db_delay : Map<string, Delay>;

	public static async initialize() {
		log("§7§l[DB] §r§aInitializing databases...");
		await DB_Map.initDB_map();
		this.db_map = db_map;
		Ply.initDB_player();
		Faction.initDB_faction();
		Chunk.initDB_chunk();
		Warp.initDB_warp();
		Display.initDB_display();
		Admin.initDB_admin();
		Delay.initDB_delay();

		this.db_player = db_player;
		this.db_player_online = db_player_online;
		this.db_faction = db_faction;
		this.db_admin = db_admin;
		this.db_chunk = db_chunk;
		this.db_warp = db_warp;
		this.db_display = db_display;
		this.db_delay = db_delay;

		const start = Date.now();
		log("§7§l[CMD] §r§aLoading commands...")
		import('../../Command/Commands').then((module) => {
			const end = Date.now();
			log("§7§l[CMD] §r§aCommands loaded in " + (end - start) + "ms");
		});
	}
	// public static db_shop = db_Shop;
}

world.afterEvents.worldInitialize.subscribe(() => {
	DB.initialize();
});