import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { DB } from "../../Object/database/database";

export function haveChunk( ply: Ply, player: Player) : boolean {
	return DB.db_chunk.size > 0;
}