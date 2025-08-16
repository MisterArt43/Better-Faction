import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { DB } from "../../Object/database/database";

export function WarpNotEmpty( ply: Ply, player: Player) : boolean {
	return !!DB.db_warp.size
}