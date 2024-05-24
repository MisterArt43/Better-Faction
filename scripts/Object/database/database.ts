import { world } from "@minecraft/server";
import { DB_Map, db_map } from "./db_map";
import { Ply, db_player, db_player_online } from "../player/Ply";
import { Faction, db_faction } from "../faction/Faction";
import { Admin, db_admin } from "../player/Admin";
import { Warp, db_warp } from "../warp/Warp";
import { Display, db_display } from "../display/Display";
import { Delay, db_delay } from "../player/Delay";
import { Chunk, db_chunk } from "../chunk/Chunk";

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