import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { DB } from "../../Object/database/database";

export function hasAtLeastOneLink( ply: Ply, player: Player) : boolean {
    return DB.db_link.size > 0;
} 