import { ModalFormData } from "@minecraft/server-ui"
import { Player, world } from "@minecraft/server";

import { ChunkPermission } from "./ChunkPermission";
import { ChunkPlayerPermission } from "./ChunkPlayerPermission";
import { ChunkRankPermission } from "./ChunkRankPermission";
import { Ply } from "../player/Ply";
import { Server, hexToText, log, sleep, textToHex } from "../tool/tools";
import { db_faction, factionRank } from "../faction/Faction";


export class Chunk {
	public x: number;
	public z: number;
	public owner: Player['name'];
	public faction_name: string;
	public date: number;
	public defaultPermission: ChunkPermission;
	public permission: ChunkPlayerPermission[];
	public rankPermission: ChunkRankPermission[];
	public dimension: string;
	public group: string;
	[key: string]: any;

	constructor(xChunk: number, zChunk: number, owner: Player['name'], date: number, faction: string, dimensionID: string, chunkPermission?: ChunkPermission, group?: string) {
		if (db_chunk.get(xChunk + "," + zChunk + dimensionID) !== undefined) {throw log("§7§l(constructor chunk) §r§cchunk already exist");}
		this.x = xChunk;
		this.z = zChunk;
		this.owner = owner;
		this.faction_name = faction;
		this.date = date;

		this.defaultPermission = chunkPermission ?? new ChunkPermission(false, false, false);
		this.permission = new Array();
		this.rankPermission = new Array();
		if (faction !== "Admin") {
			this.rankPermission.push(new ChunkRankPermission(factionRank.Leader, new ChunkPermission(true, true, true)));
			this.rankPermission.push(new ChunkRankPermission(factionRank.Officer, new ChunkPermission(true, true, true)));
			this.rankPermission.push(new ChunkRankPermission(factionRank.Member, new ChunkPermission(true, true, true)));
			this.rankPermission.push(new ChunkRankPermission(factionRank.Visitor, new ChunkPermission(false, false, false)));
		}
		this.dimension = dimensionID;
		this.group = group ? group : "none";
		return this;
	}

	static async UpdateDB() {
		if (db_chunk.size > 0 && isLoaded === false) {
			let counter = 1;
			for (let obj of db_chunk.values()) {
				obj.remove_to_update_display();
				let new_obj = new Chunk(0,0,"update", Date.now(), "Admin", "overworld");
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
				new_obj.add_to_update_faction();
				obj = new_obj;
				if (counter++ % 37 === 0) await sleep(1);
			};
			log("§8[Display] §7Database Updated");
		}
		else {
			log("cannot update database")
		}
	}


	async UI_chunkEditPermission(ply : Ply, pl : Player, permission : ChunkPermission, toDeleteOption : boolean) : Promise<ChunkPermission | boolean | undefined> {
		let form = new ModalFormData()
		.title("Claim Edit")
		.toggle("§eAllow Break", permission.getCanBreak())
		.toggle("§eAllow Place", permission.getCanPlace())
		.toggle("§eAllow Interact", permission.getCanInteract())
		if (toDeleteOption) form.toggle("§cDelete This Permission", false)
		return await form.show(pl).then(res => {
			if (res.canceled || res?.formValues === undefined)
				return undefined;
			if (typeof res.formValues[0] !== "boolean") return undefined;
			if (typeof res.formValues[1] !== "boolean") return undefined;
			if (typeof res.formValues[2] !== "boolean") return undefined;
			permission.setCanBreak(res.formValues[0]);
			permission.setCanPlace(res.formValues[1]);
			permission.setCanInteract(res.formValues[2]);
			if (toDeleteOption && res.formValues[3]) return true;
			return permission;
		})
	}

	static async initDB_chunk(wait_db_faction: Promise<void>) {
		if (db_chunk.size === 0) {
			const objectiveName = "db_chunk";
			await Server.runCommandAsync(`scoreboard objectives add ${objectiveName} dummy`);
			const start = Date.now();
			await wait_db_faction;
			try {
				const objective = world.scoreboard.getObjective(objectiveName) ?? world.scoreboard.addObjective("db_chunk", "");
				const sc = objective.getScores();
				const nbParticipants = sc.length;
				const batchSize = 100 >>> 0;
				const batchNumber = Math.ceil(nbParticipants / batchSize);

				const progressBar = "§a[DB] §7loading db_chunk... §e";
				const percentageUnit = 100 / nbParticipants;
				loadDatabase.chunk = progressBar + "0.00%";

				for (let i = 0; i < batchNumber; i++) {
					const batchStart = i * batchSize;
					const batchEnd = batchStart + batchSize;
					const batch = batchEnd < nbParticipants ? sc.slice(batchStart, batchEnd) : sc.slice(batchStart);

					const updateDbChunkPromises = batch.map(async (score) => {
						const db = score.participant.displayName.match(/(?<=\$db_chunk\()[0-9a-f\s]+(?=\))/g);
						if (!db) {
							log("§cError: Mismatch data in db_chunk, try deleting the database and restarting the server. Contact the developer.");
							return;
						}
						const chunk = JSON.parse(hexToText(db.join(""))) as Chunk;

						// Update db_chunk map
						const key = `${chunk.x},${chunk.z + chunk.dimension}`
						const existingChunk = db_chunk.get(key);

						if (existingChunk) {
							// Update existing chunk data
							log(`§cDuplicate chunk found, fixing ${chunk.x}, ${chunk.z}`)
							objective.removeParticipant(score.participant);
						} else {
							if (chunk.x === undefined || chunk.z === undefined || chunk.dimension === undefined) {
								log("§cError: Claim chunk data is undefined, Claim Leak is possible");
								objective.removeParticipant(score.participant);
								return;
							}
							const faction = db_faction.get(chunk.faction_name)
							if (faction === undefined) {
								log("§cError: Faction chunk data is undefined for this chunk : " + key);
								objective.removeParticipant(score.participant);
								return;
							}
							faction.claim.set(key, chunk);
							db_chunk.set(key, chunk);
							const GC = db_group_chunk.get(chunk.group + chunk.faction_name);
							if (GC === undefined) {
								db_group_chunk.set(chunk.group + chunk.faction_name, [chunk]);
							}
							else {
								GC.push(chunk);
								db_group_chunk.set(chunk.group + chunk.faction_name, GC);
							}
						}
					});
					// Update progress bar
					loadDatabase.chunk = progressBar + (batchEnd * percentageUnit).toFixed(2) + "%";
					await Promise.all(updateDbChunkPromises);
				}
				loadDatabase.chunk = progressBar + "100%";
			} catch (e) {
				log("§7[DB] can't find any database for db_chunk, creating a new one " + e);
			}

			const end = Date.now();
			log("§7db_chunk loaded in " + ((end - start) / 1000) + " second(s)");
		}
	}
	
	static add_chunk(chunk: Chunk) {
		if (db_chunk.has(chunk.x + "," + chunk.z)) return log(`§cDuplicate chunk found, fixing ${chunk.x}, ${chunk.z}`);

		Server.runCommandAsync("scoreboard players set \"$db_chunk(" + textToHex(JSON.stringify(chunk)) + ")\" db_chunk 1");
		db_chunk.set(chunk.x + "," + chunk.z + chunk.dimension, chunk); //to rework because unefficient when updating
		db_faction.get(chunk.faction_name)!.claim.set(chunk.x + "," + chunk.z + chunk.dimension, chunk);
	}

	static remove_chunk(chunk: Chunk) {
		if (!db_chunk.has(chunk.x + "," + chunk.z + chunk.dimension)) log(`§cERROR: try to remove a chunk that doesn't exist, ${chunk.x}, ${chunk.z}, possible duplication in the database`);

		Server.runCommandAsync("scoreboard players reset \"$db_chunk(" + textToHex(JSON.stringify(chunk)) + ")\" db_chunk");
		db_chunk.delete(chunk.x + "," + chunk.z + chunk.dimension);
		db_faction.get(chunk.faction_name)!.claim.delete(chunk.x + "," + chunk.z + chunk.dimension);
	}

	add_to_update_chunk() {
		Server.runCommandAsync("scoreboard players set \"$db_chunk(" + textToHex(JSON.stringify(this)) + ")\" db_chunk 1");
	}

	remove_to_update_chunk() {
		Server.runCommandAsync("scoreboard players reset \"$db_chunk(" + textToHex(JSON.stringify(this)) + ")\" db_chunk");
	}
}

export let db_chunk: Map<string, Chunk> = new Map<string, Chunk>();
export let db_group_chunk: Map<string, Chunk[]> = new Map<string, Chunk[]>();