import { world } from "@minecraft/server";
import { DB_Map, db_map } from "./db_map";
import { Ply, db_player, db_player_online } from "../player/Ply";
import { Faction, db_faction } from "../faction/Faction";
import { Admin, db_admin } from "../player/Admin";
import { Chunk, db_chunk } from "../chunk/chunk";
import { Warp, db_warp } from "../warp/Warp";
import { Display, db_display } from "../display/Display";
import { Delay, db_delay } from "../player/Delay";

export class DB {
	public static db_map = db_map;
	public static db_player = db_player;
	public static db_player_online = db_player_online;
	public static db_faction = db_faction;
	public static db_admin = db_admin;
	public static db_chunk = db_chunk;
	public static db_warp = db_warp;
	public static db_display = db_display;
	public static db_delay = db_delay;
	// public static db_shop = db_Shop;
}

world.afterEvents.worldInitialize.subscribe(() => {
	DB_Map.initDB_map();
	Ply.initDB_player();
	Faction.initDB_faction();
	Admin.initDB_admin();
	Chunk.initDB_chunk();
	Warp.initDB_warp();
	Display.initDB_display();
	Delay.initDB_delay();
});