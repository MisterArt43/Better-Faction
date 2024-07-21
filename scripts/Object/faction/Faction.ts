import { Player, Vector3, world } from "@minecraft/server";
import { DB } from "../database/database";
import { Vector_2, Vector_3 } from "../tool/object/Vector";
import { Server, hexToText, log, textToHex } from "../tool/tools";


export class Faction {
	public name: string;
	public description: string;
	public color: string;
	public separator: string;
	public creationDate: number;
	public owner: Player['name'];
	public bank: number;
	public power: number;
	public ally: string[];
	public enemy: string[];
	public invitList: string[];
	public playerList: faction_member[];
	public memberLimit: number;
	public isFhome: boolean;
	public Fhome: Vector_3 | null;
	public isOpen: boolean;
	public claim: Vector_2[];

	/**
	 * @param {string} Fname 
	 * @param {string} plName 
	 */
	constructor(Fname: string, plName: Player['name']) {
		this.name = Fname;
		this.description = "";
		this.color = "§6";
		this.separator = DB.db_map.factionSeparator;
		this.creationDate = new Date().getTime();
		this.owner = plName;
		this.bank = 0;
		this.power = 5;
		this.ally = new Array();
		this.enemy = new Array();
		this.invitList = new Array();
		this.playerList = [new faction_member(plName, factionRank.Leader)];
		this.memberLimit = DB.db_map.factionMemberLimit;
		this.isFhome = DB.db_map.isFhome;
		this.Fhome = null;
		this.isOpen = false;
		this.claim = new Array();
	}

	static async initDB_faction() {
		if (db_faction.size === 0) {
			const objectiveName = "db_faction";
			await Server.runCommandAsync(`scoreboard objectives add ${objectiveName} dummy`);
			const start = Date.now();
	
			try {
				const objective = world.scoreboard.getObjective(objectiveName) ?? world.scoreboard.addObjective("db_faction", "");
				const sc = objective.getScores();
				const nbParticipants = sc.length;
				const batchSize = 100 >>> 0;
				const batchNumber = Math.ceil(nbParticipants / batchSize);
	
				const progressBar = "§a[DB] §7loading db_faction... §e";
				const percentageUnit = 100 / nbParticipants;
				loadDatabase.faction = progressBar + "0.00%";
	
				for (let i = 0; i < batchNumber; i++) {
					const batchStart = i * batchSize;
					const batchEnd = batchStart + batchSize;
					const batch = batchEnd < nbParticipants ? sc.slice(batchStart, batchEnd) : sc.slice(batchStart);
	
					const updateDbPlayerPromises = batch.map(async (score) => {
						const db = score.participant.displayName.match(/(?<=\$db_faction\()[0-9a-f\s]+(?=\))/g);
						if (!db) {
							log("§cError: Mismatch data in db_faction, try deleting the database and restarting the server. Contact the developer.");
							return;
						}
						const factionObj = JSON.parse(hexToText(db.join(""))) as Faction;
						let faction = Faction.fromObject(factionObj);
						
						// Update db_faction map
						const existingObject = db_faction.get(faction.name);
	
						if (existingObject) {
							// Update existing faction data
							log(`§cDuplicate faction found, fixing ${faction.name}`)
							objective.removeParticipant(score.participant);
						} else {
							db_faction.set(`${faction.name}`, faction);
						}
					});
					// Update progress bar
					loadDatabase.faction = progressBar + (batchEnd * percentageUnit).toFixed(2) + "%";
					await Promise.all(updateDbPlayerPromises);
				}
				loadDatabase.faction = progressBar + "100%";
			} catch (e) {
				log("§7[DB] can't find any database for db_faction, creating a new one " + e);
			}
	
			const end = Date.now();
			log("§7db_faction loaded in " + ((end - start) / 1000) + " second(s)");
		}
	}

	public static fromObject(faction: Faction) : Faction {
		return Object.assign(new Faction(faction.name, faction.owner), faction);
	}

	isAtLeastRank(member: faction_member | faction_member['name'], fRank: (typeof factionRank[keyof typeof factionRank])) {
		if (typeof member === "string")
			member = this.playerList.find(p => p.name === member)!;
		return member?.permission <= fRank || false;
	}

	setFhome(location: Vector_3 | Vector3) {
		this.Fhome = new Vector_3(location).normalize();
	}
	
	remove_to_update_faction() {
		if (this === undefined) return;
		Server.runCommandAsync("scoreboard players reset \"$db_faction(" + textToHex(JSON.stringify(this)) + ")\" db_faction");
	}

	add_to_update_faction() {
		if (this === undefined) return;
		Server.runCommandAsync("scoreboard players set \"$db_faction(" + textToHex(JSON.stringify(this)) + ")\" db_faction 1");
	}


	static add_faction(faction: Faction | undefined) {
		if (faction === undefined) return;
		if (db_faction.has(faction.name)) {
			log(`§cDuplicate faction found, fixing ${faction.name}`);
			Faction.remove_faction(db_faction.get(faction.name));
		}
		db_faction.set(faction.name, faction);
		Server.runCommandAsync("scoreboard players set \"$db_faction(" + textToHex(JSON.stringify(faction)) + ")\" db_faction 1");
	}

	static remove_faction(faction: Faction | undefined) {
		if (faction === undefined) return;
		Server.runCommandAsync("scoreboard players reset \"$db_faction(" + textToHex(JSON.stringify(faction)) + ")\" db_faction");
		db_faction.delete(faction.name);
	}

	getRankFromName(name: string) {
		return this.playerList.find(p => p.name === name)?.permission;
	}

	/** @warn This function doesn't return reference because of map */
	getNamesFromRank(rank: (typeof factionRank[keyof typeof factionRank])) {
		return this.playerList.filter(p => p.permission === rank)?.map(p => p.name);
	}

	getMembersFromRank(rank: (typeof factionRank[keyof typeof factionRank])) {
		return this.playerList.filter(p => p.permission === rank);
	}
}

export const factionRank = {
	"Leader": 0,
	"Officer": 1,
	"Member": 2,
	"Visitor": 3
} as const;

export class faction_member {
	public name: string;
	public permission: (typeof factionRank[keyof typeof factionRank]);
	
	constructor(name: string, permission: (typeof factionRank[keyof typeof factionRank])) {
		this.name = name;
		this.permission = permission;
	}

	getRankName() {
		return Object.keys(factionRank)[this.permission];
	}
}

export let db_faction: Map<Faction['name'], Faction> = new Map<Faction['name'], Faction>();
