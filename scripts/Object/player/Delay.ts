import { Player, world } from "@minecraft/server";
import { DB } from "../database/database";
import { Server, hexToText, log, sleep, tellraw, textToHex } from "../tool/tools";


export class Delay {
	public name: string;
	public time: number;
	[key: string]: any;

	constructor(name: string, seconds: number) {
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
		if (player.hasTag("tpCanceled")) {
			tellraw(player, "§cYou can't use teleportation commands in this area.");
			return true;
		}
		return false;
	}

	static async initDB_delay() {
		if (db_delay.size === 0) {
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
						let delayObj = JSON.parse(hexToText(db.join(""))) as Delay;
						const delay = Delay.fromObject(delayObj);
						
						// Update db_delay map
						const existingObject = db_delay.get(delay.name);
	
						if (existingObject) {
							// Update existing delay data
							log(`§cDuplicate delay found, fixing ${delay.name}`)
							objective.removeParticipant(score.participant);
						} else {
							db_delay.set(`${delay.name}`, delay);
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

	public static fromObject(delay: Delay) : Delay {
		const newDelay = new Delay(delay.name, delay.time);
		
		return newDelay;
	}

	static async UpdateDB() {
		if (db_delay.size > 0 && isLoaded === false) {
			let counter = 1;
			for (let obj of db_delay.values()) {
				obj.remove_to_update_delay()
				let new_obj = new Delay("update", 20);
				let old_key = Object.keys(obj);
				let new_key = Object.keys(new_obj);
				let old_value = Object.values(obj);

				for (let i = 0; i < new_key.length; i++) {
					for (let j = 0; j < old_key.length; j++) {
						if (new_key[i] === old_key[j]) {
							new_obj[new_key[i]] = old_value[j];
							break;
						}
					}
				}
				//log("\n§cOld => §7" + JSON.stringify(obj) + "\n§aNew => §7" + JSON.stringify(new_obj));
				new_obj.add_to_update_delay();
				obj = new_obj;
				if (counter++ % 37 === 0) await sleep(1);	
			};
			log("§8[Delay] §7Database Updated");
		}
		else {
			log("cannot update database")
		}
	}
}

export let db_delay: Map<Delay['name'], Delay> = new Map<Delay['name'], Delay>();
