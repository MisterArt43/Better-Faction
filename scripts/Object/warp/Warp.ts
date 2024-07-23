import { DimensionLocation, Player, world } from "@minecraft/server";
import { Server, hexToText, log, sleep, textToHex } from "../tool/tools"
import { Vector_3_Dim } from "../tool/object/Vector";
import { DB } from "../database/database";


export class Warp {
	public name: string;
	public message: string;
	public displayMessageOnTp: boolean;
	public creator: Player['name'];
	public creationDate: number;
	public editionDate: number;
	public allow: string[];
	public deny: string[];
	public isOpen: boolean;
	public pos: Vector_3_Dim;
	public delay: number;
	public runCommandAsync: string[];
	public log: WarpDelay[];

	constructor(Wname: string, player: Player) {
		const date = Date.now()
		this.name = Wname;
		this.message = "";
		this.displayMessageOnTp = false;
		this.creator = player.name;
		this.creationDate = date;
		this.editionDate = date;
		this.allow = new Array();
		this.deny = new Array();
		this.isOpen = true;
		this.pos = new Vector_3_Dim({ ...player.location, dimension: player.dimension }).normalize();
		this.delay = DB.db_map.warpDelay;
		this.runCommandAsync = new Array();
		this.log = new Array();
	}

	addAllowedTag(player : Player, tag: string) {
		if (this.allow.includes(tag))
			return player.sendMessage("§cThis tag is already allowed");
		this.remove_to_update_warp();
		this.allow.push(tag);
		this.add_to_update_warp();
	}

	addDeniedTag(player : Player, tag: string) {
		if (this.deny.includes(tag))
			return player.sendMessage("§cThis tag is already denied");
		this.remove_to_update_warp();
		this.deny.push(tag);
		this.add_to_update_warp();
	}

	removeAllowedTag(player : Player, tag: string) {
		if (!this.allow.includes(tag))
			return player.sendMessage("§cThis tag doesn't exist in the allowed list");
		this.remove_to_update_warp();
		this.allow.splice(this.allow.indexOf(tag), 1);
		this.add_to_update_warp();
	}

	removeDeniedTag(player : Player, tag: string) {
		if (!this.deny.includes(tag))
			return player.sendMessage("§cThis tag doesn't exist in the denied list");
		this.remove_to_update_warp();
		this.deny.splice(this.deny.indexOf(tag), 1);
		this.add_to_update_warp();
	}

	static add_warp(warp: Warp) {
		if (db_warp.has(warp.name)) {
			return log("§cadd warp error, the warp already exist");
		}
		db_warp.set(warp.name, warp);
		Server.runCommandAsync("scoreboard players set \"$db_warp(" + textToHex(JSON.stringify(warp)) + ")\" db_warp 1");
	}

	static remove_warp(warp: Warp) {
		if (!db_warp.has(warp.name)) {
			return log("§cFatal Error: Cannot remove warp " + warp.name + ", possible leak in the database");
		}
		Server.runCommandAsync("scoreboard players reset \"$db_warp(" + textToHex(JSON.stringify(warp)) + ")\" db_warp");
		db_warp.delete(warp.name);
	}

	add_to_update_warp() {
		Server.runCommandAsync("scoreboard players set \"$db_warp(" + textToHex(JSON.stringify(this)) + ")\" db_warp 1");
	}

	remove_to_update_warp() {
		Server.runCommandAsync("scoreboard players reset \"$db_warp(" + textToHex(JSON.stringify(this)) + ")\" db_warp");
	}

	static async initDB_warp() {
		if (db_warp.size === 0) {
			const objectiveName = "db_warp";
			await Server.runCommandAsync(`scoreboard objectives add ${objectiveName} dummy`);
			const start = Date.now();
	
			try {
				const objective = world.scoreboard.getObjective(objectiveName) ?? world.scoreboard.addObjective("db_warp", "");
				const sc = objective.getScores();
				const nbParticipants = sc.length;
				const batchSize = 100 >>> 0;
				const batchNumber = Math.ceil(nbParticipants / batchSize);
	
				const progressBar = "§a[DB] §7loading db_warp... §e";
				const percentageUnit = 100 / nbParticipants;
				loadDatabase.warp = progressBar + "0.00%";
	
				for (let i = 0; i < batchNumber; i++) {
					const batchStart = i * batchSize;
					const batchEnd = batchStart + batchSize;
					const batch = batchEnd < nbParticipants ? sc.slice(batchStart, batchEnd) : sc.slice(batchStart);
	
					const updateDbPlayerPromises = batch.map(async (score) => {
						const db = score.participant.displayName.match(/(?<=\$db_warp\()[0-9a-f\s]+(?=\))/g);
						if (!db) {
							log("§cError: Mismatch data in db_warp, try deleting the database and restarting the server. Contact the developer.");
							return;
						}
						let warp = JSON.parse(hexToText(db.join(""))) as Warp;
						
						// Update db_warp map
						const existingObject = db_warp.get(warp.name);
	
						if (existingObject) {
							// Update existing warp data
							log(`§cDuplicate warp found, fixing ${warp.name}`)
							objective.removeParticipant(score.participant);
						} else {
							db_warp.set(`${warp.name}`, warp);
						}
					});
					// Update progress bar
					loadDatabase.warp = progressBar + (batchEnd * percentageUnit).toFixed(2) + "%";
					await Promise.all(updateDbPlayerPromises);
				}
				loadDatabase.warp = progressBar + "100%";
			} catch (e) {
				log("§7[DB] can't find any database for db_warp, creating a new one " + e);
			}
	
			const end = Date.now();
			log("§7db_warp loaded in " + ((end - start) / 1000) + " second(s)");
		}
	} 
}

class WarpDelay {
	public name: string;
	public delay: number;

	constructor(name: string, delay: number) {
		this.name = name;
		this.delay = DB.db_map.warpDelay;
	}
}

export let db_warp: Map<Warp['name'], Warp> = new Map<Warp['name'], Warp>();
