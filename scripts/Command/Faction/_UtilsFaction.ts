import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { DB } from "../../Object/database/database";
import { factionRank } from "../../Object/faction/Faction";
import { log } from "../../Object/tool/tools";

export function haveFaction( ply: Ply, player: Player) : boolean {
	if (ply.faction_name !== null) {
		return true;
	}
	return false;
}

export function haveNoFaction( ply: Ply, player: Player) : boolean {
	if (ply.faction_name === null) {
		return true;
	}
	return false;
}

export function isFhomeEnable( ply: Ply, player: Player) : boolean {
	if (ply.faction_name === null) {
		return false;
	}
	if (DB.db_faction.get(ply.faction_name)?.isFhome === true){
		return true;
	}
	return false;
}

export function isLeader( ply: Ply, player: Player) : boolean {
	if (ply.faction_name === null) {
		return false;
	}
	if (DB.db_faction.get(ply.faction_name)?.getRankFromName(ply.name) === factionRank.Leader){
		return true;
	}
	return false;
}

export function isAtLeastOfficer( ply: Ply, player: Player) : boolean {
	if (ply.faction_name === null) {
		return false;
	}
	if (DB.db_faction.get(ply.faction_name)?.isAtLeastRank(ply.name, factionRank.Officer)){
		return true;
	}
	return false;
}