import { DimensionLocation, Player, Vector3, world } from "@minecraft/server";
import { Home } from "./Home";
import { DB } from "../database/database";
import { Vector_3_Dim } from "../tool/object/Vector";
import { Server, hexToText, log, sleep, textToHex } from "../tool/tools";
import { cmd_module } from "../database/db_map";
import { cmd_permission } from "../../Command/CommandManager";

export let db_player: Map<Ply['name'], Ply> = new Map<Ply['name'], Ply>();
export let db_player_online: Map<Ply['name'], Ply> = new Map<Ply['name'], Ply>();

export class Ply {
	public name : string;
	public nameTag : string;
	public faction_name : string | null;
	public money : number;
	public id : string;
	public homeLimit : number;
	public warn : number;
	public home : Array<Home>;
	public lastMessage : string;
	public isMute : boolean;
	public tpa : Tpa | null;
	public delay : Array<string>;
	public date : number;
	public back : Vector_3_Dim;
	public chat : string;
	public isunban : boolean;
	public lang : string;
	public UTC : number;
	public cmd_module : (typeof cmd_module[keyof typeof cmd_module])[];
	public deathCount : number;
	public killCount : number;
	public power : number;
	public lastPowerRegen : number;
	public timePlayed : number;
	public lastConnect : number;
	public permission : (typeof cmd_permission[keyof typeof cmd_permission]);

	constructor (player : Player) {
		let date = new Date();
		this.name = player.name;
		this.nameTag = player.nameTag;
		this.faction_name = null;
		this.money = 0;
		this.id = player.id;
		this.homeLimit = DB.db_map?.homeLimit ?? 3;
		this.warn = 0;
		this.home = new Array;
		this.lastMessage = "";
		this.isMute = false;
		this.tpa = null;
		this.delay = new Array;
		this.date = date.getTime();
		this.back = new Vector_3_Dim(player.location.x, player.location.y, player.location.z, player.dimension.id);
		this.chat = "all";
		this.isunban = false;
		this.lang = DB.db_map?.defaultLang ?? "en";
		this.UTC = DB.db_map?.UTC ?? 0;
		this.cmd_module = DB.db_map?.default_cmd_module ?? [0];
		this.deathCount = 0;
		this.killCount = 0;
		this.power = 5;
		this.lastPowerRegen = 0;
		this.timePlayed = 0; //in seconds
		this.lastConnect = date.getTime();
		this.permission = cmd_permission.member;
	}

	public update_back_position(location: DimensionLocation) {
		this.back.x = Math.ceil(location.x + 0.0001) - 1;
		this.back.y = Math.floor(location.y + 0.4999);
		this.back.z = Math.ceil(location.z + 0.0001) - 1;
		this.back.dim = location.dimension.id;
	}

	private static async async_remove_to_update_player(player: Ply) {
        await Server.runCommandAsync(`scoreboard players reset "$db_player(${player.name})" db_player`);
    }

    private static async async_add_to_update_player(player: Ply) {
        await Server.runCommandAsync(`scoreboard players set "$db_player(${player.name})" db_player 1`);
    }

	static async initDB_player() {
		if (DB.db_player.size === 0) {
			const objectiveName = "db_player";
			await Server.runCommandAsync(`scoreboard objectives add ${objectiveName} dummy`);
			const start = Date.now();
	
			try {
				const objective = world.scoreboard.getObjective(objectiveName) ?? world.scoreboard.addObjective("db_player", "");
				const sc = objective.getScores();
				
				const nbParticipants = sc.length;
				const batchSize = 61 >>> 0;
				const batchNumber = Math.ceil(nbParticipants / batchSize);
	
				const progressBar = "§a[DB] §7loading db_player... §e";
				const percentageUnit = 100 / nbParticipants;
				loadDatabase.player = progressBar + "0.00%";
	
				const onlinePlayers = [...world.getPlayers()];
	
				for (let i = 0; i < batchNumber; i++) {
					const batchStart = i * batchSize;
					const batchEnd = batchStart + batchSize;
					const batch = batchEnd < nbParticipants ? sc.slice(batchStart, batchEnd) : sc.slice(batchStart);
	
					const updateDbPlayerPromises = batch.map(async (score, i) => {
						const db = score.participant.displayName.match(/(?<=\$db_player\()[0-9a-f\s]+(?=\))/g);
						if (!db) {
							log("§cError: Mismatch data in db_player, try deleting the database and restarting the server. Contact the developer.");
							return;
						}
						let player = JSON.parse(hexToText(db.join(""))) as Ply;
	
						// Update db_player map
						const existingPlayer = DB.db_player.get(player.name);
	
						if (existingPlayer) {
							// Update existing player data
							log(`§cDuplicate player found, fixing ${player.name}`)
							objective.removeParticipant(score.participant);
							if (existingPlayer.timePlayed < player.timePlayed) {
								await Ply.async_remove_to_update_player(existingPlayer);
								player = existingPlayer;
								await Ply.async_add_to_update_player(player);
							}
						} else {
							DB.db_player.set(player.name, player);
						}
						// Update db_online_player map
						const onlinePlayer = onlinePlayers.find((p) => p.name === player.name);
						if (onlinePlayer) {
							DB.db_player_online.set(player.name, player);
						}
					});
					await sleep(1);
					// Update progress bar
					loadDatabase.player = progressBar + (batchEnd * percentageUnit).toFixed(2) + "%";
					await Promise.all(updateDbPlayerPromises);
				}
				loadDatabase.player = progressBar + "100%";
			} catch (e) {
				log("§7[DB] can't find any database for db_player, creating a new one " + e);
			}
	
			const end = Date.now();
			log("§7db_player loaded in " + ((end - start) / 1000) + " second(s)");
			globalThis.isLoaded = true;
		}
	}


	remove_to_update_player() {
		if (this === undefined) return;
		Server.runCommandAsync("scoreboard players reset \"$db_player(" + textToHex(JSON.stringify(this)) + ")\" db_player");
	}

	add_to_update_player() {
		if (this === undefined) return;
		Server.runCommandAsync("scoreboard players set \"$db_player(" + textToHex(JSON.stringify(this)) + ")\" db_player 1");
	}


	static add_player(player: Ply | undefined) {
		if (player === undefined) return;
		if (db_player.has(player.name)) {
			log(`§cDuplicate player found, fixing ${player.name}`);
			Ply.remove_player(DB.db_player.get(player.name));
		}
		db_player.set(player.name, player);
		Server.runCommandAsync("scoreboard players set \"$db_player(" + textToHex(JSON.stringify(player)) + ")\" db_player 1");
	}

	static remove_player(player: Ply | undefined) {
		if (player === undefined) return;
		Server.runCommandAsync("scoreboard players reset \"$db_player(" + textToHex(JSON.stringify(player)) + ")\" db_player");
		db_player.delete(player.name);
	}
}

export class Tpa {
	public name : string;
	public type : (typeof TpaType[keyof typeof TpaType]);
	public delay : number;

	constructor (name: string, type: (typeof TpaType[keyof typeof TpaType]), delay: number) {
		this.name = name;
		this.type = type;
		this.delay = delay;
	}
}

export const TpaType = {
	tpa: "tpa",
	tpahere: "tpahere"
} as const;