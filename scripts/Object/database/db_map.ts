import { Server, getMap, hexToText, log, textToHex } from "../tool/tools";

declare global {
	var version: string;
	var prefix: string;
	var adminTag: string;
	var isLoaded: boolean;
	var loadDatabase: {
		player:string,
		faction:string,
		delay:string,
		chunk:string,
		warp:string,
		display:string,
		refreshTime:string
	};
}
globalThis.version = "1.1.29";
globalThis.prefix = "+";
globalThis.adminTag = "Admin";
globalThis.isLoaded = false;
globalThis.loadDatabase = {
	player:"§eloading...", 
	faction:"§eloading...", 
	delay:"§eloading...", 
	chunk:"§eloading...", 
	warp:"§eloading...",
	display:"§eloading...",
	refreshTime:"0 ms"
};

export let db_map: DB_Map;

export async function update_db_map(new_db_map: DB_Map) {
	db_map = new_db_map;
}

export class DB_Map {
	public v: string;
	public homeLimit: number;
	public factionMemberLimit: number;
	public scoreMoney: string;
	public isFhome: boolean;
	public prefix: string;
	public customName: boolean;
	public showHeart: boolean;
	public showRole: boolean;
	public warpDelay: number;
	public UTC: number;
	public tpaDelay: number;
	public lockAdmin: boolean;
	public privateChat: boolean;
	public chatPrefix: string;
	public refreshTick: number;
	public defaultLang: string;
	public factionSeparator: string;
	public factionColor: string;
	public ruleCode: rule;
	public playerHurtDelay: number;
	public randomHurtDelay: number;
	public default_cmd_module: (typeof cmd_module[keyof typeof cmd_module])[];
	public powerLimit: powerLimit;
	public defaultPower: number;
	public timeToRegenPower: number;

	constructor() {
		this.v = version,
		this.homeLimit = 3,
		this.factionMemberLimit = 5,
		this.scoreMoney = "money",
		this.isFhome = false,
		this.prefix = prefix,
		this.customName = false,
		this.showHeart = false,
		this.showRole = false,
		this.warpDelay = 5,
		this.UTC = 0,
		this.tpaDelay = 60,
		this.lockAdmin = false,
		this.privateChat = false,
		this.chatPrefix = "§r•>",
		this.refreshTick = 5,
		this.defaultLang = "en",
		this.factionSeparator = "••",
		this.factionColor = "§6",
		this.ruleCode = new rule(),
		this.playerHurtDelay = 5,
		this.randomHurtDelay = 3,
		this.default_cmd_module = [cmd_module.all],
		this.defaultPower = 5,
		this.powerLimit = new powerLimit(),
		this.timeToRegenPower = 60
	}

	static async initDB_map() : Promise<DB_Map> {
		if (db_map === undefined) {
			await Server.runCommandAsync("scoreboard objectives add database dummy");
			try {
				await update_db_map(JSON.parse(hexToText(getMap(/(?<=\$db_map\()[0-9a-f\s]+(?=\))/g).join("")))); //notabene PENSER A PROTEGER LE MATCH !!!
				if (db_map == undefined) {
					log("§7[DB] no map database found, creating a new one. try");
					await Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
					update_db_map(new DB_Map());
					await Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
				}
			}
			catch (e) {//always catch after a reset
				log("§7[DB] no map database found, creating a new one");
				try {
					await Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
					update_db_map(new DB_Map());
					await Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
				}
				catch (er) {
					update_db_map(new DB_Map());
					await Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
				}
				log("§7[DB] map fixed");
			}
		}
		else if (db_map.v != version) {
			log(`§7[DB] database version is outdated, do ${prefix}update`);
			if (db_map.refreshTick == undefined) {
				await Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
				db_map.refreshTick = 10;
				await Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			}
		}
		return db_map ?? new DB_Map();
	}
}

class rule {
	public isRuleCode: boolean;
	public isAutoGen: boolean;
	public code: string;
	constructor() {
		this.isRuleCode = false,
		this.isAutoGen = false,
		this.code = "" 
	}
}

class powerLimit {
	public max: number;
	public min: number;
	constructor() {
		this.max = 10;
		this.min = -10;
	}
}

export const cmd_module = {
	all: 0,
	home: 1,
	faction: 2,
	warp: 3,
	tpa: 4,
	chat: 5,
	lang: 6,
	money: 7,
	shop: 8,
	rule: 9,
	claim: 10,
	commoncommand: 11,
} as const;