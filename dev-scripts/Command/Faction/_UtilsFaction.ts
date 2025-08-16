import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { DB } from "../../Object/database/database";
import { factionRank } from "../../Object/faction/Faction";

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

export function factionDbNotEmty( ply: Ply, player: Player) : boolean {
	if (DB.db_faction.size > 0) {
		return true;
	}
	return false;
}

export function haveNoFactionAndFactionDbNotEmpty( ply: Ply, player: Player) : boolean {
	if (DB.db_faction.size > 0 && ply.faction_name === null) {
		return true;
	}
	return false;
}

export function isAtLeastOfficerAndHaveMoreThanOneMember( ply: Ply, player: Player) : boolean {
	if (ply.faction_name === null) {
		return false;
	}
	if (DB.db_faction.get(ply.faction_name)!.playerList.length === 1){
		return false;
	}
	return isAtLeastOfficer(ply, player);
}

export function isLeaderAndCanSetHome( ply: Ply, player: Player) : boolean {
	if (ply.faction_name === null) {
		return false;
	}
	if (!DB.db_faction.get(ply.faction_name)!.isFhome) {
		return false;
	}
	return isLeader(ply, player);
}