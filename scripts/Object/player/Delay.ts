import { Player, world } from "@minecraft/server";
import { DB } from "../database/database";
import { Server, hexToText, log, tellraw, textToHex } from "../tool/tools";

export let db_delay: Map<Delay['name'], Delay> = new Map<Delay['name'], Delay>();

export class Delay {
	public name: string;
	public time: number;

	constructor(name: string, seconds: number) {
		if (seconds === 0) return;
		const hasDelay = db_delay.get(name);
		if (hasDelay) this.remove_to_update_delay();
		this.name = name;
		this.time = seconds * 1000 + new Date().getTime();
		hasDelay ? this.add_to_update_delay() : Delay.add_delay(this);
		tellraw(name, "§cYou can't teleport for " + seconds + " seconds");
	}

	static add_delay(delay: Delay) {
		if (db_delay.has(delay.name)) {
			return log("§cadd delay error, the delay already exist");
		}
		db_delay.set(delay.name, delay);
		Server.runCommandAsync("scoreboard players set \"$db_delay(" + textToHex(JSON.stringify(delay)) + ")\" db_delay 1");
	}

	static remove_delay(delay: Delay) {
		if (!db_delay.has(delay.name)) {
			return log("§cFatal Error: Cannot remove delay " + delay.name + ", possible leak in the database");
		}
		Server.runCommandAsync("scoreboard players reset \"$db_delay(" + textToHex(JSON.stringify(delay)) + ")\" db_delay");
		db_delay.delete(delay.name);
	}

	add_to_update_delay() {
		Server.runCommandAsync("scoreboard players set \"$db_delay(" + textToHex(JSON.stringify(this)) + ")\" db_delay 1");
	}

	remove_to_update_delay() {
		Server.runCommandAsync("scoreboard players reset \"$db_delay(" + textToHex(JSON.stringify(this)) + ")\" db_delay");
	}
	
	update_time(seconds: number) {
		if (seconds === 0) return Delay.remove_delay(this);
		const date = new Date();
		if (date.getTime() >= this.time) {
			tellraw(this.name, "§cYou can't teleport for " + seconds + " seconds");
		}
		this.remove_to_update_delay();
		this.time = seconds * 1000 + date.getTime();
		this.add_to_update_delay();
	}

	check_time() {
		const date = new Date();
		if (date.getTime() >= this.time) {
			Delay.remove_delay(this);
			return true;
		}
		return false;
	}

	static isTpCanceled(player: Player) {
		if (player.hasTag("tpCanceled") && !player.hasTag(adminTag)) {
			tellraw(player, "§cYou can't accept a teleportation request in this area.");
			return true;
		}
		return false;
	}

	static async initDB_delay() {
		if (DB.db_delay.size === 0) {
			const objectiveName = "db_delay";
			await Server.runCommandAsync(`scoreboard objectives add ${objectiveName} dummy`);
			const start = Date.now();
	
			try {
				const objective = world.scoreboard.getObjective(objectiveName) ?? world.scoreboard.addObjective("db_delay", "");
				const sc = objective.getScores();
				const nbParticipants = sc.length;
				const batchSize = 100 >>> 0;
				const batchNumber = Math.ceil(nbParticipants / batchSize);
	
				const progressBar = "§a[DB] §7loading db_delay... §e";
				const percentageUnit = 100 / nbParticipants;
				loadDatabase.warp = progressBar + "0.00%";
	
				for (let i = 0; i < batchNumber; i++) {
					const batchStart = i * batchSize;
					const batchEnd = batchStart + batchSize;
					const batch = batchEnd < nbParticipants ? sc.slice(batchStart, batchEnd) : sc.slice(batchStart);
	
					const updateDbPlayerPromises = batch.map(async (score) => {
						const db = score.participant.displayName.match(/(?<=\$db_delay\()[0-9a-f\s]+(?=\))/g);
						if (!db) {
							log("§cError: Mismatch data in db_delay, try deleting the database and restarting the server. Contact the developer.");
							return;
						}
						let delay = JSON.parse(hexToText(db.join(""))) as Delay;
						
						// Update db_delay map
						const existingObject = DB.db_delay.get(delay.name);
	
						if (existingObject) {
							// Update existing delay data
							log(`§cDuplicate delay found, fixing ${delay.name}`)
							objective.removeParticipant(score.participant);
						} else {
							DB.db_delay.set(`${delay.name}`, delay);
						}
					});
					// Update progress bar
					loadDatabase.delay = progressBar + (batchEnd * percentageUnit).toFixed(2) + "%";
					await Promise.all(updateDbPlayerPromises);
				}
				loadDatabase.delay = progressBar + "100%";
			} catch (e) {
				log("§7[DB] can't find any database for db_delay, creating a new one " + e);
			}
	
			const end = Date.now();
			log("§7db_delay loaded in " + ((end - start) / 1000) + " second(s)");
		}
	} 
}