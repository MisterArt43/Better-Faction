import { ModalFormData } from "@minecraft/server-ui"
import { Player, world } from "@minecraft/server";

import { ChunkPermission } from "./ChunkPermission";
import { ChunkPlayerPermission } from "./ChunkPlayerPermission";
import { ChunkRankPermission } from "./ChunkRankPermission";
import { Ply } from "../player/Ply";
import { Server, hexToText, log } from "../tool/tools";
import { factionRank } from "../faction/Faction";

export let db_chunk: Map<string, Chunk> = new Map<string, Chunk>();
export let db_group_chunk: Map<string, Chunk[]> = new Map<string, Chunk[]>();

export class Chunk {
	public x: number;
	public z: number;
	public owner: Player['name'];
	public faction_name: string;
	public date: Date;
	public defaultPermission: ChunkPermission;
	public permission: ChunkPlayerPermission[];
	public rankPermission: ChunkRankPermission[];
	public dimension: string;
	public group: string;

	constructor(xChunk: number, zChunk: number, owner: Player['name'], date: Date, faction: string, dimensionID: string, chunkPermission?: ChunkPermission, group?: string) {
		if (db_chunk.get(xChunk + "," + zChunk + dimensionID) !== undefined) {throw log("§7§l(constructor chunk) §r§cchunk already exist");}
		this.x = xChunk;
		this.z = zChunk;
		this.owner = owner;
		this.faction_name = faction;
		this.date = date;

		this.defaultPermission = chunkPermission ?? new ChunkPermission(false, false, false);
		this.permission = new Array();
		if (faction !== "Admin") {
			this.rankPermission = new Array();
			this.rankPermission.push(new ChunkRankPermission(factionRank.Leader, new ChunkPermission(true, true, true)));
			this.rankPermission.push(new ChunkRankPermission(factionRank.Officer, new ChunkPermission(true, true, true)));
			this.rankPermission.push(new ChunkRankPermission(factionRank.Member, new ChunkPermission(true, true, true)));
			this.rankPermission.push(new ChunkRankPermission(factionRank.Visitor, new ChunkPermission(false, false, false)));
		}
		this.dimension = dimensionID;
		this.group = group ? group : "none";
		return this;
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

	static async initDB_chunk() {
		if (db_chunk.size === 0) {
			const objectiveName = "db_chunk";
			await Server.runCommandAsync(`scoreboard objectives add ${objectiveName} dummy`);
			const start = Date.now();

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

					const updateDbPlayerPromises = batch.map(async (score) => {
						const db = score.participant.displayName.match(/(?<=\$db_chunk\()[0-9a-f\s]+(?=\))/g);
						if (!db) {
							log("§cError: Mismatch data in db_chunk, try deleting the database and restarting the server. Contact the developer.");
							return;
						}
						/** @type {Chunk} */
						let chunk = JSON.parse(hexToText(db.join("")));


						// Update db_chunk map
						const existingChunk = db_chunk.get(`${chunk.x},${chunk.z + chunk.dimension}`);

						if (existingChunk) {
							// Update existing chunk data
							log(`§cDuplicate chunk found, fixing ${chunk.name}`)
							objective.removeParticipant(score.participant);
						} else {
							if (chunk.x == undefined || chunk.z == undefined || chunk.dimension == undefined) {
								log("§cError: Claim chunk data is undefined, Claim Leak is possible");
								objective.removeParticipant(score.participant);
								return;
							}
							db_chunk.set(`${chunk.x},${chunk.z + chunk.dimension}`, chunk);
							let GC = db_group_chunk.get(chunk.group + chunk.faction_name);
							if (GC == undefined) {
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
					await Promise.all(updateDbPlayerPromises);
				}
				loadDatabase.chunk = progressBar + "100%";
			} catch (e) {
				log("§7[DB] can't find any database for db_chunk, creating a new one " + e);
			}

			const end = Date.now();
			log("§7db_chunk loaded in " + ((end - start) / 1000) + " second(s)");
		}
	}
}