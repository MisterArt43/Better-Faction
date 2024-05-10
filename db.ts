import * as MC from '@minecraft/server';
import { loadDatabase } from './conf_db';

export class ExtendedMap<K, V> extends Map<K, V> {
    dbName: string;

	constructor(dbName: string) {
		super();
		this.dbName = dbName;
	}
	save(key: K, value: V) {
		if (this.has(key)) {
            log(`§cDuplicate data found, fixing ${key}`);
            this.remove(key);
        }
		this.set(key, value);
		Server.runCommandAsync(`scoreboard players set "$${this.dbName}(${textToHex(JSON.stringify(value))})" ${this.dbName} 1`);
	}
    /**
     * Ajoute un élément à la base de données.
     * @param {K} key - Clé de l'élément.
     * @param {V} value - Valeur de l'élément.
     */
    add(key: K, value: V) {
        if (this.has(key)) {
            log(`§cDuplicate data found, cannot add ${key}`);
			return;
        }
        this.set(key, value);
        Server.runCommandAsync(`scoreboard players set "$${this.dbName}(${textToHex(JSON.stringify(value))})" ${this.dbName} 1`);
    }

    /**
     * Supprime un élément de la base de données.
     * @param {K} key - Clé de l'élément à supprimer.
     */
    remove(key: K) {
		const toDelete = this.get(key);
        if (toDelete) {
            this.delete(key);
			Server.runCommandAsync(`scoreboard players reset "$${this.dbName}(${textToHex(JSON.stringify(toDelete))})" ${this.dbName}`);
        }
    }
}

const Server = MC.world.getDimension('overworld');

export async function initDB(dbName: string, keyName: any, dbMap: ExtendedMap<any, any>) {
	if (dbMap.size === 0) {
		await Server.runCommandAsync(`scoreboard objectives add ${dbName} dummy`);
		const start = Date.now();

		try {
			const objective = MC.world.scoreboard.getObjective(dbName)!;
			const sc = objective.getScores();
			const nbParticipants = sc.length;
			const batchSize = 100 >>> 0;
			const batchNumber = Math.ceil(nbParticipants / batchSize);

			const progressBar = "§a[DB] §7loading db_chunk... §e";
			const percentageUnit = 100 / nbParticipants;
			loadDatabase[dbName] = progressBar + "0.00%";

			for (let i = 0; i < batchNumber; i++) {
				const batchStart = i * batchSize;
				const batchEnd = batchStart + batchSize;
				const batch = batchEnd < nbParticipants ? sc.slice(batchStart, batchEnd) : sc.slice(batchStart);

				const updateDbPromises = batch.map(async (score) => {
					const db = score.participant.displayName.match(new RegExp(`(?<=\\$${dbName}\\()[0-9a-f\\s]+(?=\\))`, 'g'));
					if (!db) {
						log(`§cError: Mismatch data in ${dbName}`);
						return;
					}
					let data = JSON.parse(hexToText(db.join("")));

					
					// Update db map
					const existingData = dbMap.get(data[keyName]);

					if (existingData) {
						// Update existing data data
						log(`§cDuplicate data found, fixing ${data[keyName]}`);
						objective.removeParticipant(score.participant);
					} else {
						if (data[keyName] === undefined) {
							log("§cError: data is undefined, Leak is possible");
							objective.removeParticipant(score.participant);
							return;
						}
						dbMap.set(data[keyName], data);
					}
				});
				// Update progress bar
				loadDatabase[dbName] = progressBar + (batchEnd * percentageUnit).toFixed(2) + "%";
				await Promise.all(updateDbPromises);
			}
			loadDatabase[dbName] = progressBar + "100%";
		} catch (e) {
			log(`§7[DB] can't find any database for ${dbName}, creating a new one ` + e);
		}

		const end = Date.now();
		log(`§7${dbName} loaded in ${(end - start) / 1000} second(s)`);
	}
}

function log(text: string) { Server.runCommandAsync(`tellraw @a[tag=log] {"rawtext":[{"text":"§7{log} §r${text.toString().replace(/"/g, "\'").replace(/\n/g, "§r\n")}"}]}`) }

/**
 * Convert string to Hexadecimal
 */
function textToHex(text: string): string {
	return text.split("").map((char) => {
		return char.charCodeAt(0).toString(16);
	}).join(" ");
}

/**
 * Convert Hexadecimal to string
 */
function hexToText(hex: string): string {
	return hex.split(" ").map((char) => {
		return String.fromCharCode(parseInt(char, 16));
	}).join("");
}

