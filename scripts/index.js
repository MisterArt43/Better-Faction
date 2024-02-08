import {system, Dimension, Player, ChatSendAfterEvent, world, ItemStack, ScoreboardScoreInfo, Container, ItemDurabilityComponent, ChatSendBeforeEvent, Vector, System, WatchdogTerminateBeforeEvent, WatchdogTerminateBeforeEventSignal, Entity, WatchdogTerminateReason, EntityType, EntityTypes, ItemComponent, BlockInventoryComponent, BlockComponent, EntityInventoryComponent} from "@minecraft/server";
import {translate, list_lang} from "./lang.js";
import {ActionFormData, ModalFormData, ModalFormResponse, MessageFormData, FormCancelationReason} from "@minecraft/server-ui"

/**
 * @typedef {Object} db_map
 * @property {String} v version
 * @property {number} homeLimit
 * @property {number} factionMemberLimit
 * @property {String} scoreMoney
 * @property {Boolean} isFhome
 * @property {String} prefix
 * @property {Boolean} customName
 * @property {Boolean} showHeart
 * @property {Boolean} showRole
 * @property {number} warpDelay
 * @property {number} UTC
 * @property {number} tpaDelay
 * @property {Boolean} lockAdmin
 * @property {Boolean} privateChat
 * @property {String} chatPrefix
 * @property {number} refreshTick
 * @property {String} defaultLang
 * @property {String} factionSeparator
 * @property {String} factionColor
 * @property {rule} ruleCode
 * @property {number} playerHurtDelay
 * @property {number} randomHurtDelay
 * @property {cmd_module[]} default_cmd_module
 * @property {powerLimit} powerLimit
 * @property {number} defaultPower
 * @property {number} timeToRegenPower in minutes
 */

/**
 * @typedef {Object} powerLimit
 * @property {number} max
 * @property {number} min
 */

/**
 * @typedef Location
 * @type {object}
 * @property {number} x
 * @property {number} y
 * @property {number} z
 */

// /**
//  * @typedef Ply
//  * @type {object}
//  * @property {string} name 
//  * @property {string} nameTag 
//  * @property {string} faction_name 
//  * @property {number} money 
//  * @property {string} id 
//  * @property {number} homeLimit 
//  * @property {number} warn 
//  * @property {Array} home 
//  * @property {string} lastMessage 
//  * @property {boolean} isMute 
//  * @property {Array} tpa 
//  * @property {Array} delay 
//  * @property {custom_date} date 
//  * @property {Location} back 
//  * @property {string} chat 
//  * @property {boolean} isunban 
//  * @property {string} lang 
//  * @property {number} UTC
//  * @property {cmd_module[]} cmd_module
//  * @property {number} deathCount
//  * @property {number} killCount
//  * @property {number} power
//  * @property {number} lastPowerRegen in Date().getTime()
//  * @property {number} lastConnect in Date().getTime()*
//  * @property {number} timePlayed in seconds
//  */

// /**
//  * @typedef faction_member
//  * @type {object}
//  * @property {string} name
//  * @property {string} permission
//  */

// /**
//  * @typedef faction
//  * @type {object}
//  * @property {string} name
//  * @property {string} description
//  * @property {string} color
//  * @property {string} separator
//  * @property {custom_date} date2
//  * @property {string} owner
//  * @property {number} bank
//  * @property {number} power
//  * @property {Array} ally
//  * @property {Array} enemy
//  * @property {Array} invitList
//  * @property {faction_member[]} playerList
//  * @property {number} memberLimit
//  * @property {boolean} isFhome
//  * @property {number} x
//  * @property {number} y
//  * @property {number} z
//  * @property {boolean} isOpen
//  * @property {Vector2[]} claim
//  */

/**
 * @typedef cmd
 * @type {object}
 * @property {string} cmd
 */

/**
 * @typedef filter
 * @type {object}
 * @property {string} tag
 */

/**
 * @typedef warp_log
 * @type {object}
 * @property {string} nameTag
 * @property {number} delay
 */

/**
 * @typedef warp
 * @type {object}
 * @property {string} name
 * @property {string} message
 * @property {boolean} displayMessageOnTp
 * @property {string} creator
 * @property {filter[]} allow
 * @property {filter[]} deny
 * @property {boolean} isOpen
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {string} dimension
 * @property {number} delay
 * @property {cmd[]} runCommand
 * @property {warp_log} log
 */

/**
 * @typedef display
 * @type {object}
 * @property {string} tag 
 * @property {string} text 
 * @property {string} type 
 */

/**
 * @typedef shop
 * @type {object}
 * @property {boolean} type //false = buy / true = sell
 * @property {string} itemId 
 * @property {string} itemName 
 * @property {Number} amount 
 * @property {Number} jumpamount base on 1
 * @property {Number} price 
 * 
 */

/**
 * @typedef Vector2
 * @type {object}
 * @property {number} x
 * @property {number} z
 */

/**
 * @typedef ChunkGroupFaction
 * @type {object}
 * @property {string} faction_name
 * @property {faction} faction
 * @property {Map<string, ChunkGroup>} groups
 */

/**
 * @typedef ChunkGroup
 * @type {object}
 * @property {string} group
 * @property {Map<string, Chunk>} chunks
 */

const version = "1.1.30";
let prefix = "+";
const adminTag = "Admin";
let isLoaded = false;
runCommand("scoreboard objectives add database dummy");

/**
 * @type {db_map}
 */
var db_map = undefined;
/**
 * @type {Map<string, Ply>}
 */
let db_player = new Map();
/**
 * @type {Map<string, Ply>}
 */
let db_online_player = new Map();
/**
 * @type {Map<string, faction>}
 */
let db_faction = new Map();
/**
 * @type {warp[]}
 */
let db_warp = new Array;

/** @type {Map<string, Chunk>} */
let db_chunk = new Map();
/** @type {Map<string, Chunk>} */
let group_chunk = new Map();

/**
 * @type {shop[]}
 */
let db_shop = new Array;
/**
 * @type {Map<string, delay>}
 */
let db_delay = new Map();
let db_admin = new Array;
/**
 * @type {display[]}
 */
let db_display = new Array;

let curTick = 0;
const START_TICK = 20; //start 0.5 secondes after a "/reload"
const loadDatabase = {player:"§eloading...", faction:"§eloading...", delay:"§eloading...", chunk:"§eloading...", refreshTime:"0 ms"};

const Server = world.getDimension("overworld");
const Nether = world.getDimension("nether");
const TheEnd = world.getDimension("the end");

function processMoneyTags(player, playerData, moneys, set, power) {
	const moneyTags = moneys || [];
	const setMoneyTags = set || [];
	const powerTags = power || [];

	const processTag = (tag) => {
		const amount = parseInt(tag.replace("money:", ""));
		if (!isNaN(amount)) {
			playerData.money += amount;
		} else {
			log(`§cError money tag : ${tag} for ${player.name}`);
		}
		player.removeTag(tag);
	};

	moneyTags.forEach(processTag);
	setMoneyTags.forEach((tag) => {
		const amount = parseInt(tag.replace("setmoney:", ""));
		if (!isNaN(amount)) {
			playerData.money = amount;
		} else {
			log(`§cError setmoney tag : ${tag} for ${player.name}`);
		}
		player.removeTag(tag);
	});

	powerTags.forEach((tag) => {
		const amount = parseInt(tag.replace("power:", ""));
		if (!isNaN(amount)) {
			playerData.power = amount;
		} else {
			log(`§cError power tag : ${tag} for ${player.name}`);
		}
		player.removeTag(tag);
	});
}

function processTPA(playerData) {
	if (playerData.tpa.length > 0) {
		const updatedTPA = [];
		playerData.tpa.forEach((tp) => {
			if (tp.delay === 0) {
				tellraw(playerData.name, translate(playerData.lang, tp.name, tp.type).tpa_expire);
			} else {
				tp.delay--;
				updatedTPA.push(tp);
			}
		});
		playerData.tpa = updatedTPA;
	}
}

system.runInterval(() => {
	try {
		if (isLoaded) {
			if (db_online_player.size !== 0) {
				for (const [key, p] of db_online_player) {
					remove_to_update_player(p);
					p.timePlayed += 5;
					if (p.power < db_map.powerLimit.max && p.lastPowerRegen + db_map.timeToRegenPower * 60 < p.timePlayed) {
						log("power regen for " + p.name + " : " + p.power + " -> " + (p.power + 1));
						p.power++;
						p.lastPowerRegen = p.timePlayed;
					}
					else if (p.lastPowerRegen + 1 > p.timePlayed + db_map.timeToRegenPower * 60) {
						p.lastPowerRegen = p.timePlayed;
					}
					add_to_update_player(p);
				}
			}
		}
	} catch (er) {
		log("error in runInterval : " + er.toString());
	}
}, 100)

system.runInterval(() => {
	if (isLoaded && curTick > START_TICK) {
		const players = world.getPlayers()
		if (players.length !== 0 && db_map != undefined) {
			const start = Date.now();
			if (curTick % (db_map.refreshTick + 1) === 0) Server.runCommandAsync("title @a[tag=debug] actionbar " + Math.round(curTick / 20) + " script is now running.\n§7> RefreshTime : §s" + loadDatabase.refreshTime);
			
			//------------------------------------ warp delay
			const is_second = curTick % 20 === 0;
			if (is_second) {
				prefix = db_map.prefix;
				if (db_warp.length !== 0) {
					for (let w = db_warp.length - 1; w >= 0; w--) {
						if (db_warp[w].log.length === 0) continue;
						const warp = db_warp[w];
						remove_warp(warp);
						for (let i = warp.log.length - 1; i >= 0; i--) {
							const log = warp.log[i];
							if (log.delay > 1) {
								log.delay--;
							} else {
								warp.log[i] = warp.log[warp.log.length - 1];
								warp.log.pop();
							}
						}
						add_warp(warp);
					}
				}
			}

			//------------------------------------ Global Gameplay
			
			let objectiveMoney = world.scoreboard.getObjective(db_map.scoreMoney);
			let objectiveWarn = world.scoreboard.getObjective("warn");
			if (objectiveMoney === undefined) objectiveMoney = world.scoreboard.addObjective(db_map.scoreMoney, "");
			if (objectiveWarn === undefined) objectiveWarn = world.scoreboard.addObjective("warn", "");
			const refreshCalc = curTick % db_map.refreshTick === 0;
			let refreshCalc2 = refreshCalc ? curTick % (db_map.refreshTick * 2) === 0 : false;
			let refreshCalc3 = refreshCalc ? curTick % (db_map.refreshTick * 20) === 0 : false;
			for (const p of players) {
				let is_edit = false
				let player = db_player.get(p.name);
				if (!p || !p.isValid()) continue;
				const tags = p.getTags();
				if (player !== undefined) {
	
					if (!db_player.has(p.name)) continue;
					
					const moneys = findTagsStartWithV2(p, "money:", tags);
					const set = findTagsStartWithV2(p, "setmoney:", tags);
					const power = findTagsStartWithV2(p, "power:", tags);
	
					if (moneys.length || set.length || power.length) {
						remove_to_update_player(player);
						processMoneyTags(p, player, moneys, set, power);
						is_edit = true;
					}
	
					if (is_second) {
						remove_to_update_player(player);
						processTPA(player);
						is_edit = true;
					}
				}
				if (refreshCalc) {
					let admin = db_admin.find((pla) => pla.name === p.name)
					if (db_map.lockAdmin && p.hasTag(adminTag)) {
						if (admin === undefined) {
							p.removeTag(adminTag);
							log(`§7${p.name} had Admin tag but was not register in the Admin database.`);
						}
						else if (!p.hasTag("pswd:" + admin.password)) {
							p.removeTag(adminTag);
							log(`§7${p.name} had Admin tag, was register in the Admin database, but don't have the password tag §d` + "pswd:" + admin.password);
						}
					}
					if (p.hasTag("ban") && player !== undefined) {
						if (player.isunban || (admin !== undefined && p.hasTag("pswd:" + admin.password))) {
							try {
								p.removeTag("ban");
							}
							finally {
								remove_to_update_player(player);
								player.isunban = false;
								is_edit = true;
								log("§7" + player.name + " unbanned.")
							}
						}
						else {
							Server.runCommandAsync(`kick "${p.name}" §c•> You are ban`);
						}
					}
					let id = findTagsStartWithV2(p, "id:", tags);
					if (id.length > 0) {
						if (player === undefined) {
							log("§c•> Error can't find " + p.name + " in the database but was in before... (did you reset the database ?)" + db_player.size);
							id.forEach(uid => {
								p.removeTag(uid);
							})
						}
					}
					if (id.length === 0 && player === undefined) {
						log(p.name + " added to database");
						id = p.id;
						p.addTag("id:" + id);
						let ply = new Ply(p);
						add_player(ply);
						db_online_player.set(p.name, ply);
						Pdisplay_rule(p, ply, true);
					}
					else if (player !== undefined) {
						/** @type {faction} */
						let faction;
						if (db_display.length > 0 || db_map.customName) faction = db_faction.get(player.faction_name);

						//-- display
						if (db_display.length > 0) {
							let display_list = []
							display_list.push(db_display.find((display) => display.type === "title" && p.getTags().find((tag) => display.tag == tag) !== undefined));
							display_list.push(db_display.find((display) => display.type === "actionbar" && p.getTags().find((tag) => display.tag == tag) !== undefined));
							if (display_list[0] !== undefined || display_list[1] !== undefined) {
								const Fname = faction?.name ?? "none";
								const Frank = faction?.playerList.find((pla) => pla.name === player.name).permission ?? "none";
								const Fcount = faction === undefined ? "none" : faction.playerList.length + "/" + faction?.memberLimit;
								const Fbank = faction?.bank ?? "0";
								let localTime;
								const date = new Date(new Date().getTime() + player.UTC * 3600000); // 60 * 60 * 1000
								if (player.lang == "fr") localTime = player.UTC + addDateZ(new custom_date(new Date()).change_daylight_saving_time()) + ":" + addDateZ(new Date().getMinutes());
								else localTime = player.UTC + addDateZ(date.getUTCHours()) + ":" + addDateZ(date.getMinutes());

								const coordX = Math.floor(p.location.x);
								const coordY = Math.floor(p.location.y);
								const coordZ = Math.floor(p.location.z);
								const chunkX = (coordX >> 4).toFixed(0);
								const chunkZ = (coordZ >> 4).toFixed(0);
								const chunk = db_chunk?.get(chunkX + "," + chunkZ + p.dimension.id)?.faction_name ?? "none"
								const timePlayed = Math.floor(player.timePlayed / 3600) + "h" + Math.floor((player.timePlayed % 3600) / 60) + "m" + (player.timePlayed % 60) + "s";

								for (const display of display_list) {
									if (display === undefined) continue;
									try {
										const formated_display = display.text.replace(/<([^>]+)>/g, (match, key) => {
											switch (key) {
												case "faction": return Fname;
												case "player": return player.name;
												case "x": return coordX;
												case "y": return coordY;
												case "z": return coordZ;
												case "money": return player.money;
												case "warn": return player.warn;
												case "Frank": return Frank;
												case "memberCount": return Fcount;
												case "Fbank": return Fbank;
												case "Fcount": return Fcount;
												case "Xchunk": return chunkX;
												case "Zchunk": return chunkZ;
												case "chunk": return chunk;
												case "online": return players.length;
												case "allPlayer": return db_player.size;
												//new version 1.1.10
												case "version": return version;
												case "prefix": return prefix;
												case "time": return localTime;
												case "timeS": return localTime + ":" + addDateZ(date.getSeconds());
												case "timePlayed": return timePlayed;
												case "day": return addDateZ(date.getDate());
												case "month": return addDateZ(date.getMonth() + 1);
												case "year": return date.getFullYear();
												case "power": return player.power;
												case "killCount": return player.killCount;
												case "deathCount": return player.deathCount;
												case "\"": return "";
												default: {
													if (key.startsWith("score[") && key.endsWith("]end")) return `"},{"score":{"name":"*","objective":"${key.replace("score[", "").replace("]end", "")}"}},{"text":"`;
													return match;
												}
											}
										})
										p.runCommandAsync(`titleraw @s ${display.type} {"rawtext":[{"text":"§r${formated_display}"}]}`);
									}
									catch (er) {
										log("display error : " + er.toString());
									}
								}
							}
						}
						try
						{
							const score_money = objectiveMoney.getScore(p)
							if (score_money === undefined || score_money !== player.money)
							{
								if (player.money > 2147483647) {
									objectiveMoney.setScore(p, 2147483647)
								}
								else {
									objectiveMoney.setScore(p, player.money)
								}
							}
						}
						catch {
							objectiveMoney.setScore(p, player.money);
						}
						//Custom Name
						if (refreshCalc2) {
							objectiveWarn.setScore(p, player.warn)
							let nameTag = p.name;
							if (db_map.customName) {
								const rankSeparator = (text) => { return "§7[" + text + "§7]§r"; };
								let rank = findTagsStartWithV2(p, "role:", tags).map(tag => rankSeparator(tag.replace("role:", ""))).join("\n");
								let colorN = findFirstTagStartWith(p, "colorName:", tags)?.replace("colorName:", "") ?? "§r";
								nameTag = colorN + nameTag + "§r";

								if (rank && db_map.showRole) nameTag = rank + "\n" + nameTag;

								if (faction) {
									nameTag = `${faction.color + faction.separator[0] + faction.name + faction.separator[1]}\n${nameTag}`;
								}

								if (db_map.showHeart) nameTag = nameTag + "\n§r§4§l§o" + p.getComponent("minecraft:health").currentValue.toFixed(1) + "§r§c§l ❤§r";

								if (nameTag !== p.nameTag) {
									remove_to_update_player(player);
									player.nameTag = nameTag;
									is_edit = true;
									p.nameTag = nameTag;
								}
							}
							else if (p.name !== p.nameTag) {
								remove_to_update_player(player);
								player.nameTag = p.name;
								is_edit = true;
								p.nameTag = nameTag;
							}
							if (refreshCalc3)
							{
								let delay = db_delay.get(player.name);
								if (delay !== undefined) {
									if (check_time(delay)) tellraw(player.name, "§7You aren't in combat anymore");
								}
							}
						}
					}
				}
				if (is_edit) add_to_update_player(player); // Add player to update queue if edited
				if (curTick % 200 === 0) {
					if (db_admin.length == 0 && db_map.lockAdmin == true) {
						log("§7admin database is lock but nobody is inside ? unlocking it");
						runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
						db_map.lockAdmin = false;
						runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
					}
				}
			}
			
			const end = Date.now();
			loadDatabase.refreshTime = (end - start) + " ms";
		}
	}
	else {
		if (curTick % 10 === 0) {
			Server.runCommandAsync("title @a[tag=log] actionbar " + loadDatabase.player + "\n" + loadDatabase.faction + "\n" + loadDatabase.chunk + "\n" + loadDatabase.delay);
		}
	}
	curTick++;
}, 1)

/**
 * Class representing a custom date.
 */
class custom_date {
	/**
	 * @param {Date} date - The `Date` object to create the `custom_date` from.
	 */
	constructor(date) {
		/**
		 * The year of the date.
		 * @type {number}
		 */
		this.year = date.getFullYear();

		/**
		 * The month of the date (1-12).
		 * @type {number}
		 */
		this.month = date.getMonth() + 1;

		/**
		 * The day of the date (1-31).
		 * @type {number}
		 */
		this.day = date.getDate();

		/**
		 * The hour of the date (0-23).
		 * @type {number}
		 */
		this.hour = date.getHours();

		/**
		 * The valid hour after adjusting for daylight saving time.
		 * @type {number}
		 */
		this.valid_hour = this.change_daylight_saving_time();

		/**
		 * The minutes of the date (0-59).
		 * @type {number}
		 */
		this.minute = date.getMinutes();

		/**
		 * The seconds of the date (0-59).
		 * @type {number}
		 */
		this.second = date.getSeconds();
	}

	/**
	 * Modifies the hour by adding an hour based on daylight saving time.
	 * @returns {number}
	 */
	change_daylight_saving_time() {
		if (this.month >= 4 && this.month <= 10) {
			return (this.hour + 2);
		}
		else {
			return (this.hour + 1);
		}
	}
}

class my_vector {
	/**
	 * @param {number} x 
	 * @param {number} y 
	 * @param {number} z 
	 * @param {Dimension} dimension 
	 */
	constructor(x, y, z, dimension) {
		this.x = Math.floor(x);
		this.y = Math.floor(y);
		this.z = Math.floor(z);
		this.dimension = dimension.id;
	}
}

class Ply {
	/** @param {Player} player */
	constructor(player) {
		let date = new Date();
		this.name = player.name;
		this.nameTag = player.nameTag;
		this.faction_name = null;
		this.money = 0;
		this.id = player.id;
		this.homeLimit = db_map.homeLimit;
		this.warn = 0;
		this.home = new Array;
		this.lastMessage = "";
		this.isMute = false;
		this.tpa = new Array;
		this.delay = new Array;
		this.date = new custom_date(date);
		this.back = new my_vector(player.location.x, player.location.y, player.location.z, player.dimension);
		this.chat = "all";
		this.isunban = false;
		this.lang = db_map.defaultLang;
		this.UTC = db_map.UTC;
		this.cmd_module = db_map.default_cmd_module;
		this.deathCount = 0;
		this.killCount = 0;
		this.power = 5;
		this.lastPowerRegen = 0;
		this.timePlayed = 0; //in seconds
		this.lastConnect = date.getTime();
	}
}

//enums for command module :
/**
 * @enum {number}
 */
const cmd_module = {
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
}

/**
 * convert cmd_module to string
 * @example translateCmdModuleValues([cmd_module.home, cmd_module.tpa]) = "home, tpa"
 * @param {cmd_module[]} moduleValues 
 * @returns 
 */
function translateCmdModuleValues(moduleValues) {
	const translatedValues = moduleValues.map((value) => {
	  for (const key in cmd_module) {
		if (cmd_module[key] === value) {
		  return key;
		}
	  }
	  return value; // Si la valeur n'a pas été trouvée dans cmd_module, laisser la valeur inchangée.
	});
  
	return translatedValues.join(", ");
}

world.beforeEvents.chatSend.subscribe(data => {
	try {
		if (data.message.substring(0, db_map.prefix.length) === prefix) {
			if (data.sender.nameTag === undefined) {
				data.sender.nameTag = data.sender.name;
			}
			commands(data.message.substring(prefix.length).replace(/@"/g, "\""), data);
			data.cancel = true;
		}
		else {
			customChat(data);
			data.cancel = true;
		}
	} catch (e) {
		console.warn(`beforeChat: ${e}\n${e.stack}`)
	}
})

/**
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function customChat(data) {
	let name = data.sender.name;
	let player = db_player.get(name);
	let faction;
	if (player === undefined) return;
	if (data.message.length > 125) {
		tellraw(data.sender.name, "§cYour message exceed 100 characters");
		return;
	}
	if (player.lastMessage === data.message.trim()) {
		tellraw(data.sender.name, translate(player.lang).spam)
		return;
	}
	else {
		remove_to_update_player(player);
		player.lastMessage = data.message.trim();
		add_to_update_player(player);
	}

	faction = db_faction.get(player.faction_name);
	if (!player.isMute) {
		const rankSeparator = (text) => { return "§7[" + text + "§7]§r"; };
		const ranks = findTagsStartWithV2(data.sender, "role:").map(tag => rankSeparator(tag.replace("role:", ""))).join("");
		const colorN = findFirstTagStartWith(data.sender, "colorName:")?.replace("colorName:", "") ?? "§r";
		const colorM = findFirstTagStartWith(data.sender, "colorMessage:")?.replace("colorMessage:", "") ?? "§r";

		let message = "";
		if (faction !== undefined && player.chat !== "faction") {
			message += faction.color + faction.separator[0] + faction.name + faction.separator[1] + "§r "
		}

		message += ranks + colorN + name + " " + db_map.chatPrefix + "§r " + colorM + data.message.replace(/§[1-9a-gk-o]/g, "").replace(/\\/g, "\\\\");
		if (player.chat !== "all") {
			const players = [...world.getPlayers()]
			if (player.chat === "ally") {
				if (faction !== undefined) {
					message = "§a[Ally] " + message;
					faction.playerList.forEach(p => {
						let other = players.find((pl) => pl.name === p.name);
						if (other !== undefined) {
							tellraw(`${other.name}`, message);
						}
					})
					faction.ally.forEach(ally => {
						let ally_exist = db_faction.get(ally.name)
						if (ally_exist !== undefined) {
							ally_exist.playerList.forEach(p => {
								let other = players.find((pl) => pl.name === p.name);
								if (other !== undefined) {
									tellraw(`${other.name}`, message);
								}
							})
						}
					})
					tellraw("@a[tag=chat_log]", "§8{Chat}:" + message);
					return;
				}
				else {
					remove_to_update_player(player);
					player.chat = "all";
					add_to_update_player(player);
				}
			}
			else if (player.chat === "faction") {
				if (faction != undefined) {
					message = "§g[Faction] " + message;
					faction.playerList.forEach(p => {
						let other = players.find((pl) => pl.name === p.name);
						if (other !== undefined) {
							tellraw(`${other.name}`, message);
						}
					})
					tellraw("@a[tag=chat_log]", "§8{Chat}:" + message)
					return;
				}
				else {
					remove_to_update_player(player);
					player.chat = "all";
					add_to_update_player(player);
				}
			}
			else {
				message = `§7(${player.chat}§7) ` + message;
				players.forEach(p => {
					let other = db_player.get(p.name);
					if (other.chat === player.chat) {
						tellraw(`${other.name}`, message);
					}
				})
				tellraw("@a[tag=chat_log]", "§8{Chat}:" + message)
				return;
			}
		}
		if (player.chat === "all") {
			tellraw("@a", message);
		}
	}
}

/**
 * @param {Ply} ply
 * @param {string} command 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function commands(command, data) {
	const args = command.match(/[\""].+?[\""]|[^ ]+/g);
	let msg = "";
	if (args != null) {
		args.forEach(arg => {
			msg += arg + "|";
		})
	}
	else return;
	tellraw("@a[tag=debug]", "§a" + msg + data.sender.name);
	let ply = db_player.get(data.sender.name);
	if (ply === undefined || (!isLoaded && !data.sender.hasTag(adminTag))) tellraw(data.sender.name, "§cYou are not registered please wait");
	else {
		switch (args[0]) {
			//player command
			case "balance": case "bank": return balance(args, data, ply);
			case "chat": case "c": return Pchat(args, data, ply);
			case "delhome": case "dh": return delhome(args, data, ply);
			case "help": return tellraw(data.sender.name, help(args, data, ply));
			case "home": case "h": return home(args, data, ply);
			case "lang": return Plang(args, data, ply);
			case "listhome": case "homelist": case "lh": return listhome(args, data, ply);
			case "pay": {
				if (args.length == 1) return Pui_pay(args, data, ply);
				else return pay(args, data, ply);
			}
			case "ping": return Pping(data.sender.name);
			case "sell": return;
			case "sethome": case "sh": return sethome(args, data, ply);
			case "tpa": return Ptpa(args, data, ply);
			case "tpahere": case "tpah": return Ptpahere(args, data, ply);
			case "tpayes": case "tpaccept": return Ptpayes(args, data, ply);
			case "rule": case "r": return Pdisplay_rule(world.getPlayers().find((p) => p.name === data.sender.name), ply, false);
			case "showChunk" : case "seeChunk": case "sc": return PseeChunk(data.sender, ply);
			
			//faction command
			case "faction": case "f": {
				if (!data.sender.hasTag(adminTag) && !ply.cmd_module.includes(cmd_module.all) && !ply.cmd_module.includes(cmd_module.faction)) return tellraw(data.sender.name, "§cThis Module is disabled.");
				if (args.length == 1) {
					tellraw(data.sender.name, "§o§7you have 2 seconds to quit the chat and the form will appear.")
					if (data.sender.hasTag(adminTag)) {
						return AFui(args, data, ply);
					}
					return Fui(args, data, ply);
				}
				switch (args[1]) {
					case "create": case "c": return Fcreate(args, data, ply);
					case "quit": case "q": return Fquit(args, data, ply);
					case "invit": case "invite": case "inv": return Finvit(args, data, ply);
					case "join": case "j": return Fjoin(args, data, ply);
					case "info": case "i": return Finfo(args, data, ply);
					case "promote": case "rank": return Fpromote(args, data, ply);
					case "demote": case "unrank": return Fdemote(args, data, ply);
					case "home": case "h": return Fhome(args, data, ply);
					case "sethome": case "sh": return Fsethome(args, data, ply);
					case "kick": case "k": return Fkick(args, data, ply);
					case "bank": case "balance": case "b": return Fbank(args, data, ply);
					case "ally": return Fally(args, data, ply);
					case "enemy": return Fenemy(args, data, ply);
					case "close": case "open": return Fopen(args, data, ply);
					case "list": case "l": return Flist(args, data, ply);
					default: return tellraw(data.sender.name, "§cUnknown command.");
				}
			}
	
			//warp command
			case "warp": case "w": {
				if (!data.sender.hasTag(adminTag) && !ply.cmd_module.includes(cmd_module.all) && !ply.cmd_module.includes(cmd_module.warp)) return tellraw(data.sender.name, "§cThis Module is disabled.");
				if (args.length == 1) {
					return Wui(args, data, ply);
				}
				if (data.sender.hasTag(adminTag)) {
					switch (args[1]) {
						case "add": return Wadd(args, data, ply);
						case "remove": return Wremove(args, data, ply);
						case "access": return Waccess(args, data, ply);
						case "close": case "open": return Wclose(args, data, ply);
						case "message": case "msg": return Wmessage(args, data, ply);
						case "command": case "cmd": case "runcommand": return WrunCommand(args, data, ply);
						case "delay": case "d": return Wdelay(args, data, ply);
					}
				}
				switch (args[1]) {
					case "list": case "l": return Wlist(args, data, ply);
					default: return Wwarp(args, data, ply);
				}
			}
		}
	}

	//admin command
	if (data.sender.hasTag(adminTag)) {
		switch (args[0]) {
			//debug database
			case "db": {return db(args, data, ply);}
			//db_map
			case "set": {return Aset_ui(ply, [...world.getPlayers()].find((p) => p.name === data.sender.name));}
			case "sethomelimit": case "sethl": {return sethomelimit(args, data, ply);}
			case "setmemberlimit": case "setml": {return setmemberlimit(args, data, ply);}
			case "setscoremoney": case "setscmoney": case "setscm": {return setscoremoney(args, data, ply);}
			case "setprefix": case "setpf": {return setprefix(args, data, ply);}
			case "setcustomname": case "setcn": {return setcustomname(args, data, ply);}
			case "setutc": {return setutc(args, data, ply);}
			case "setfactionhome": case "setfh": case "setfhome": {return setfactionhome(args, data, ply);}
			case "settpadelay": case "settd": case "settpad": {return settpadelay(args, data, ply);}
			case "setchatprefix": case "setcp": {return setchatprefix(args, data, ply);}
			case "setrefreshtick": case "setrt": {return setrefreshtick(args, data, ply);}
			//admin command
			case "admin": {return Aadmin(args, data, ply);}
			case "lock": {return Alock(args, data, ply);}
			case "module": {return Amodule(ply, [...world.getPlayers()].find((p) => p.name === data.sender.name));}
			case "shop": {}
			case "inventory": {return Ainventory(args, data, ply);}
			case "warn": {return Awarn(args, data, ply);}
			case "unwarn": {return Aunwarn(args, data, ply);}
			case "mute": {return Amute(args, data, ply);}
			case "tp": {return Atp(args, data, ply);}
			case "back": {return Aback(args, data, ply);}
			case "muteT": {}
			case "unban": {return Aunban(args, data, ply);}
			case "role": {return Arole(args, data, ply);}
			case "display": {
				if (args.length == 1) return Adisplay_ui(args, data, ply);
				else return Adisplay(args, data, ply);
			}
			case "update": {return Aupdate(args, data, ply);}
			case "claim": {return Aclaim(args, data.sender, ply);}
		}

		//debug tools
		if (args[0] == "manage" && data.sender.hasTag("debug")) {
			if (args[1] == "online") {
				log(JSON.stringify(Array.from(db_online_player.values()), null, 4));
			}
			else if (args[1] == "remove") {
				let player = db_player.get(args[2].replace(/["@]/g, ""));
				if (player != undefined) {
					remove_player(player);
				}
			}
			else if (args[1] == "info") {
				let player = db_player.get(args[2].replace(/["@]/g, ""));
				if (player != undefined) {
					log(JSON.stringify(player, null, 4));
				}
			}
			else if (args[1] == "resetALL") {
				Server.runCommandAsync("scoreboard objectives remove database");
				Server.runCommandAsync("scoreboard objectives remove db_player");
				db_player = new Map();
				db_map = undefined;
				initDB_map();
				system.run(async () => {
					log("§aresetALL start");
					isLoaded = false;
					sleep(1);
					await initDB_player();
					db_map = undefined;
					initDB_map();
					db_player = new Map();
					db_faction = new Map();
					db_warp = [];
					db_display = [];
					db_shop = [];
					db_admin = [];
					db_chunk = [];
					db_delay = new Map();
					await Server.runCommandAsync("scoreboard objectives remove database");
					await Server.runCommandAsync("scoreboard objectives remove db_player");
					await Server.runCommandAsync("scoreboard objectives remove db_faction");
					await Server.runCommandAsync("scoreboard objectives remove db_warp");
					await Server.runCommandAsync("scoreboard objectives remove db_display");
					await Server.runCommandAsync("scoreboard objectives remove db_admin");
					await Server.runCommandAsync("scoreboard objectives remove db_chunk");
					await Server.runCommandAsync("scoreboard objectives remove db_delay");
					await sleep(2);
					log("§aresetALL 50%");
					await Server.runCommandAsync("scoreboard objectives add database dummy");
					await Server.runCommandAsync("scoreboard objectives add db_player dummy");
					await Server.runCommandAsync("scoreboard objectives add db_faction dummy");
					await Server.runCommandAsync("scoreboard objectives add db_warp dummy");
					await Server.runCommandAsync("scoreboard objectives add db_display dummy");
					await Server.runCommandAsync("scoreboard objectives add db_admin dummy");
					await Server.runCommandAsync("scoreboard objectives add db_chunk dummy");
					await Server.runCommandAsync("scoreboard objectives add db_delay dummy");
					initDB_map();
					initDB_warp();
					initDB_player();
					initDB_admin();
					initDB_faction();
					initDB_display();
					initDB_delay();
					log("§aresetALL end");
				})
			}
			else if (args[1] == "unitTEST") {
				manage_unitTEST();
			}
			else if (args[1] == "fCHECK") {
				manage_fCHECK();
			}
			return;
		}
	}
}

async function manage_fCHECK() {
	try {
		let i = 0;
		const batchSize = 30;
		for (const player of Array.from(db_player.values())) {
			if (i && i % batchSize == 0) {
				if (i % (batchSize * 2) === 0) await Server.runCommandAsync("title @a[tag=debug] actionbar §eProcessing part 1 : §a" + Math.floor(i / db_player.size * 100) + "%");
				await sleep(1);
			}
			i++;
			if (db_faction.has(player.faction_name)) {
				if (db_faction.get(player.faction_name).playerList.find((p) => p.name === player.name) == undefined) {
					remove_to_update_player(player);
					player.faction_name = null;
					add_to_update_player(player);
					log("§a -" + player.name + " §6fixed")
				}
			}
			else {
				if (player.faction_name === null) continue;
				remove_to_update_player(player);
				player.faction_name = null;
				add_to_update_player(player);
				log("§a -" + player.name + " §6fixed")
			}
		}
		for (const faction of Array.from(db_faction.values())) {
			let j = 0;
			for (const p of faction.playerList) {
				let ply = db_player.get(p.name);
				if (ply && (ply.faction_name === undefined || ply.faction_name === null || ply.faction_name === "")) {
					remove_to_update_player(ply);
					ply.faction_name = faction.name;
					add_to_update_player(ply);
					log("§a -" + ply.name + " §6fixed")
				}
				if (j % 15 == 0) await sleep(1);
				j++;
			}
			log("§6"+faction.name+" checked")
			if (i % 15 == 0) {
				runCommand("title @a[tag=debug] actionbar §eProcessing part 2 : §a" + Math.floor(i / db_player.size * 100) + "%");
				await sleep(3);
			}
			i++;
		}
	} catch (error) {
		log(error.toString());
	}
	return true;
}

async function manage_unitTEST() {
	let batchSize = 25;
	for (let index = 0; index < 10000; index++) {
		add_player(new Ply({
			name:"Player"+index, 
			nameTag:"Player"+index,
			location:{x:0, y:0, z:0},
			id:index,
			dimension:"overworld"
		}));
		
		if (index % batchSize === 0) {log("§g" + batchSize + " Player added, now at " + index); await sleep(1);}
	}
	await manage_fCHECK();
	return;
	await sleep(5);
	log("§aPlayer1 create faction Faction1")
	Fcreate(["faction", "create", "Faction1"], {sender:{name:"Player1", dimension:{id:"nether"}}}, db_player.get("Player1"));
	await sleep(20);
	log("§aPlayer2 create faction Faction2")
	Fcreate(["faction", "create", "Faction2"], {sender:{name:"Player2", dimension:{id:"nether"}}}, db_player.get("Player2"));
	await sleep(20);
	log("§aPlayer1 invite Player3 to Faction1")
	Finvit(["faction", "invit", "Player3"], {sender:{name:"Player1"}}, db_player.get("Player1"));
	await sleep(20);
	log("§aPlayer3 join Faction1")
	Fjoin(["faction", "join", "Faction1"], {sender:{name:"Player3"}}, db_player.get("Player3"));
	await sleep(20);
	log("CHUNK TEST")
	let start = -10;
	let end = 10;
	log("§aPlayer1 claim 400 chunk")
	let date = new Date();
	let fac1 = db_faction.get("Faction1");
	remove_to_update_faction(fac1);
	for (let i = start; i < end; i++) {
		for (let j = start; j < end; j++) {
			add_chunk(new Chunk(i,j, "Player1", date, "Faction1", "minecraft:overworld"));
			fac1.claim.push(i + "," + j);
			log("§aChunk " + i + "," + j + " claimed");
			if (j % 5 === 0) await sleep(1);
		}
	}
	add_to_update_faction(fac1);
	await sleep(20);
	remove_to_update_faction(fac1);
	log("§aPlayer1 unclaim 400 chunk")
	fac1.claim = [];
	for (let i = start; i < end; i++) {
		for (let j = start; j < end; j++) {
			remove_chunk(new Chunk(i,j, "Player1", date, "Faction1", "minecraft:overworld"));
			log("§aChunk " + i + "," + j + " unclaimed");
			if (j % 5 === 0) await sleep(1);
		}
	}
	add_to_update_faction(fac1);
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
async function Aupdate(args, data, ply) {
	let player = [...world.getPlayers()].find(p => p.name === data.sender.name);
	if (args.length == 1) {
		try {
			if (parseInt(db_map.v.split(".")[0]) <= 1
			&& parseInt(db_map.v.split(".")[1]) >= 1) {
				log("§6Version is 1.1.0 or lower, checking database Architecture\n§cPlease wait for the update to finish");
				await sleep(5);
				await manage_fCHECK();
			}
            if (db_map.v != version) {
				isLoaded = false;
                await sleep(5);
                await Server.runCommandAsync("scoreboard objectives remove database");
                await sleep(2);
				await Server.runCommandAsync("scoreboard objectives add database dummy");
                log("§aStarting Update");
                let new_obj = newmap();
                let old_key = Object.keys(db_map);
                let new_key = Object.keys(new_obj);
                let old_value = Object.values(db_map);
                for (let i = 0; i < new_key.length; i++) {
                    for (let j = 0; j < old_key.length; j++) {
                        if (new_key[i] == "v") {
                            new_obj[new_key[i]] = version;
							break;
                        }
                        else if (new_key[i] == old_key[j]) {
                            new_obj[new_key[i]] = old_value[j];
							break;
                        }
                    }
                }
                log("\n§cOld map => §7" + JSON.stringify(db_map) + "\n§aNew map => §7" + JSON.stringify(new_obj));
                db_map = new_obj;
                await Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
                log("§6Map Database Updated");
				
				if (db_player.size > 0) {
					let counter = 1;
					for (let obj of db_player.values()) {
						remove_to_update_player(obj);
						let new_obj = new Ply({ location: { x: 0, y: 0, z: 0 }, name: "Pl", nameTag: "PlN", id:0, dimension:"overworld" });
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
						log("\n§cOld player => §7" + JSON.stringify(obj) + "\n§aNew Player => §7" + JSON.stringify(new_obj));
						add_to_update_player(new_obj);
						if (counter++ % 10 == 0) await sleep(2);	
					};
					log("§6Player Database Updated");
				}
                if (db_warp.length > 0) {
					await Server.runCommandAsync("scoreboard objectives remove db_warp");
					sleep(2);
					await Server.runCommandAsync("scoreboard objectives add db_warp dummy");
                    let newDB_warp = new Array;
                    db_warp.forEach(obj => {
                        let new_obj = newwarp("AupdateW", player);
                        let old_key = Object.keys(obj);
                        let new_key = Object.keys(new_obj);
                        let old_value = Object.values(obj);
                        for (let i = 0; i < new_key.length; i++) {
                            for (let j = 0; j < old_key.length; j++) {
                                if(new_key[i] == old_key[j]) {
                                    new_obj[new_key[i]] = old_value[j];
									break;
                                }
                            }
                        }
                        log("\n§cOld Warp => §7"+JSON.stringify(obj)+"\n§aNew Warp => §7"+JSON.stringify(new_obj));
                        newDB_warp.push(new_obj);
                    })
					await sleep(3);
                    db_warp = [];
                    newDB_warp.forEach(warp => {
                        add_warp(warp)
                    })
					await sleep(3);
                    log("§6Warp Database Updated");
                }
				if (db_faction.size > 0) {
					let counter = 1;
					for (let obj of db_faction.values()) {
						remove_to_update_faction(obj);
						let new_obj = new faction("FactionName", {sender:{name:"PlayerName"}});
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
						add_to_update_faction(new_obj);
						log("\n§cOld faction => §7" + JSON.stringify(obj) + "\n§aNew faction => §7" + JSON.stringify(new_obj));
						if (counter++ % 10 == 0) await sleep(1);
					};
					log("§6faction Database Updated");
				}
				if (db_chunk.size > 0) {
					let counter = 1;
					for (let obj of db_chunk.values()) {
						remove_to_update_chunk(obj);
						let new_obj = new Chunk(0, 0, "new", new custom_date(new Date()), "facName", "minecraft:overworld");
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
						add_to_update_chunk(new_obj);
						log("\n§cOld chunk => §7" + JSON.stringify(obj) + "\n§aNew chunk => §7" + JSON.stringify(new_obj));
						if (counter++ % 10 == 0) await sleep(1);
					};
					log("§6chunk Database Updated");
				}
                if (db_display.length > 0) {
					await Server.runCommandAsync("scoreboard objectives remove db_display");
					await sleep(2);
					await Server.runCommandAsync("scoreboard objectives add db_display dummy");

                    let newDB_display = new Array;
                    db_display.forEach(obj => {
                        let new_obj = newdisplay("all","update","title");
                        let old_key = Object.keys(obj);
                        let new_key = Object.keys(new_obj);
                        let old_value = Object.values(obj);
                        for (let i = 0; i < new_key.length; i++) {
                            for (let j = 0; j < old_key.length; j++) {
                                if(new_key[i] == old_key[j]) {
                                    new_obj[new_key[i]] = old_value[j];
									break;
                                }
                            }
                        }
                        log("\n§cOld display => §7"+JSON.stringify(obj)+"\n§aNew display => §7"+JSON.stringify(new_obj));
                        newDB_display.push(new_obj);
                    })
					await sleep(3);
                    db_display = [];
                    newDB_display.forEach(display => {
                        add_display(display);
                    })
					await sleep(3);
                    log("§6display Database Updated");
                }
                if (db_admin.length > 0) {
					await Server.runCommandAsync("scoreboard objectives remove db_admin");
					await sleep(2);
					await Server.runCommandAsync("scoreboard objectives add db_admin dummy");

                    let newDB_admin = new Array;
                    db_admin.forEach(obj => {
                        let new_obj = newadmin("PlayerName","password");
                        let old_key = Object.keys(obj);
                        let new_key = Object.keys(new_obj);
                        let old_value = Object.values(obj);
                        for (let i = 0; i < new_key.length; i++) {
                            for (let j = 0; j < old_key.length; j++) {
                                if(new_key[i] == old_key[j]) {
                                    new_obj[new_key[i]] = old_value[j];
									break;
                                }
                            }
                        }
                        //log("\n§cOld admin => §7"+JSON.stringify(obj)+"\n§aNew admin => §7"+JSON.stringify(new_obj));
                        newDB_admin.push(new_obj);
                    })
					await sleep(3);
                    db_admin = [];
                    newDB_admin.forEach(admin => {
                        add_admin(admin);
                    })
					await sleep(3);
                    log("§6admin Database Updated");
                }
                tellraw(player.name, translate(ply.lang).db_update);
				isLoaded = true;
            }
            else {
                tellraw(player.name, translate(ply.lang).db_already_update);
            }
        }
        catch (er) {
            log(er.toString());
			isLoaded = true;
        }
    }
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
 */
async function Pping(name) {
	const delay = 1000;
	const start = Date.now();
	system.runTimeout(() => {
		const end = Date.now();
		const diff = end - start - delay;
		tellraw(name, diff + " ms");
	},20);
}

/**
 * @param {Ply} ply 
 * @param {Player} player 
 * @returns 
 */
function Amodule(ply, player) {
	system.runTimeout(async () => {
		let pl = await UI_find_player(player)
		if (pl === undefined) return;
		const all = ply.cmd_module.includes(cmd_module.all)
		new ModalFormData()
			.title("Command Module\n(to disable command related to a module, uncheck the box)")
			.toggle("§e Home Module", all || pl.cmd_module.includes(cmd_module.home))
			.toggle("§e Faction Module", all || pl.cmd_module.includes(cmd_module.faction))
			.toggle("§e Warp Module", all || pl.cmd_module.includes(cmd_module.warp))
			.toggle("§e Tpa Module", all || pl.cmd_module.includes(cmd_module.tpa))
			.toggle("§e Chat Module", all || pl.cmd_module.includes(cmd_module.chat))
			.toggle("§e Lang Module", all || pl.cmd_module.includes(cmd_module.lang))
			.toggle("§e Money Module", all || pl.cmd_module.includes(cmd_module.money))
			.toggle("§e Shop Module \n(Not Implemented)", all || pl.cmd_module.includes(cmd_module.shop))
			.toggle("§e Rule Module", all || pl.cmd_module.includes(cmd_module.rule))
			.show(player).then(res => {
				if (res.canceled) return;
				if (res.formValues.every(v => v === true)) {
					if (pl.cmd_module[0] === cmd_module.all) return;
					remove_to_update_player(pl);
					pl.cmd_module = [cmd_module.all];
					add_to_update_player(pl);
				}
				else {
					remove_to_update_player(pl);
					pl.cmd_module = [];
					if (res.formValues[0]) pl.cmd_module.push(cmd_module.home);
					if (res.formValues[1]) pl.cmd_module.push(cmd_module.faction);
					if (res.formValues[2]) pl.cmd_module.push(cmd_module.warp);
					if (res.formValues[3]) pl.cmd_module.push(cmd_module.tpa);
					if (res.formValues[4]) pl.cmd_module.push(cmd_module.chat);
					if (res.formValues[5]) pl.cmd_module.push(cmd_module.lang);
					if (res.formValues[6]) pl.cmd_module.push(cmd_module.money);
					if (res.formValues[7]) pl.cmd_module.push(cmd_module.shop);
					if (res.formValues[8]) pl.cmd_module.push(cmd_module.rule);
					add_to_update_player(pl);
				}
				tellraw(player.name, "§eModule Allowed : " + translateCmdModuleValues(pl.cmd_module));
			})
	}, 20);
}

/**
 * 
 * @param {Player} player 
 * @param {Ply} ply 
 * @param {boolean} isNewPlayer
 * @returns 
 */
async function Pdisplay_rule(player, ply, isNewPlayer) {
	if (!player.hasTag(adminTag) && !ply.cmd_module.includes(cmd_module.all) && !ply.cmd_module.includes(cmd_module.rule)) return tellraw(player.name, "§cThis Module is disabled.");
	if (db_display.length === 0) return;
	let display = db_display.find((d) => d.type === "rule");
	if (display === undefined) return;
	let Fname = "none";
	let Frank = "none";
	let Fcount = "none";
	let Fbank = "0";
	let localTime;
	const faction = db_faction.get(ply.faction_name);
	const date = new Date(new Date().getTime() + ply.UTC * 3600000); // 60 * 60 * 1000
	if (ply.lang === "fr") localTime = ply.UTC + addDateZ(new custom_date(new Date()).change_daylight_saving_time()) + ":" + addDateZ(new Date().getMinutes());
	else localTime = ply.UTC + addDateZ(date.getUTCHours()) + ":" + addDateZ(date.getMinutes());
	if (faction !== undefined) {
		Fname = faction.name;
		Frank = faction.playerList.find((pla) => pla.name === ply.name).permission;
		Fcount = faction.playerList.length + "/" + faction.memberLimit;
		Fbank = faction.bank
	}
	let chunk = db_chunk.get((player.location.x >> 4).toFixed(0) + "," + (player.location.z >> 4).toFixed(0) + player.dimension.id)
	if (chunk === undefined) {
		chunk = "none";
	}
	else {
		chunk = chunk.faction_name;
	}
	await sleep(1);
	let formated_display = display.text.replace(/<([^>]+)>/g, (match, key) => {
		switch (key) {
			case "faction": return Fname;
			case "player": return ply.name;
			case "x": return Math.floor(p.location.x);
			case "y": return Math.floor(p.location.y);
			case "z": return Math.floor(p.location.z);
			case "money": return ply.money;
			case "warn": return ply.warn;
			case "Frank": return Frank;
			case "memberCount": return Fcount;
			case "Fbank": return Fbank;
			case "Fcount": return Fcount;
			case "Xchunk": return (p.location.x >> 4).toFixed(0);
			case "Zchunk": return (p.location.z >> 4).toFixed(0);
			case "chunk": return chunk;
			case "online": return players.length;
			case "allPlayer": return db_player.size;
			//new version 1.1.10
			case "version": return version;
			case "prefix": return prefix;
			case "time": return localTime;
			case "timeS": return localTime + ":" + addDateZ(date.getSeconds());
			case "day": return addDateZ(date.getDate());
			case "month": return addDateZ(date.getMonth() + 1);
			case "year": return date.getFullYear();
			case "\"": return "";
			default: {
				if (key.startsWith("score[") && key.endsWith("]end")) return `"},{"score":{"name":"*","objective":"${key.replace("score[", "").replace("]end", "")}"}},{"text":"`;
				return match;
			}
		}
	})
	let hasRead = false;
	let test = false;
	formated_display = formated_display.replace(/\\n/g, "\n");
		await sleep(5);
	let form = new ActionFormData()
		.title(display.type)
		.button("close")
	const form2 = new ModalFormData()
	.title("Enter the Code that was in The Rule")
	.textField("Code", "enter the code here")
	const interval = system.runInterval(() => {
		try {
			if (hasRead) {system.clearRun(interval); log("§a" + ply.name + " has read the rule"); return;}
			else if (test === false) {
				let code = "";
				if (db_map.ruleCode.isRuleCode) code = db_map.ruleCode.code;
				if (db_map.ruleCode.isAutoGen) code = generateRandomCode(5);
				if (code === undefined) code = "none";
				form.body(formated_display.replace(/\<code\>/g, "§r" + code))
					.show(player).then(res => {
						if (!isNewPlayer) {
							hasRead = true;
							system.clearRun(interval);
						}
						if (res.canceled && res.cancelationReason === FormCancelationReason.UserBusy) {
							test = true;
							return;
						}
						if (res.canceled) {
							form.title("§c§lREAD THE RULE !");
							test = false;
							return;
						}
						if (db_map.ruleCode.isRuleCode) {
							form2.show(player).then(res1 => {
								if (res1.canceled) return;
								if (res1.formValues[0] == code) {
									hasRead = true;
								}
								else {
									form.title("§c§lWrong Code");
									test = false;
								}
							})
						}
						else {
							hasRead = true;
							system.clearRun(interval);
						}
					})
			}
			else test = false;
		} catch (error) {
			log(error.toString());
		}
	},30);
}

/**
 * @param {number} length 
 * @returns {string}
 */
function generateRandomCode(length) {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let code = "";
  
	for (let i = 0; i < length; i++) {
	  const randomIndex = Math.floor(Math.random() * charset.length);
	  code += charset[randomIndex];
	}
	return code;
}

/**
 * @param {Player} sender 
 * @param {Ply} ply 
 * @returns 
 */
function PseeChunk(sender, ply) {
	const player = [...world.getPlayers()].find(p => p.name === sender.name);
	if (!player.hasTag(adminTag) && !ply.cmd_module.includes(cmd_module.all) && !ply.cmd_module.includes(cmd_module.faction)) return tellraw(player.name, "§cThis Module is disabled.");
	const dim = player.dimension.id === "minecraft:overworld" ? Server : player.dimension.id === "minecraft:nether" ? Nether : TheEnd;
	system.run(async () => {
		for (let j = 0; j < 6; j++) {
			for (let i = 0; i <= 15; i += 2.5) {
				dim.spawnParticle("minecraft:endrod", { x: ((player.location.x >> 4) * 16 + i), y: player.location.y + 1, z: ((player.location.z >> 4) * 16) });
				dim.spawnParticle("minecraft:endrod", { x: ((player.location.x >> 4) * 16 + i), y: player.location.y + 1, z: ((player.location.z >> 4) * 16 + 16) });
				dim.spawnParticle("minecraft:endrod", { x: ((player.location.x >> 4) * 16), y: player.location.y + 1, z: ((player.location.z >> 4) * 16 + i) });
				dim.spawnParticle("minecraft:endrod", { x: ((player.location.x >> 4) * 16 + 16), y: player.location.y + 1, z: ((player.location.z >> 4) * 16 + i) });
			}
			await sleep(35);
		}
	})
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
 */
function Fui(args, data, ply) {
	let pl = [...world.getPlayers()].find((p) => p.name === data.sender.name);
	system.runTimeout(() => {
		let perm = "";
		let fac = db_faction.get(ply.faction_name);
		let form = new ActionFormData()
		.title("Faction Form")
		if (fac == undefined) {
			form.button("create")
			.button("join")
		}
		else {
			perm = fac.playerList.find((f) => f.name === pl.name).permission;
			form.button("home")
				.button("bank")
			if (perm == "Leader" || perm == "Officer") {
				form.button("invit")
					.button("invit list")
					.button("diplomacy")
					.button("rank")
					.button("kick")
					.button("edit description")
					.button("sethome")
					.button("claim")
					if (perm == "Leader") {
						form.button("disband")
					}
			}
			if (perm != "Leader") {
				form.button("quit")
			}
		}
		form.button("info")
			.show(pl).then(res => {
				if (res.canceled) {
					return;
				}
				if (fac == undefined) {
					switch (res.selection) {
						case 0: return Fui_create(ply, pl, fac);
						case 1: return Fui_join(ply, pl, fac);
					}
				}
				else {
					if (res.selection == 0) return Fui_home(pl, fac);
					if (res.selection == 1) return Fui_bank(ply, pl, fac);
					if (perm == "Leader" || perm == "Officer") {
						switch (res.selection) {
							case 2: return Fui_invit(ply, pl, fac);
							case 3: return Fui_invit_list(ply, pl, fac);
							case 4: return Fui_diplomacy(ply, pl, fac);
							case 5: return Fui_rank(ply, pl, fac);
							case 6: return Fui_kick(ply, pl, fac);
							case 7: return Fui_edit(ply, pl, fac);
							case 8: return Fui_sethome(ply, pl, fac);
							case 9: return Fui_claim(ply, pl, fac, perm);
							case 10: {
								if (perm == "Leader") return Fui_disband(ply, pl, fac);
								else return Fui_quit(ply, pl, fac);
							}
						}
					}
				}
				return Fui_info(pl);
			})
	}, 10);
}

/**
 * @param {Ply} ply
 * @param {Player} pl
 * @param {faction} fac
 * @param {"Leader" | "Officer" | "Member" | "Visitor"} perm
 */
function Fui_claim(ply, pl, fac, perm) {
	if (fac === undefined) return Fui(["f"], {sender:pl}, ply);
	new ActionFormData()
	.title("Claim Panel")
	.button("Add Claim")
	.button("Edit Claim")
	.button("Remove Claim")
	.show(pl).then(res => {
		if (res.canceled) return Fui(["f"], {sender:pl}, ply);
		if (res.selection == 0) return Fui_claim_add(ply, pl, fac);
		if (res.selection == 1) return Fui_claim_edit(ply, pl, fac, perm);
		if (res.selection == 2) return Fui_claim_remove(ply, pl, fac);
	});
}

/**
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {ChunkPermission} permission
 * @param {boolean | undefined} toDeleteOption 
 */
async function UI_chunkEditPermission(ply, pl, permission, toDeleteOption) {
	let form = new ModalFormData()
	.title("Claim Edit")
	.toggle("§eAllow Break", permission.canBreak)
	.toggle("§eAllow Place", permission.canPlace)
	.toggle("§eAllow Interact", permission.canInteract)
	if (toDeleteOption) form.toggle("§cDelete This Permission", false)
	return await form.show(pl).then(res => {
		if (res.canceled) return undefined;
		permission.canBreak = res.formValues[0];
		permission.canPlace = res.formValues[1];
		permission.canInteract = res.formValues[2];
		if (toDeleteOption && res.formValues[3]) return true;
		return permission;
	})
}

function Fui_claim_remove(ply, pl, fac) {
	if (fac === undefined) return Fui(["f"], {sender:pl}, ply);
	if (fac.claim.length === 0) return tellraw(pl.name, "§cYou don't have any claim");
	const form = new ActionFormData()
	.title("Claim List")
	let claims = [];
	for (let c of fac.claim) {
		claims.push(db_chunk.get(c.x + "," + c.z + Server.id)); // Server.id = "minecraft:overworld"
		form.button("§aCoordinates : " + c.x + " " + c.z + "§s\n" + c.x * 16 + " " + c.z * 16 + " to " + (c.x * 16 + 15) + " " + (c.z * 16 + 15));
	}
	form.show(pl).then(res => {
		if (res.canceled) return Fui_claim(ply, pl, fac);
		let claim = claims[res.selection];
		if (claim === undefined) return Fui_claim(ply, pl, fac);
		fac = db_faction.get(fac.name);
		if (fac === undefined) return tellraw(pl.name, "§cFaction not found");
		claim = db_chunk.get(claim.x + "," + claim.z + Server.id);
		if (claim === undefined) return tellraw(pl.name, "§cClaim not found");
		remove_to_update_faction(fac);
		fac.claim.splice(fac.claim.findIndex((c) => c.x === claim.x && c.z === claim.z), 1);
		add_to_update_faction(fac);
		remove_chunk(claim);
		tellraw(pl.name, "§aClaim Removed");
	})
}

/**
 * @param {Ply} ply
 * @param {Player} pl
 * @param {faction} fac
 * @param {"Leader" | "Officer" | "Member" | "Visitor"} perm
 */
function Fui_claim_edit(ply, pl, fac, perm) {
	if (fac === undefined) return Fui(["f"], {sender:pl}, ply);
	if (fac.claim.length === 0) return tellraw(pl.name, "§cYou don't have any claim");
	const form = new ActionFormData()
	.title("Claim List")
	let claims = [];
	for (let c of fac.claim) {
		claims.push(db_chunk.get(c.x + "," + c.z + Server.id));
		form.button("§aCoordinates : " + c.x + " " + c.z + "§s\n" + c.x * 16 + " " + c.z * 16 + " to " + (c.x * 16 + 15) + " " + (c.z * 16 + 15));
	}
	form.show(pl).then(res => {
		if (res.canceled) return Fui(["f"], {sender:pl}, ply);
		let claim = claims[res.selection];
		if (claim === undefined) return Fui(["f"], {sender:pl}, ply);	
		new ActionFormData()
		.title("Claim Edit")
		.button("Default Permission")
		.button("Rank Permission")
		.button("Player Permission")
		.show(pl).then(res1 => {
			if (res1.canceled) return Fui(["f"], {sender:pl}, ply);
			if (res1.selection == 0) return Fui_claim_edit_default(ply, pl, fac, claim);
			if (res1.selection == 1) return Fui_claim_edit_rank(ply, pl, fac, claim, perm);
			if (res1.selection == 2) return Fui_claim_edit_player(ply, pl, fac, claim);
		})
	})
}

/**
 * @param {Ply} ply
 * @param {Player} pl
 * @param {faction} fac
 * @param {Chunk} claim
 */
function Fui_claim_edit_player(ply, pl, fac, claim) {
	if (fac === undefined) return Fui(["f"], {sender:pl}, ply);
	new ActionFormData()
	.title("Select Mode")
	.button("Add Player")
	.button("Edit Player")
	.show(pl).then(async res => {
		if (res.canceled) return Fui_claim_edit(ply, pl, fac);
		if (res.selection == 0) {
			let player = await UI_find_player(pl);
			if (player === undefined) return Fui_claim_edit(ply, pl, fac);
			if (claim.playerPermission.find((p) => p.name === player.name) !== undefined) return tellraw(pl.name, "§cThis player already have a permission on this claim");
			let permission = await UI_chunkEditPermission(ply, pl, new ChunkPermission());
			if (permission === undefined) return Fui_claim_edit(ply, pl, fac);
			fac = db_faction.get(fac.name);
			if (fac === undefined) return tellraw(pl.name, "§cFaction not found");
			claim = db_chunk.get(claim.x + "," + claim.z + Server.id);
			if (claim === undefined) return tellraw(pl.name, "§cClaim not found");
			remove_to_update_chunk(claim);
			claim.playerPermission.push({name:player.name, permission:permission});
			add_to_update_chunk(claim);
			tellraw(pl.name, "§aClaim Permission Updated");
		}
		else {
			let playersPerm = claim.permission
			let form = new ActionFormData()
			.title("Select Player")
			for (let p of playersPerm) {
				form.button(p.name);
			}
			form.show(pl).then(async res => {
				if (res.canceled) return Fui_claim_edit(ply, pl, fac);
				let playerPerm = playersPerm[res?.selection ?? 0];
				let permission = playerPerm.permission;
				if (permission === undefined) return Fui_claim_edit(ply, pl, fac);
				permission = await UI_chunkEditPermission(ply, pl, {...permission}, true);
				if (permission === undefined) return Fui_claim_edit(ply, pl, fac);
				fac = db_faction.get(fac.name);
				if (fac === undefined) return tellraw(pl.name, "§cFaction not found");
				claim = db_chunk.get(claim.x + "," + claim.z + Server.id);
				if (claim === undefined) return tellraw(pl.name, "§cClaim not found");
				remove_to_update_chunk(claim);
				if (permission === true) {
					claim.playerPermission.splice(claim.playerPermission.findIndex((p) => p.name === playerPerm.name), 1);
					tellraw(pl.name, "§aPlqyer Permission Deleted");
				}
				else {
					claim.playerPermission[claim.playerPermission.findIndex((p) => p.name === player.name)] = permission;
					tellraw(pl.name, "§aClaim Permission Updated");
				}
				add_to_update_chunk(claim);
			})
		}
	})

}

/**
 * @param {Ply} ply
 * @param {Player} pl
 * @param {faction} fac
 * @param {Chunk} claim
 * @param {"Leader" | "Officer" | "Member" | "Visitor"} perm
 */
function Fui_claim_edit_rank (ply, pl, fac, claim, perm) {
	if (fac === undefined) return Fui_claim_edit(ply, pl, fac);
	let form = new ActionFormData()
	.title("Select Rank To Edit")
	let list = ["Member", "Visitor"];
	if (perm == "Leader") {
		list.unshift("Officer");
	}
	for (let rank of list) {
		form.button(rank);
	}
	form.show(pl).then( async res => {
		if (res.canceled) return Fui_claim_edit(ply, pl, fac);
		permission = claim.rankPermission.find((p) => p.rank === factionRank[list[res.selection]]);
		if (permission === undefined) return Fui_claim_edit(ply, pl, fac);
		permission = await UI_chunkEditPermission(ply, pl, {...permission});
		if (permission === undefined) return Fui_claim_edit(ply, pl, fac);
		fac = db_faction.get(fac.name);
		if (fac === undefined) return tellraw(pl.name, "§cFaction not found");
		claim = db_chunk.get(claim.x + "," + claim.z + Server.id);
		if (claim === undefined) return tellraw(pl.name, "§cClaim not found");
		remove_to_update_chunk(claim);
		claim.rankPermission[claim.rankPermission.findIndex((p) => p.rank === factionRank[list[res.selection]])] = permission;
		add_to_update_chunk(claim);
		tellraw(pl.name, "§aClaim Permission Updated");
	});
}

/**
 * @param {Ply} ply
 * @param {Player} pl
 * @param {faction} fac
 * @param {Chunk} claim
 */
async function Fui_claim_edit_default (ply, pl, fac, claim) {
	if (fac === undefined) return Fui_claim_edit(ply, pl, fac);
	let permission = claim.defaultPermission;
	permission = await UI_chunkEditPermission(ply, pl, {...permission});
	if (permission === undefined) return Fui_claim_edit(ply, pl, fac);
	fac = db_faction.get(fac.name);
	if (fac === undefined) return tellraw(pl.name, "§cFaction not found");
	remove_to_update_faction(fac);
	claim.defaultPermission = permission;
	add_to_update_faction(fac);
	tellraw(pl.name, "§aClaim Permission Updated");
}

/**
 * @param {Ply} ply
 * @param {Player} pl
 * @param {faction} fac
 */
async function Fui_claim_add(ply, pl, fac) {
	try {
		if (fac === undefined) return Fui(["f"], {sender:pl}, ply);
		if (pl.dimension.id !== "minecraft:overworld") return tellraw(pl.name, "§cYou can only claim in the overworld");
		let facpow = 0
		let i = 0;
		for (let fpl of fac.playerList) {
			if (i++ % 25 === 0) await sleep(1);
			facpow += db_player.get(fpl.name).power;
		}
		// log(facpow);
		// log(fac.claim.length);
		if (fac.claim.length > facpow) return tellraw(pl.name, "§cYou don't have enough power to claim more chunk");
		const xChunk = (pl.location.x >> 4).toFixed(0);
		const zChunk = (pl.location.z >> 4).toFixed(0);
		if (db_chunk.has(xChunk + "," + zChunk)) {
			let chunk = db_chunk.get(xChunk + "," + zChunk + pl.dimension.id);
			if (chunk.faction_name === fac.name) return tellraw(pl.name, "§cThis chunk is already claimed by your faction");
			if (chunk.faction_name === "Admin") return tellraw(pl.name, "§cThis chunk is already claimed by the Admin");
			let other_fac = db_faction.get(chunk.faction_name);
			let other_facpow = 0;
			let i = 0;
			for (let fpl of other_fac.playerList) {
				if (i++ % 25 === 0) await sleep(1);
				other_facpow += db_player.get(fpl.name).power;
			}
			if (other_facpow < other_fac.claim.length) return tellraw(pl.name, "§cThis chunk is already claimed by another faction");
			fac = db_faction.get(fac.name);
			if (fac === undefined) return tellraw(pl.name, "§cFaction not found");
			remove_to_update_faction(other_fac);
			other_fac.claim.splice(other_fac.claim.findIndex((c) => c.x === chunk.x && c.z === chunk.z), 1);
			add_to_update_faction(other_fac);
			remove_to_update_chunk(chunk);
			chunk = new Chunk(xChunk, zChunk, pl.name, new custom_date(new Date()), fac.name, pl.dimension.id);
			add_to_update_chunk(chunk);
			remove_to_update_faction(fac);
			fac.claim.push({x: xChunk, z: zChunk});
			add_to_update_faction(fac);
			return tellraw(pl.name, "§aChunk overclaimed from " + other_fac.name);
		}
		const newChunk = new Chunk(xChunk, zChunk, pl.name, new custom_date(new Date()), fac.name, pl.dimension.id);
		// log(JSON.stringify(newChunk));
		fac = db_faction.get(fac.name);
		if (fac === undefined) return tellraw(pl.name, "§cFaction not found");
		remove_to_update_faction(fac);
		fac.claim.push({x: xChunk, z: zChunk});
		add_to_update_faction(fac);
		add_chunk(newChunk);
		tellraw(pl.name, "§aChunk claimed");
	} catch (er) {
		log(er.toString());
	}
}

/**
 * @param {Ply} ply
 * @param {Player} pl
 * @param {faction} fac
 */
function Fui_quit(ply, pl, fac) {
	new ActionFormData()
		.title("Quit Faction")
		.body("Are you sure you want to quit your faction ?")
		.button("Yes")
		.button("No")
		.show(pl).then(res => {
			if (res.canceled || res.selection) return;
			fac = db_faction.get(fac.name);
			if (fac === undefined) return;
			if (fac.playerList.findIndex((f) => f.name === pl.name) == -1) return tellraw(pl.name, "§cYou are not in a faction");
			let player = db_player.get(pl.name);
			remove_to_update_player(player);
			player.faction_name = null;
			add_to_update_player(player);
			remove_to_update_faction(fac);
			fac.playerList.splice(fac.playerList.findIndex((f) => f.name === pl.name), 1);
			add_to_update_faction(fac);
			tellraw(pl.name, "§cYou have quit your faction");
			fac.playerList.forEach((p) => {
				tellraw(p.name, "§c" + pl.name + " has quit the faction");
			})
		})
}

/**
 * @param {Ply} ply
 * @param {Player} pl
 * @param {faction} fac
 */
function Fui_disband(ply, pl, fac) {
	if (fac == undefined) return Fui(["f"], {sender:pl}, ply);
	let rank = fac.playerList.find((f) => f.name === pl.name).permission;
	if (rank != "Leader") return Fui(["f"], {sender:pl}, ply);
	new ActionFormData()
		.title("Disband Faction")
		.body("Are you sure you want to disband your faction ?")
		.button("Yes")
		.button("No")
		.show(pl).then(res => {
			if (res.canceled || res.selection) return;
			fac = db_faction.get(fac.name);
			if (fac === undefined) return;
			fac.claim.forEach((c) => {
				let chunk = db_chunk.get(c.x + "," + c.z + Server.id);
				if (chunk !== undefined) remove_chunk(chunk);
			})
			remove_faction(fac);
			fac.playerList.forEach((p) => {
				tellraw(p.name, "§cYour faction has been disbanded");
				let player = db_player.get(p.name);
				remove_to_update_player(player);
				player.faction_name = null;
				add_to_update_player(player);
			})
		})
}

/**
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 * @returns 
 */
function Fui_sethome(ply, pl, fac) {
	if (fac == undefined) return Fui(["f"], {sender:pl}, ply);
	if (db_map.isFhome) {
		remove_to_update_faction(fac);
		fac.x = Math.ceil(pl.location.x + 0.0001) - 1;
		fac.y = Math.ceil(pl.location.y - 0.4999);
		fac.z = Math.ceil(pl.location.z + 0.0001) - 1;
		add_to_update_faction(fac);
	}
	tellraw(ply.name, "§aFaction Home set to §3" + fac.x + " " + fac.y + " " + fac.z);
}

/**
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 */
function Fui_edit(ply, pl, fac) {
	new ModalFormData()
		.title("Edit Faction")
		.textField("Description", fac.description)
		.show(pl).then(res => {
			if (res.canceled) return Fui(["f"], {sender:pl}, ply);
			fac = db_faction.get(fac.name);
			if (fac === undefined || res.formValues[0] === fac.description) return;
			remove_to_update_faction(ply.faction_name);
			fac.description = res.formValues[0];
			add_to_update_faction(fac);
			tellraw(pl.name, "§aFaction description changed");
		})
}

/**
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 */
function Fui_kick(ply, pl, fac) {
	if (fac == undefined) return Fui(["f"], {sender:pl}, ply);
	let rank = fac.playerList.find((f) => f.name === pl.name).permission;
	let playerList_tab = [...fac.playerList];
	let form = new ActionFormData()
	.title("Kick Player")
	fac.playerList.forEach(p => {
		if (p.permission != "Leader") {
			if (rank == "Leader" || (rank == "Officer" && p.permission != "Officer")) {
				form.button(p.name)
			}
			else playerList_tab.splice(playerList_tab.indexOf(p), 1);
		}
		else playerList_tab.splice(playerList_tab.indexOf(p), 1);
	})
	form.show(pl).then(res => {
		if (res.canceled) return Fui(["f"], {sender:pl}, ply);
		fac = db_faction.get(fac.name);
		if (fac == undefined) return;
		remove_to_update_faction(fac);
		fac.playerList.splice(fac.playerList.indexOf(fac.playerList.find((f) => f.name === playerList_tab[res.selection].name)), 1);
		add_to_update_faction(fac);
		let player = db_player.get(playerList_tab[res.selection].name)
		remove_to_update_player(player);
		player.faction_name = null;
		add_to_update_player(player);
		tellraw(playerList_tab[res.selection].name, "§cYou have been kicked from your faction");
		fac.playerList.forEach(p => {
			tellraw(p.name, "§e" + playerList_tab[res.selection].name + " §chas been kicked from the faction");
		});
	});
}

/**
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 */
function Fui_rank(ply, pl, fac) {
	if (fac == undefined) return Fui(["f"], {sender:pl}, ply);
	let form = new ModalFormData()
	.title("Edit Faction Rank")
	let rank = fac.playerList.find((f) => f.name === pl.name).permission;
	let rank_tab;
	if (rank == "Leader") rank_tab = ["Visitor", "Member", "Officer", "Leader"]
	else rank_tab = ["Visitor", "Member", "Officer"]
	let player_tab = [];
	fac.playerList.forEach(p => {
		if (!(rank == "Officer" && p.permission == "Leader")) {
			if (rank_tab.indexOf(p.permission) == undefined) {
				form.dropdown("§a" + p.name, rank_tab, 0);
			}
			else form.dropdown("§a" + p.name, rank_tab, rank_tab.indexOf(p.permission));
			player_tab.push(p.name);
		}
	})
	form.show(pl).then(res => {
		if (res.canceled) return Fui_manage(args, data, ply, pl, fac);
		fac = db_faction.get(fac.name);
		if (!fac) return tellraw(pl.name, "§cFaction was deleted during editing");
		let haveLeader = false;
		remove_to_update_faction(fac);
		for (const [playerIndex, rankValue] of res.formValues.entries()) {
			const playerName = player_tab[playerIndex];
			const player = fac.playerList.find(p => p.name === playerName);
			if (!player) {
				continue;
			}
			let rank = rank_tab[rankValue];
			if (rank !== player.permission) {
				tellraw(pl.name, `§eFaction §a${fac.name} §e${playerName} rank changed to §a${rank}`);
				if (rank === "Leader" && !haveLeader) {
					haveLeader = true;
				} else if (rank === "Leader" && haveLeader) {
					tellraw(pl.name, "§cFaction already has a leader, rank changed to Officer");
					rank = "Officer";
				}
				player.permission = rank;
			}
			else if (rank === "Leader") {
				if (haveLeader) {
					tellraw(pl.name, "§cFaction already has a leader, rank changed to Officer");
					rank = "Officer";
				}
				haveLeader = true;
			}
		}
		if (!haveLeader) {
			let perm = fac.playerList.find(p => p.permission === "Officer" || p.permission === "Member" || p.permission === "Visitor");
			if (!perm) perm = fac.playerList[0];
			perm.permission = "Leader";
			tellraw(pl.name, `§cDue to no leader, ${perm.name} is now the leader`);
		}
		add_to_update_faction(fac);
	})
}

/**
 * @param {Ply} ply
 * @param {Player} pl
 * @param {faction} fac
 */
function Fui_diplomacy_ally(ply, pl, fac) {
	new ActionFormData()
		.title("Diplomacy Ally")
		.button("add")
		.button("list")
		.show(pl).then(res => {
			if (res.canceled) return Fui_diplomacy(ply, pl, fac);
			fac = db_faction.get(fac.name);
			if (fac == undefined) return;
			if (res.selection == 0) {
				let faction_name_tab = Array.from(db_faction.keys());
				faction_name_tab.splice(faction_name_tab.indexOf(fac.name), 1);
				faction_name_tab = faction_name_tab.filter((faction) => !fac.ally.includes(faction) && !fac.enemy.includes(faction));
				new ModalFormData()
					.title("Diplomacy Ally")
					.dropdown("faction", faction_name_tab)
					.show(pl).then(res => {
						if (res.canceled) return Fui_diplomacy_ally(ply, pl, fac);
						fac = db_faction.get(fac.name);
						if (fac == undefined) return;
						let newAlly = db_faction.get(faction_name_tab[res.formValues[0]]);
						if (newAlly == undefined) return Fui_diplomacy_ally(ply, pl, fac);
						if (fac.ally.length >= 10) return tellraw(pl.name, "You can't have more than 10 ally");
						remove_to_update_faction(fac);
						fac.ally.push(newAlly.name);
						add_to_update_faction(fac);
						Fui_diplomacy_ally(ply, pl, fac);
					})
			}
			if (res.selection == 1) {
				let ally_tab = [...fac.ally];
				let form = new ModalFormData()
					.title("Diplomacy Ally")
				ally_tab.forEach((ally) => {
					form.toggle(ally, true);
				})
				form.show(pl).then(res => {
					if (res.canceled) return Fui_diplomacy_ally(ply, pl, fac);
					fac = db_faction.get(fac.name);
					if (fac == undefined) return;
					if (res.formValues.every((v) => v === true)) return Fui_diplomacy_ally(ply, pl, fac);
					remove_to_update_faction(fac);
					fac.ally = [];
					res.formValues.forEach((v, i) => {
						if (v) fac.ally.push(ally_tab[i]);
					})
					add_to_update_faction(fac);
					tellraw(pl.name, "§eAlly updated");
					Fui_diplomacy_ally(ply, pl, fac);
				})
			}
		})
}

/**
 * @param {Ply} ply
 * @param {Player} pl
 * @param {faction} fac
 */
function Fui_diplomacy_enemy(ply, pl, fac) {
	new ActionFormData()
		.title("Diplomacy enemy")
		.button("add")
		.button("list")
		.show(pl).then(res => {
			if (res.canceled) return Fui_diplomacy(ply, pl, fac);
			fac = db_faction.get(fac.name);
			if (fac == undefined) return;
			if (res.selection == 0) {
				let faction_name_tab = Array.from(db_faction.keys());
				faction_name_tab.splice(faction_name_tab.indexOf(fac.name), 1);
				faction_name_tab = faction_name_tab.filter((faction) => !fac.ally.includes(faction) && !fac.enemy.includes(faction));
				new ModalFormData()
					.title("Diplomacy enemy")
					.dropdown("faction", faction_name_tab)
					.show(pl).then(res => {
						if (res.canceled) return Fui_diplomacy_enemy(ply, pl, fac);
						fac = db_faction.get(fac.name);
						if (fac == undefined) return;
						let newenemy = db_faction.get(faction_name_tab[res.formValues[0]]);
						if (newenemy == undefined) return Fui_diplomacy_enemy(ply, pl, fac);
						if (fac.enemy.length >= 10) return tellraw(pl.name, "You can't have more than 10 enemy");
						remove_to_update_faction(fac);
						fac.enemy.push(newenemy.name);
						add_to_update_faction(fac);
						Fui_diplomacy_enemy(ply, pl, fac);
					})
			}
			if (res.selection == 1) {
				let enemy_tab = [...fac.enemy];
				let form = new ModalFormData()
					.title("Diplomacy enemy")
				enemy_tab.forEach((enemy) => {
					form.toggle(enemy, true);
				})
				form.show(pl).then(res => {
					if (res.canceled) return Fui_diplomacy_enemy(ply, pl, fac);
					fac = db_faction.get(fac.name);
					if (fac == undefined) return;
					if (res.formValues.every((v) => v === true)) return Fui_diplomacy_enemy(ply, pl, fac);
					remove_to_update_faction(fac);
					fac.enemy = [];
					res.formValues.forEach((v, i) => {
						if (v) fac.enemy.push(enemy_tab[i]);
					})
					add_to_update_faction(fac);
					tellraw(pl.name, "§eenemy updated");
					Fui_diplomacy_enemy(ply, pl, fac);
				})
			}
		})
}


/**
 * @param {Ply} ply
 * @param {Player} pl
 * @param {faction} fac
 */
function Fui_diplomacy(ply, pl, fac) {
	new ActionFormData()
		.title("Diplomacy")
		.button("Ally")
		.button("Enemy")
		.button("Quit")
		.show(pl).then(res => {
			if (res.canceled) return Fui(["f"], {sender: pl}, ply);
			if (res.selection == 0) return Fui_diplomacy_ally(ply, pl, fac);
			if (res.selection == 1) return Fui_diplomacy_enemy(ply, pl, fac);
			if (res.selection == 2) return;
		})
}

/**
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 * @returns 
 */
function Fui_invit_list(ply, pl, fac) {
	if (fac == undefined) return Fui(["f"], {sender: pl}, ply);
	let copy_invit = [...fac.invitList];
	let form = new ModalFormData()
	.title("Invitation list")
	for (let i = 0; i < fac.invitList.length; i++) {
		form.toggle(fac.invitList[i], true)
	}
	form.show(pl).then(res => {
		if (res.canceled) return Fui(["f"], {sender: pl}, ply);
		fac = db_faction.get(fac.name);
		if (fac == undefined) return;
		remove_to_update_faction(fac);
		copy_invit.forEach((invit, i) => {
			if (!res.formValues[i]) {
				if (fac.invitList.includes(invit)) {
					fac.invitList.splice(fac.invitList.indexOf(invit), 1);
				}
			}
		})
		add_to_update_faction(fac);
	})
}

/**
 * @param {Ply} ply 
 * @param {Player} pl 
 * @returns 
 */
async function UI_find_player(pl) {
	let ret;
	return await new ModalFormData()
	.textField("Enter the start of the player name", "Player name")
	.toggle("Search in online player only", false)
	.show(pl).then(async res => {
		if (res.canceled) return undefined;
		/**
		 * @type {string[]}
		 */
		let list = [];
		await sleep(1);
		let i = 0;
		if (res.formValues[1]) {
			for (const [key] of db_online_player) {
				if (key.toLowerCase().startsWith(res.formValues[0].toLowerCase())) {
					list.push(key);
					if (list.length === 100) {
						tellraw(pl.name, "§cToo many results, will only return the first 100");
						await sleep(10);
						break;
					};
				}
				if (i % 25 === 0) await sleep(1);
				i++;
			}
		}
		else {
			for (const [key] of db_player) {
				if (key.toLowerCase().startsWith(res.formValues[0].toLowerCase())) {
					list.push(key);
					if (list.length === 100) {
						tellraw(pl.name, "§cToo many results, will only return the first 100");
						await sleep(10);
						break;
					};
				}
				if (i % 25 === 0) await sleep(1);
				i++;
			}
		}
		list.sort();
		return await new ModalFormData()
		.title("Player list")
		.dropdown("Select a player", list)
		.show(pl).then(async res => {
			if (res.canceled) return undefined;
			ret = db_player.get(list[res.formValues[0]]);
			if (ret == undefined) tellraw(pl.name, "§cPlayer not found");
			return ret;
		})
	})
}


/**
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 */
function Fui_invit(ply, pl, fac) {
	if (fac == undefined) return tellraw(pl.name, "§cThe faction has been deleted during the process");
	let perm = fac.playerList.find((f) => f.name === pl.name).permission;
	if (perm != "Leader" && perm != "Officer") return tellraw(pl.name, "§cYou don't have permission to do that");
	new ActionFormData()
	.title("Faction Invit")
	.button("Search player")
	.button("Online player")
	.button("Enter player name")
	.body("Select a method to invite a player")
	.show(pl).then(async res => {
		if (res.canceled) return;
		let player;
		if (res.selection == 0) {
			player = await UI_find_player(pl);
		}
		else if (res.selection == 1) {
			let form2 = new ActionFormData()
			.title("Online player list")
			let pl_list = [...world.getPlayers()];
			for (let i = 0; i < pl_list.length; i++) {
				if (pl_list[i].name != pl.name) {
					form2.button(pl_list[i].name);
				}
			}
			player = await form2.show(pl).then(async res => {
				if (res.canceled || res.selection == undefined) return Fui_invit(ply, pl, fac);
				return db_player.get(pl_list[res.selection].name);
			})
		}
		else if (res.selection == 2) {
			player = await new ModalFormData()
			.title("Player name")
			.textField("Enter the player name", "Player name")
			.show(pl).then(async res => {
				if (res.canceled) return Fui_invit(ply, pl, fac);
				return db_player.get([res.formValues[0]]);
			})
		}
		if (player == undefined) return tellraw(pl.name, "§cPlayer not found");
		if (player.faction_name != undefined && player.faction_name != null) return tellraw(pl.name, "§cPlayer already in a faction");
		if (fac.invitList.includes(player.name)) return tellraw(pl.name, "§cPlayer already invited");
		fac = db_faction.get(fac.name);
		if (fac == undefined) return;
		remove_to_update_faction(fac);
		fac.invitList.push({name:player.name});
		add_to_update_faction(fac);
		tellraw(player.name, "§eYou have been invited to join the faction §6" + fac.name + ".");
		tellraw(pl.name, "§eInvitation sent to §6" + player.name);
	})
}

/**
 * 
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 * @returns 
 */
function Fui_bank(ply, pl, fac) {
	if (fac == undefined) return tellraw(pl.name, "§cYou are not in a faction");
	let form = new ActionFormData()
	.title("Faction Bank")
	.body("§eCurrent money in bank : §6§l" + fac.bank + "§r §e$")
	.button("deposit")
	const perm = fac.playerList.find((f) => f.name === pl.name).permission;
	if (perm == "Leader" || perm == "Officer") {
		form.button("withdraw")
	}
	form.show(pl).then(res => {
		if (res.canceled) return;
		new ModalFormData()
		.title("Faction Bank")
		.textField("§6Your Money §e: §a" + ply.money + "\n§6Bank §e: §a" + fac.bank.toString(), "0")
		.show(pl).then(res2 => {
			if (res2.canceled) return;
			fac = db_faction.get(ply.faction_name);
			if (fac == undefined) return tellraw(pl.name, "§cFaction has been deleted during the process")
			if (res2.formValues[0].match(/[0-9]/g) == null) {
				tellraw(pl.name, "§cYou must enter a number");
				return Fui_bank(ply, pl, fac);
			}
			let money = parseInt(res2.formValues[0]);
			remove_to_update_faction(fac)
			remove_to_update_player(ply)
			if (res.selection == 0) {
				if (ply.money < money) tellraw(pl.name, "§cYou don't have enough money");
				else {
					ply.money -= money;
					fac.bank += money;
					tellraw(pl.name, "§aYou have deposit §6§l" + money + "§r §a$")
				}
			}
			else {
				if (fac.bank < money) tellraw(pl.name, "§cThe faction don't have enough money");
				else {
					ply.money += money;
					fac.bank -= money;
					tellraw(pl.name, "§aYou have withdraw §6§l" + money + "§r §a$")
				}
			}
			add_to_update_faction(fac);
			add_to_update_player(ply);
		})
	})
}

/**
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 * @returns 
 */
function Fui_home(ply, fac) {
	if (db_delay.has(ply.name)) if (!check_time(db_delay.get(ply.name))) return tellraw(ply.name, "§cYou have to wait " + (db_delay.get(ply.name).time - new Date().getTime()) / 1000 + " seconds before using this command.");
	if ((ply.hasTag("tpCanceled") || !fac.isFhome) && !ply.hasTag(adminTag) ) return tellraw(data.sender.name, "§cYou can't accept a teleportation request in this area.");
	if (!fac.x && !fac.z && !fac.y) return tellraw(ply.name, "§cFaction home not set");
	Server.runCommandAsync(`tp "${ply.name}" ${fac.x} ${fac.y} ${fac.z}`);
	tpsound([...world.getPlayers()].find((p) => p.name === ply.name));
}

async function Fui_info(pl) {
	let faction_tab = [];
	let counter = 1;
	for (const [key, f] of db_faction) {
		faction_tab.push(f.name);
		if (counter % 50 === 0) sleep(1);
	}
	new ModalFormData()
	.title("Select Faction")
	.dropdown("Faction", faction_tab)
	.show(pl).then((res) => {
		let faction = db_faction.get(faction_tab[res.formValues[0]]);
		if (faction == undefined) return tellraw(pl.name, "§cFaction has been deleted");
		
		let ally = "";
		let enemy = "";
		let member = "";

		faction.ally.forEach((f) => {
			ally += "§a - " + f + "\n";
		})
		faction.enemy.forEach((f) => {
			enemy += "§c - " + f + "\n";
		})
		member = "§b - " + faction.playerList.find((f) => f.permission == "Leader").name + " Leader" + "\n";
		faction.playerList.forEach((f) => {
			if (f.permission == "Officer") member += "§3 - " + f.name + " " + f.permission + "\n";
			else if (f.permission == "Member") member += "§t - " + f.name + " " + f.permission + "\n";
			else if (f.permission == "Visitor") member += "§s - " + f.name + " " + f.permission + "\n";
		})
		
		new ActionFormData()
		.title("Faction Info")
		.body("§eName: " + faction.color + faction.name + 
		"\n§eDescription: \n" + faction.description + 
		"§eMember :" + faction.playerList.length + "/" + faction.memberLimit + "\n" + member + 
		"§eBank: " + faction.money + 
		"\nPower: " + faction.power + 
		"\nDiplomacy:\n§aAlly: \n" + ally + "§cEnemy: \n" + enemy)
		.button("OK")
		.show(pl);
	})
}

/**
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 * @returns 
 */
async function Fui_join(ply, pl, fac) {
	if (fac != undefined) return tellraw(pl.name, "§cYou are already in a faction");
	let fac_list = [];
	let counter = 0;
	for (const [key, f] of db_faction) {
		if (f.isOpen || f.invitList.find((p) => p.name === pl.name) != undefined) {
			fac_list.push(f.name);
		}
		if (counter % 25 == 0) await sleep(1);
		counter++;
	}
	if (fac_list.length == 0) return tellraw(pl.name, "§cNo faction available");
	new ModalFormData()
	.title("Faction Join")
	.dropdown("Faction List", fac_list)
	.show(pl).then(res => {
		if (res.canceled) return;
		Fjoin(["f", "join"].concat(fac_list[res.formValues[0]].split(" ")), { sender: pl }, ply);
	})
}

/**
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 * @returns 
 */
function Fui_create(ply, pl, fac) {
	if (fac != undefined) return tellraw(pl.name, "§cYou are already in a faction");
	new ModalFormData()
	.title("Faction Create")
	.textField("Faction Name", "faction name")
	.show(pl).then(res => {
		if (res.canceled) return;
		Fcreate(["f", "create"].concat(res.formValues[0].split(" ")), { sender: pl }, ply);
	})
}

function AFui(args, data, ply) {
	let pl = [...world.getPlayers()].find((p) => p.name === data.sender.name);
	system.runTimeout(() => {
		let form = new ActionFormData();
			form.title("Faction Admin Form")
			.button("Manage Faction")
			.button("Player Ui")
			.show(pl).then(res => {
				if (res.canceled) {
					return;
				}
				else if (res.selection === 0) {
					if (db_faction.size === 0) {
						return tellraw(pl.name, "§cNo faction found");
					}
					Fui_manage(args, data, ply, pl);
				}
				else if (res.selection === 1) {
					Fui(args, {sender:pl}, ply);
				}
			})
	}, 10);
}

world.afterEvents.entityDie.subscribe(data => {
	let playerKiller = data.damageSource?.damagingEntity;
	let playerKilled = data.deadEntity;
	if (playerKilled instanceof Player) {
		let pl = db_player.get(playerKilled.name);
		remove_to_update_player(pl);
		pl.deathCount++;
		if (pl.power > db_map.powerLimit.min) pl.power--;
		add_to_update_player(pl);
		if (playerKiller instanceof Player) {
			let pl2 = db_player.get(playerKiller.name);
			remove_to_update_player(pl2);
			pl2.killCount++;
			add_to_update_player(pl2);
			log(`§7[§cKill§7] §e${pl2.name} §7killed §e${pl.name}`)
		}
		else log(`§7[§cDeath§7] §e${pl.name} §7died`)
	}
});

world.afterEvents.entityHurt.subscribe(data => {
	if (!isLoaded) return;
	if (data.hurtEntity.typeId === "minecraft:player") {
		const player = world.getAllPlayers().find((p) => p.nameTag === data.hurtEntity.nameTag);
		if (data.damage < 0) return
		if (data.damageSource.damagingEntity?.typeId === "minecraft:player") {
			if (db_delay.has(player.name)) {
				update_time(db_delay.get(player.name), db_map.playerHurtDelay);
			}
			else {
				new delay(player.name, db_map.playerHurtDelay);
			}
		}
		else {
			if (db_delay.has(player.name)) {
				update_time(db_delay.get(player.name), db_map.randomHurtDelay);
			}
			else {
				new delay(player.name, db_map.randomHurtDelay);
			}
		}
	}
});

world.afterEvents.playerJoin.subscribe(data => {
	if (db_player.has(data.playerName)) db_online_player.set(data.playerName, db_player.get(data.playerName))
})

function Fui_manage(args, data, ply, pl) {
	let form = new ActionFormData()
	.title("Admin Faction Manage Form")
	let facArray = [];
	db_faction.forEach((f, key) => {
		sleep(5);
		facArray.push(f.name);
		form.button(f.name)
	})
	if (facArray.length == 0) {
		return;
	}
	form.show(pl).then(res => {
		if (res.canceled)return AFui(args, {sender:pl}, ply);
		else {
			new ActionFormData()
			.title("Faction " + facArray[res.selection] + " Manage")
			.button("Edit Player")
			.button("Edit Faction")
			.button("Delete Faction")
			.show(pl).then(res2 => {
				if (res2.canceled) {
					return Fui_manage(args, data, ply, pl);
				}
				let fac = db_faction.get(facArray[res.selection]);
				if (fac == undefined) {
					return Fui_manage(args, data, ply, pl);
				}
				if (res2.selection == 0) {
					return AFui_manage_player(args, data, ply, pl, fac);
				}
				else if (res2.selection == 1) {
					return Fui_manage_faction(args, data, ply, pl, fac);
				}
				else {
					new ActionFormData()
					.body("Are you sure to delete this faction ?")
					.button("Yes")
					.button("No")
					.show(pl).then(res3 => {
						if (res3.canceled || res3.selection == 1) {
							return Fui_manage(args, data, ply);
						}
						if (res3.selection == 0) {
							let fac = db_faction.get(facArray[res.selection]);
							fac.playerList.forEach(p => {
								let pl = db_player.get(p.name);
								remove_to_update_player(pl);
								pl.faction_name = null;
								add_to_update_player(pl);
							})
							log(facArray[res.selection]);
							fac.claim.forEach((c) => {
								let chunk = db_chunk.get(c.x + "," + c.z + Server.id);
								if (chunk !== undefined) remove_chunk(chunk);
							})
							remove_faction(fac);
							tellraw(pl.name, "§eFaction §a" + facArray[res.selection] + " §cDeleted");
						}
					})
				}
			})
		}
	})
}

/**
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 */
function Fui_manage_faction(args, data, ply, pl, fac) {
	new ActionFormData()
	.title("Faction " + fac.name + " Manage")
	.button("Edit Name")
	.button("Edit Description")
	.button("Edit Color")
	.button("Edit Separator")
	.button("Edit Rank")
	.button("Edit Power")
	.button("Edit Player Limit")
	.button("Edit Home")
	.button("Edit Invite")
	.button("Edit Bank")
	.show(pl).then(res => {
		if (res.canceled) {
			return Fui_manage(args, data, ply, pl);
		}
		switch (res.selection) {
			case 0: AFui_edit_name(args, data, ply, pl, fac); break;
			case 1: AFui_edit_description(args, data, ply, pl, fac); break;
			case 2: AFui_edit_color(args, data, ply, pl, fac); break;
			case 3: AFui_edit_separator(args, data, ply, pl, fac); break;
			case 4: AFui_edit_rank(args, data, ply, pl, fac); break;
			case 5: AFui_edit_power(args, data, ply, pl, fac); break;
			case 6: AFui_edit_member_limit(args, data, ply, pl, fac); break;
			case 7: AFui_edit_home(args, data, ply, pl, fac); break;
			case 8: AFui_edit_invite(args, data, ply, pl, fac); break;
			case 9: AFui_edit_bank(args, data, ply, pl, fac); break;
		}
	})
}

/**
 * @param {string[]} args 
 * @param {ChatSendBeforeEvent} data 
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 */
function AFui_edit_name(args, data, ply, pl, fac) {
	fac = db_faction.get(fac.name);
	if (fac == undefined) return tellraw(pl.name, "§cFaction was deleted during editing");
	new ModalFormData()
	.title("Edit Faction Name")
	.textField("New Name", fac.name, fac.name)
	.show(pl).then(res => {
		if (res.canceled) {
			return Fui_manage(args, data, ply, pl, fac);
		}

		fac = db_faction.get(fac.name);
		if (fac == undefined) return tellraw(pl.name, "§cFaction was deleted during editing");

		let splited = res.formValues[0].split(" ");
		let Fname = "";
		for (let i = 0; i < splited.length; i++) {
			Fname += splited[i][0].toUpperCase() + splited[i].substring(1).toLowerCase() + " ";
		}
		Fname = Fname.substring(0, Fname.length - 1);

		if (res.formValues[0].match(/^([0-9a-zA-Z ]){1,20}$/) && res.formValues[0] != "Admin") { //nom des claim Admin
			tellraw(pl.name, "§eFaction §a" + fac.name + " §eName changed to §a" + Fname);
			remove_to_update_faction(fac);
			fac.name = Fname;
			add_to_update_faction(fac);
			fac.playerList.forEach(p => {
				let pl = db_player.get(p.name);
				remove_to_update_player(pl);
				pl.faction_name = fac.name;
				add_to_update_player(pl);
			})
		}
	})
}

/**
 * @param {string[]} args 
 * @param {ChatSendBeforeEvent} data 
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 */
function AFui_edit_description(args, data, ply, pl, fac) {
	fac = db_faction.get(fac.name);
	if (fac == undefined) return tellraw(pl.name, "§cFaction was deleted during editing");
	new ModalFormData()
	.title("Edit Faction Description")
	.textField("New Description", fac.description, fac.description)
	.show(pl).then(res => {
		if (res.canceled) {
			return Fui_manage(args, data, ply, pl, fac);
		}

		fac = db_faction.get(fac.name);
		if (fac == undefined) return tellraw(pl.name, "§cFaction was deleted during editing");

		if (res.formValues[0].match(/^([\s\S]){0,50}$/)) {
			tellraw(pl.name, "§eFaction §a" + fac.name + " §eDescription changed to §a" + res.formValues[0]);
			remove_to_update_faction(fac);
			fac.description = res.formValues[0];
			add_to_update_faction(fac);
		}
		else {
			tellraw(pl.name, "§cFaction Description must be 0-50 characters long");
		}
	})
}

/**
 * @param {string[]} args 
 * @param {ChatSendBeforeEvent} data 
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 */
function AFui_edit_color(args, data, ply, pl, fac) {
	fac = db_faction.get(fac.name);
	if (fac == undefined) return tellraw(pl.name, "§cFaction was deleted during editing");
	new ModalFormData()
	.title("Edit Faction Color")
	.textField("New Color", "§6", fac.color)
	.show(pl).then(res => {
		if (res.canceled) {
			return Fui_manage(args, data, ply, pl, fac);
		}

		fac = db_faction.get(fac.name);
		if (fac == undefined) return tellraw(pl.name, "§cFaction was deleted during editing");

		if (res.formValues[0].match(/^([§][0-9a-jmnp-u]){1}$/)) {
			tellraw(pl.name, "§eFaction §a" + fac.name + " §eColor changed to " + res.formValues[0] + "this");
			remove_to_update_faction(fac);
			fac.color = res.formValues[0];
			add_to_update_faction(fac);
		}
		else {
			tellraw(pl.name, "§cInvalid color");
		}
	})
}

/**
 * @param {string[]} args 
 * @param {ChatSendBeforeEvent} data 
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 */
function AFui_edit_separator(args, data, ply, pl, fac) {
	fac = db_faction.get(fac.name);
	if (fac == undefined) return tellraw(pl.name, "§cFaction was deleted during editing");
	new ModalFormData()
	.title("Edit Faction Separator")
	.textField("New Separator", "[]", fac.separator)
	.show(pl).then(res => {
		if (res.canceled) {
			return Fui_manage(args, data, ply, pl, fac);
		}
		if (res.formValues[0].length > 2) return tellraw(pl.name, "§cSeparator must be 2 character long.");
		fac = db_faction.get(fac.name);
		if (fac == undefined) return tellraw(pl.name, "§cFaction was deleted during editing");

		if (res.formValues[0].match(/([\S\s])/g) && res.formValues[0].length <= 2) {
			tellraw(pl.name, "§eFaction §a" + fac.name + " §eSeparator changed to §a" + res.formValues[0]);
			remove_to_update_faction(fac);
			fac.separator = res.formValues[0];
			add_to_update_faction(fac);
		}
		else {
			tellraw(pl.name, "§cInvalid separator (2 characters max)");
		}
	})
}

/**
 * @param {string[]} args 
 * @param {ChatSendBeforeEvent} data 
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 */
function AFui_edit_rank(args, data, ply, pl, fac) {
	fac = db_faction.get(fac.name);
	if (fac == undefined) return tellraw(pl.name, "§cFaction was deleted during editing");
	let form = new ModalFormData()
	.title("Edit Faction Rank")
	let rank_tab = ["Visitor", "Member", "Officer", "Leader"]
	let player_tab = [];
	fac.playerList.forEach(p => {
		if (rank_tab.indexOf(p.permission) == undefined) {
			form.dropdown("§a" + p.name, rank_tab, 0);
		}
		else form.dropdown("§a" + p.name, rank_tab, rank_tab.indexOf(p.permission));
		player_tab.push(p.name);
	})
	form.show(pl).then(res => {
		if (res.canceled) {
			return Fui_manage(args, data, ply, pl, fac);
		}
		fac = db_faction.get(fac.name);
		if (!fac) {
			return tellraw(pl.name, "§cFaction was deleted during editing");
		}
		remove_to_update_faction(fac);
		let haveLeader = false;
		for (const [playerIndex, rankValue] of res.formValues.entries()) {
			const playerName = player_tab[playerIndex];
			const player = fac.playerList.find(p => p.name === playerName);
			if (!player) {
				continue;
			}
			let rank = rank_tab[rankValue];
			if (rank !== player.permission) {
				tellraw(pl.name, `§eFaction §a${fac.name} §e${playerName} rank changed to §a${rank}`);
				if (rank === "Leader" && !haveLeader) {
					haveLeader = true;
				} else if (rank === "Leader" && haveLeader) {
					tellraw(pl.name, "§cFaction already has a leader, rank changed to Officer");
					rank = "Officer";
				}
				player.permission = rank;
			}
			else if (rank === "Leader") {
				if (haveLeader) {
					tellraw(pl.name, "§cFaction already has a leader, rank changed to Officer");
					rank = "Officer";
				}
				haveLeader = true;
			}
		}
		if (!haveLeader) {
			let perm = fac.playerList.find(p => p.permission === "Officer" || p.permission === "Member" || p.permission === "Visitor");
			if (!perm) perm = fac.playerList[0];
			perm.permission = "Leader";
			tellraw(pl.name, `§cDue to no leader, ${perm.name} is now the leader`);
		}
		add_to_update_faction(fac);
	})
}

/**
 * @param {string[]} args 
 * @param {ChatSendBeforeEvent} data 
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 */
function AFui_edit_power(args, data, ply, pl, fac) {
	fac = db_faction.get(fac.name);
	if (fac == undefined) return tellraw(pl.name, "§cFaction was deleted during editing");
	new ModalFormData()
	.title("Edit Faction Power")
	.textField("New Power", "0", fac.power.toString())
	.show(pl).then(res => {
		if (res.canceled) {
			return Fui_manage(args, data, ply, pl, fac);
		}

		fac = db_faction.get(fac.name);
		if (fac == undefined) return tellraw(pl.name, "§cFaction was deleted during editing");

		if (res.formValues[0].match(/^-?\d+$/g)) {
			tellraw(pl.name, "§eFaction §a" + fac.name + " §ePower changed to §a" + res.formValues[0]);
			remove_to_update_faction(fac);
			fac.power = parseInt(res.formValues[0]);
			add_to_update_faction(fac);
		}
		else {
			tellraw(pl.name, "§cInvalid power");
		}
	})
}

/**
 * @param {string[]} args 
 * @param {ChatSendBeforeEvent} data 
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 */
function AFui_edit_member_limit(args, data, ply, pl, fac) {
	fac = db_faction.get(fac.name);
	if (fac == undefined) return tellraw(pl.name, "§cFaction was deleted during editing");
	new ModalFormData()
	.title("Edit Faction Player Limit")
	.textField("New Player Limit", "0", fac.memberLimit.toString())
	.show(pl).then(res => {
		if (res.canceled) {
			return Fui_manage(args, data, ply, pl, fac);
		}

		fac = db_faction.get(fac.name);
		if (fac == undefined) return tellraw(pl.name, "§cFaction was deleted during editing");

		if (res.formValues[0].match(/^\d+$/g)) {
			tellraw(pl.name, "§eFaction §a" + fac.name + " §ePlayer Limit changed to §a" + res.formValues[0] + "\n§7Note : if the limit is lower than the current number of players, the players will not be kicked");
			remove_to_update_faction(fac);
			fac.memberLimit = parseInt(res.formValues[0]);
			add_to_update_faction(fac);
		}
		else {
			tellraw(pl.name, "§cInvalid player limit");
		}
	})
}

/**
 * @param {string[]} args 
 * @param {ChatSendBeforeEvent} data 
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 */
function AFui_edit_home(args, data, ply, pl, fac) {
	fac = db_faction.get(fac.name);
	if (fac == undefined) return tellraw(pl.name, "§cFaction was deleted during editing");
	new ModalFormData()
	.title("Edit Faction Home")
	.toggle("Can use Fhome", fac.isFhome)
	.textField("X Home", "0", fac.x.toString())
	.textField("Y Home", "0", fac.y.toString())
	.textField("Z Home", "0", fac.z.toString())
	.show(pl).then(res => {
		if (res.canceled) {
			return Fui_manage(args, data, ply, pl, fac);
		}

		fac = db_faction.get(fac.name);
		if (fac == undefined) return tellraw(pl.name, "§cFaction was deleted during editing");

		if (res.formValues[1].match(/^-?\d+$/g) && res.formValues[2].match(/^-?\d+$/g) && res.formValues[3].match(/^-?\d+$/g)) {
			tellraw(pl.name, "§eFaction §a" + fac.name + " §eHome changed to §a" + res.formValues[1] + "," + res.formValues[2] + "," + res.formValues[3]);
			remove_to_update_faction(fac);
			fac.isFhome = res.formValues[0];
			fac.x = parseInt(res.formValues[1]);
			fac.y = parseInt(res.formValues[2]);
			fac.z = parseInt(res.formValues[3]);
			add_to_update_faction(fac);
		}
		else {
			tellraw(pl.name, "§cInvalid home");
		}
	})
}

/**
 * @param {string[]} args 
 * @param {ChatSendBeforeEvent} data 
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 */
function AFui_edit_invite(args, data, ply, pl, fac) {
	fac = db_faction.get(fac.name);
	if (fac == undefined) return tellraw(pl.name, "§cFaction was deleted during editing");
	let invite_tab = [];
	let form = new ModalFormData()
	.title("Edit Faction Invite")
	.toggle("Is Open (without invite)", fac.isOpen)
	fac.invitList.forEach(inv => {
		form.toggle(inv.name, true);
		invite_tab.push(inv);
	})
	form.show(pl).then(res => {
		if (res.canceled) {
			return Fui_manage(args, data, ply, pl, fac);
		}

		fac = db_faction.get(fac.name);
		if (fac == undefined) return tellraw(pl.name, "§cFaction was deleted during editing");

		remove_to_update_faction(fac);
		fac.isOpen = res.formValues[0];
		fac.invitList = [];
		for (let i = 1; i < res.formValues.length; i++) {
			if (res.formValues[i]) {
				fac.invitList.push(invite_tab[i - 1]);
			}
		}
		add_to_update_faction(fac);
		tellraw(pl.name, "§eFaction Invite Settings Successfully Changed");
	})
}

/**
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 */
function AFui_edit_bank(args, data, ply, pl, fac) {
	log("test")
	fac = db_faction.get(fac.name);
	if (fac == undefined) return tellraw(pl.name, "§cFaction was deleted during editing");
	new ModalFormData()
	.title("Edit Faction Bank")
	.textField("New Bank", "0", fac.bank.toString())
	.show(pl).then(res => {
		if (res.canceled) {
			return Fui_manage(args, data, ply, pl, fac);
		}

		fac = db_faction.get(fac.name);
		if (fac == undefined) return tellraw(pl.name, "§cFaction was deleted during editing");

		if (res.formValues[0].match(/^\d+$/g)) {
			tellraw(pl.name, "§eFaction §a" + fac.name + " §eBank changed to §a" + res.formValues[0]);
			remove_to_update_faction(fac);
			fac.bank = parseInt(res.formValues[0]);
			add_to_update_faction(fac);
		}
		else {
			tellraw(pl.name, "§cInvalid bank");
		}
	})
}


/**
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 */
function AFui_manage_player(args, data, ply, pl, fac) {
	new ActionFormData()
	.body("Faction " + fac.name + " Player Manage")
	.button("Add Player")
	.button("Invite Player")
	.button("Remove Player")
	.button("Clear invite")
	.button("Quit Form")
	.show(pl).then(res => {
		if (res.canceled) {
			return Fui_manage(args, data, ply, pl);
		}
		switch (res.selection) {
			case 0: AFui_add_player(args, data, ply, pl, fac); break;
			case 1: AFui_invite_player(args, data, ply, pl, fac); break;
			case 2: AFui_remove_player(args, data, ply, pl, fac); break;
			case 3: return;
		}
	})
}

/**
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 */
async function AFui_add_player(args, data, ply, pl, fac) {
	let pl2 = await UI_find_player(pl)
	if (pl2) {
		let fac2 = db_faction.get(pl2.faction_name);
		if (fac2 == undefined) {
			remove_to_update_faction(fac);
			fac.playerList.push({ name: pl2.name, permission: "Visitor" });
			add_to_update_faction(fac);
			remove_to_update_player(pl2);
			pl2.faction_name = fac.name;
			add_to_update_player(pl2);
			return tellraw(pl.name, "§aPlayer " + pl2.name + " §eadded to faction " + fac.name);
		}
		else {
			tellraw(pl.name, "§cPlayer is already in the faction " + fac2.name);
			return AFui_manage_player(args, data, ply, pl, fac);
		}
	}
	else {
		tellraw(pl.name, "§cPlayer doesn't exist");
		return AFui_manage_player(args, data, ply, pl, fac);
	}
}

/**
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 */
function AFui_remove_player(args, data, ply, pl, fac) {
	let form = new ActionFormData().title("Remove Player")
	let permission;
	if (pl.hasTag(adminTag)) {
		permission = "a";
	}
	else {
		permission = fac.playerList.find((p) => p.name === pl.name).permission
		if (permission == "Member") {
			return tellraw(pl.name, "§cYou don't have permission to do this")
		}
	}
	let list = [];
	fac.playerList.forEach((p) => {
		if (permission == "a") {
			list.push(p)
			form.button(p.name)
		}
		else if (permission == "Leader") {
			if (p.permission != "Leader") {
				list.push(p)
				form.button(p.name)
			}
		}
		else if (p.permission == "Officer") {
			if (p.permission != "Leader" && p.permission != "Officer") {
				list.push(p)
				form.button(p.name)
			}
		}
	})
	form.show(pl).then(res => {
		if (res.canceled) {
			return AFui_manage_player(args, data, ply, pl, fac);
		}
		fac = db_faction.get(fac.name);
		if (fac == undefined) {
			return tellraw(pl.name, "§cIt seems like this faction is not exist anymore");
		}
		let removePlayer = fac.playerList.find((p) => p.name === list[res.selection].name);
		if (removePlayer != undefined) {
			remove_to_update_faction(fac);
			fac.playerList.splice(fac.playerList.indexOf(removePlayer), 1);
			if (fac.playerList.length != 0) {
				add_to_update_faction(fac);
				tellraw(pl.name, "§cNo more player in this faction, faction deleted");
			}
			let player = db_player.get(removePlayer.name);
			remove_to_update_player(player);
			player.faction_name = null;
			add_to_update_player(player);
			tellraw(pl.name, "§ePlayer §a" + removePlayer.name + " §cRemoved");
			sleep(10);
			return Fui(args, data, ply);
		}
		else {
			tellraw(pl.name, "§cIt seems like this player is not in this faction anymore");
		}
	})
}

/**
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @param {Ply} ply 
 * @param {Player} pl 
 * @param {faction} fac 
 */
function AFui_invite_player(args, data, ply, pl, fac) {
	new ModalFormData()
	.title("Invite Player")
	.textField("Player Name", "Player Name")
	.show(pl).then(res => {
		if (res.canceled) {
			return Fui(args, data, ply);
		}
		let pl2 = db_player.get(res.formValues[0]);
		if (pl2 != undefined) {
			let fac2 = db_faction.get(pl2.faction_name);
			if (fac2 == undefined) {
				remove_to_update_faction(fac);
				fac.invitList.push({name: pl2.name});
				add_to_update_faction(fac);
				return tellraw(pl.name, "§aPlayer " + pl2.name + " §einvited to faction " + fac.name);
			}
			else {
				tellraw(pl.name, "§cPlayer is already in the faction " + fac2.name);
				return AFui_invite_player(args, data, ply, pl, fac);
			}
		}
		else {
			tellraw(pl.name, "§cPlayer doesn't exist");
			return AFui_invite_player(args, data, ply, pl, fac);
		}
	})
}


/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
 */
function Wui(args, data, ply) {
	let lst_warp = []
	let pl = [...world.getPlayers()].find((p) => p.name === data.sender.name);
	if (data.sender.hasTag(adminTag)) {
		lst_warp = db_warp;
	}
	else {
		for (const warp of db_warp) {
		if (warp.deny.length == 0) {
			if (warp.allow.length == 0) {
				lst_warp.push(warp);
			}
			else {
				for (let i = 0; i < warp.allow.length; i++) {
					if (data.sender.hasTag(warp.allow[i].tag)) {
						lst_warp.push(warp);
						break;
					}
				}
			}
		}
		else {
			for (let i = 0; i < warp.deny.length; i++) {
				if (data.sender.hasTag(warp.deny[i].tag)) {
					break;
				}
				else if (i == warp.deny.length) {
					lst_warp.push(warp);
					//break; useless...
				}
			}
		}
	}}
	if (lst_warp.length > 0 || data.sender.hasTag(adminTag)) {
		tellraw(data.sender.name, "§o§7you have 2 seconds to quit the chat and the form will appear.")
		lst_warp.sort((a, b) => a.name.localeCompare(b.name))
		if (data.sender.hasTag(adminTag)) {
			system.runTimeout(() => {
				Wui_Admin(lst_warp, ply, pl)
			}, 30)
		}
		else {
			system.runTimeout(() => {
				Wtp_ui(ply, lst_warp, pl);
			}, 30)
		}
	}
	else {
		tellraw(data.sender.name, "§cYou don't have access to any warp or there is no warp created yet");
	}
}

function Wui_Admin(lst_warp, ply, pl) {
	let warp_form = new ActionFormData()
	warp_form.title("Admin Warp")
		.button("teleport")
		.button("add")
		.button("remove")
		.button("message")
		.button("open/close")
		.button("allow/deny")
		.button("commands")
		.button("delay")
	warp_form.show(pl).then((res) => {
		if (res.canceled == true) return;
		else {
			switch (res.selection) {
				case 0: Wtp_ui(ply, lst_warp, pl);		break;
				case 1: Wui_add(lst_warp, ply, pl);		break;
				case 2: Wui_remove(lst_warp, ply, pl);	break;
				case 3: Wui_message(lst_warp, ply, pl);	break;
				case 4: Wui_close(lst_warp, ply, pl);	break;
				case 5: Wui_allow(lst_warp, ply, pl);	break;
				case 6: Wui_cmd(lst_warp, ply, pl);		break;
				case 7: Wui_delay(lst_warp, ply, pl);	break;
				default: break;
			}
		}
	})
}

/**
 * @param {Ply} ply 
 * @param {warp[]} lst_warp 
 * @param {Player} pl 
 */
function Wtp_ui (ply, lst_warp, pl) {
	if (lst_warp.length == 0)
	{
		Wui_Admin(lst_warp, ply, pl);
		return;
	}
	let warp_form = new ActionFormData().title("Warp")
	lst_warp.forEach(warp => {
		warp_form.button(warp.name);
	})
	warp_form.show(pl).then((res) => {
		if (res.canceled == true) {
			if (pl.hasTag(adminTag)) {
				Wui_Admin(lst_warp, ply, pl);
			}
			else return;
		}
		else {
			Wwarp(["w", lst_warp[res.selection].name], { sender: pl }, ply);
		}
	})
}

/**
 * @param {warp[]} lst_warp
 * @param {Ply} ply 
 * @param {Player} pl 
 */
function Wui_add (lst_warp, ply, pl) {
	let warp_form = new ModalFormData()
	.title("add warp")
	.textField("Warp Name", "insert a warp name")
	.toggle("is open ?", true)
	.textField("delay §o§7(in seconds)", "time in seconde before the next tp", "5")
	.toggle("message display", false)
	.textField("message displayed", "so you try this warp then ?")
	warp_form.show(pl).then((res) => {
		if (res.canceled == true) {
			Wui_Admin(lst_warp, ply, pl);
		}
		else {
			let name = res.formValues[0];
			if (name.match(/^([0-9a-zA-Z ]){1,20}$/)) {
				if (db_warp.find((w) => w.name.toLowerCase() == name.toLowerCase()) == undefined) {
					let warp = newwarp(name, pl);
					warp.isOpen = res.formValues[1]
					if (res.formValues[2].match(/[0-9]/g) && parseInt(res.formValues[2]) >= 0) {
						warp.delay = res.formValues[2];
						warp.displayMessageOnTp = res.formValues[3];
						warp.message = res.formValues[4];
						add_warp(warp);
						tellraw(pl.name, translate(ply.lang, name, warp.x, warp.y, warp.z).warp_add);
					}
					else {
						tellraw(pl.name, translate(ply.lang).error_number);
					}
				}
				else {
					tellraw(pl.name, translate(ply.lang).error_have_name);
				}
			}
			else {
				tellraw(pl.name, translate(ply.lang).error_name)
			}
		}
	})
}

/**
 * @param {warp[]} lst_warp 
 * @param {Ply} ply 
 * @param {Player} pl 
 */
function Wui_remove(lst_warp, ply, pl) {
	if (lst_warp.length == 0)
	{
		Wui_Admin(lst_warp, ply, pl);
		return;
	}
	let warp_form = new ActionFormData().title("Remove Warp")
	lst_warp.forEach(warp => {
		warp_form.button(warp.name);
	})
	warp_form.show(pl).then((res) => {
		if (res.canceled == true) {
			Wui_Admin(lst_warp, ply, pl);
		}
		else {
			Wremove(["w", "remove", lst_warp[res.selection].name], { sender: pl }, ply);
		}
	})
	
}

/**
 * @param {warp[]} lst_warp 
 * @param {Ply} ply 
 * @param {Player} pl 
 */
function Wui_message(lst_warp, ply, pl) {
	if (lst_warp.length == 0)
	{
		Wui_Admin(lst_warp, ply, pl);
		return;
	}
	let warp_form = new ActionFormData().title("Select Warp to edit")
	lst_warp.forEach(warp => {
		warp_form.button(warp);
	})
	warp_form.show(pl).then((res) => {
		if (res.canceled == true) {
			Wui_Admin(lst_warp, ply, pl);
		}
		else {
			let warp = db_warp.find((w) => w.name.toLowerCase() == lst_warp[res.selection].name.toLowerCase());
			const warp_form2 = new ModalFormData()
			.title("Warp Message")
			.textField("Message :", "so you take this warp ? fine.", warp.message)
			.toggle("Display message on tp", warp.displayMessageOnTp)
			warp_form2.show(pl).then((res) => {
				if (res.canceled == true) {
					Wui_message(lst_warp, ply, pl)
				}
				else {
					remove_warp(warp);
					warp.message = res.formValues[0];
					warp.displayMessageOnTp = res.formValues[1];
					add_warp(warp);
					tellraw(pl.name, translate(ply.lang, warp.message).warp_msg_add);
					if (warp.displayMessageOnTp == true) {
						tellraw(pl.name, translate(ply.lang).warp_msg_on);
					}
					else {
						tellraw(pl.name, translate(ply.lang).warp_msg_off);
					}
				}
			})
		}
	})
}

/**
 * @param {warp[]} lst_warp 
 * @param {Ply} ply 
 * @param {Player} pl 
 */
function Wui_close(lst_warp, ply, pl) {
	if (lst_warp.length == 0)
	{
		Wui_Admin(lst_warp, ply, pl);
		return;
	}
	let warp_form = new ModalFormData()
	.title("Close Warp")
	lst_warp.forEach(warp => {
		warp_form.toggle(warp.name + "§o§7(uncheck for close)", warp.isOpen);
	})
	warp_form.show(pl).then((res) => {
		if (res.canceled == true) {
			Wui_Admin(lst_warp, ply, pl);
		}
		else {
			for (let i = 0; i < res.formValues.length; i++) {
				if (res.formValues[i] != lst_warp[i].isOpen) {
					let warp = db_warp.find((w) => w.name === lst_warp[i].name)
					remove_warp(warp);
					warp.isOpen = res.formValues[i];
					add_warp(warp);
					if (warp.isOpen == false) {
						tellraw(pl.name, translate(ply.lang, warp.name).warp_close);
					}
					else {
						tellraw(pl.name, translate(ply.lang, warp.name).warp_open);
					}
				}
			}
		}
	})
}

/**
 * 
 * @param {warp[]} lst_warp 
 * @param {Ply} ply 
 * @param {Player} pl 
 */
function Wui_allow(lst_warp, ply, pl) {
	if (lst_warp.length == 0)
	{
		Wui_Admin(lst_warp, ply, pl);
		return;
	}
	let warp_form = new ActionFormData().title("Select Warp to edit")
	lst_warp.forEach(warp => {
		warp_form.button(warp.name);
	})
	warp_form.show(pl).then((res) => {
		if (res.canceled == true) {
			Wui_Admin(lst_warp, ply, pl);
		}
		else {
			let warp = db_warp.find((w) => w.name.toLowerCase() == lst_warp[res.selection].name.toLowerCase());
			const simple_form = new ActionFormData()
				.title("Filter Action")
				.button("add")
				.button("remove")
				.button("list")
			simple_form.show(pl).then((resp) => {
				if (resp.canceled == true) {
					Wui_allow(lst_warp, ply, pl);
				}
				else {
					if (resp.selection == 2) {
						Waccess(["w", "access", "list", warp.name], {sender: pl},ply)
					}
					else {
						let warp_form2 = new ModalFormData()
							.title("Warp Allow/Deny")
						let lst_allow = ["none"]
						let lst_deny = ["none"]
						if (resp.selection == 0) {
							warp_form2.dropdown("Select Filter Type :", ["§aAllow", "§cDeny"])
							.textField("tag :", "the tag used for filter")
						}
						else if (warp.allow.length) {
							warp.allow.forEach(allow => {
								lst_allow.push(allow.tag)
							})
							warp.deny.forEach(deny => {
								lst_deny.push(deny.tag)
							})
							warp_form2.dropdown("select allow tag to remove", lst_allow)
							.dropdown("select deny tag to remove", lst_deny)
						}
						//+w access remove allow event test
						warp_form2.show(pl).then((ret) => {
							if (res.canceled == true) {
								Wui_allow(lst_warp, ply, pl);
							}
							else if (resp.selection == 0) {
								if (ret.formValues[0] == 0) {
									Waccess(["w", "access", "add", "allow", warp.name, ret.formValues[1]], {sender: pl}, ply);
								}
								else {
									Waccess(["w", "access", "add", "deny", warp.name, ret.formValues[1]], {sender: pl}, ply);
								}
							}
							else {
								if (lst_allow[ret.formValues[0]] == "none")
								{
									if (lst_deny[lst_deny[ret.formValues[1]]] == "none") {
										return ;
									}
									else {
										Waccess(["w", "access", "remove", "deny", warp.name, lst_deny[ret.formValues[1]]], {sender: pl}, ply);
									}
								}
								else if (lst_deny[ret.formValues[1]] == "none") {
									runCommand("say w acess remove allow " + warp.name + " " + lst_allow[ret.formValues[0]])
									Waccess(["w", "access", "remove", "allow", warp.name, lst_allow[ret.formValues[0]]], {sender: pl}, ply);
								}
								else {
									Waccess(["w", "access", "remove", "allow", warp.name, lst_allow[ret.formValues[0]]], {sender: pl}, ply);
									Waccess(["w", "access", "remove", "deny", warp.name, lst_deny[ret.formValues[1]]], {sender: pl}, ply);
								}
							}
						})
					}
				}
			})
		}
	})
}

/**
 * 
 * @param {warp[]} lst_warp 
 * @param {Ply} ply 
 * @param {Player} pl 
 */
function Wui_cmd(lst_warp, ply, pl) {
	if (lst_warp.length == 0)
	{
		Wui_Admin(lst_warp, ply, pl);
		return;
	}
	let warp_form = new ActionFormData().title("Select Warp to edit")
	lst_warp.forEach(warp => {
		warp_form.button(warp.name);
	})
	warp_form.show(pl).then((res) => {
		if (res.canceled == true) {
			Wui_Admin(lst_warp, ply, pl);
		}
		else {
			let warp = db_warp.find((w) => w.name.toLowerCase() == lst_warp[res.selection].name.toLowerCase());
			let warp_form2 = new ActionFormData()
			.title("Command Warp")
			.body("select which action you want to do")
			.button("add")
			.button("remove")
			.button("list")
			warp_form2.show(pl).then(ret => {
				if (ret.canceled == true) {
					Wui_Admin(lst_warp, ply, pl);
				}
				else {
					if (ret.selection == 2) {
						WrunCommand(["w", "cmd", "list", warp.name], {sender:pl}, ply)
					}
					else {
						let warp_form3 = new ModalFormData()
						if (ret.selection == 0) {
							warp_form3.title("Add Cmd Warp")
							.textField("Command", "")
							warp_form3.show(pl).then(resp => {
								if (ret.canceled == true) {
									Wui_Admin(lst_warp, ply, pl);
								}
								else {
									WrunCommand(["w", "cmd", "add", warp.name, resp.formValues[0]], {sender:pl}, ply);
								}
							})
						}
						else {
							warp_form3.title("Remove Cmd Warp")
							if (warp.runCommandAsync.length != 0) {
								warp.runCommandAsync.forEach(cmd => {
									warp_form3.toggle(cmd.cmd, false)
								})
								warp_form3.show(pl).then(resp => {
									if (ret.canceled == true) {
										Wui_Admin(lst_warp, ply, pl);
									}
									else {
										for (let i = 0; i < warp.runCommandAsync.length; i++) {
											if (resp.formValues[i] == true) {
												WrunCommand(["w", "cmd", "remove", warp.name, warp.runCommandAsync[i].cmd], {sender:pl}, ply)
											}
										}
									}
								}) 
							}
							else {
								tellraw(data.sender.name, translate(ply.lang).error_warp_cmd);
								Wui_Admin(lst_warp, ply, pl);
							}
						}
					}
				}
			})
		}
	})
}

/**
 * 
 * @param {warp[]} lst_warp 
 * @param {Ply} ply 
 * @param {Player} pl 
 */
 function Wui_delay(lst_warp, ply, pl) {
	if (lst_warp.length == 0)
	{
		Wui_Admin(lst_warp, ply, pl);
		return;
	}
	let warp_form = new ActionFormData().title("Select Warp to edit")
	lst_warp.forEach(warp => {
		warp_form.button(warp.name);
	})
	warp_form.show(pl).then((res) => {
		if (res.canceled == true) {
			Wui_Admin(lst_warp, ply, pl);
		}
		else {
			let warp = db_warp.find((w) => w.name.toLowerCase() == lst_warp[res.selection].name.toLowerCase());
			let warp_form2 = new ModalFormData()
			warp_form2.title("Warp delay")
			warp_form2.textField("delay in second", "time in seconds", warp.delay.toString())
			warp_form2.show(pl).then(ret => {
				if (res.canceled == true) {
					Wui_delay(lst_warp, ply, pl);
				}
				else {
					Wdelay(["w", "delay", warp.name, ret.formValues[0]], {sender:pl}, ply);
				}
			})
		}
	})
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function Pchat(args, data, ply) {
	if (!data.sender.hasTag(adminTag) && !ply.cmd_module.includes(cmd_module.all) && !ply.cmd_module.includes(cmd_module.chat)) return tellraw(data.sender.name, "§cThis Module is disabled.");
	if (args.length >= 2) {
		if (args[1] == "reset") {
			if (ply.chat != "all") {
				remove_to_update_player(ply);
				ply.chat = "all";
				add_to_update_player(ply);
				tellraw(data.sender.name, translate(ply.lang).private_chat_reset);
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_have_private_chat);
			}
		}
		else if (args[1].replace(/[@"]/g, "").match(/[A-Za-z0-9]/g)) {
			remove_to_update_player(ply)
			if (args[1] == "f") {
				ply.chat = "faction";
			}
			else if (args[1] == "a") {
				ply.chat = "ally";
			}
			else {
				ply.chat = args[1];
			}
			add_to_update_player(ply);
			tellraw(data.sender.name, translate(ply.lang, ply.chat).change_private_chat);
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_arg);
		}
	}
	else
	{
		remove_to_update_player(ply);
		ply.chat = "all";
		add_to_update_player(ply);
		tellraw(data.sender.name, translate(ply.lang).private_chat_reset);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function Plang(args, data, ply) {
	if (!data.sender.hasTag(adminTag) && !ply.cmd_module.includes(cmd_module.all) && !ply.cmd_module.includes(cmd_module.lang)) return tellraw(data.sender.name, "§cThis Module is disabled.");
    if (args.length == 2) {
        let player = db_player.get(data.sender.name);
        if (player != undefined) {
            if (list_lang().find((l) => l == args[1]) != undefined) {
                remove_to_update_player(player);
                ply.lang = args[1];
                add_to_update_player(player);
                tellraw(data.sender.name, translate(ply.lang).lang);
            }
            else {
                tellraw(data.sender.name, translate(ply.lang).error_lang);
            }
        }
    }
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function Alock(args, data, ply) {
    let admin = db_admin.find((a) => a.name === data.sender.name)
    if (admin != undefined) {
        if (args.length == 1) {
            runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
            if (db_map.lockAdmin == true) {
                db_map.lockAdmin = false;
                tellraw(data.sender.name, translate(ply.lang).unlock_admin_db);
            }
            else {
                db_map.lockAdmin = true;
                tellraw(data.sender.name, translate(ply.lang).lock_admin_db);
            }
            runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
        }
        else {
            tellraw(data.sender.name, translate(ply.lang).error_arg);
        }
    }
    else {
        tellraw(data.sender.name, translate(ply.lang).lock_error);
    }
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function Aadmin(args, data, ply) {
    if (args.length >= 4) {
        let name = "";
        for (let i = 3; i < args.length; i++) {
            name += args[i].replace(/[@"]/g, "") + " ";
        }
        name = name.trim();
        if (args[1] == "add") {
            if (args[2].replace(/"/g, "").match(/[a-zA-Z]/g)) {
                let player = db_player.get(name);
                if (player != undefined) {
                    if (db_admin.length > 0) { 
                        if (db_admin.find((a) => a.name === player.name) == undefined) {
                            runCommand(`tag "${player.name}" add "pswd:${args[2].replace(/"/g, "")}"`);
                            runCommand(`tag "${player.name}" add "${adminTag}"`);
                            add_admin(newadmin(player.name,args[2].replace(/"/g, "")));
                            tellraw(data.sender.name, translate(ply.lang).add_admin);
                            return;
                        }
                        else {
                            tellraw(data.sender.name, translate(ply.lang).add_admin_error);
                        }
                    }
                    else {
                        runCommand(`tag "${player.name}" add "pswd:${args[2].replace(/"/g, "")}"`);
                        runCommand(`tag "${player.name}" add "${adminTag}"`);
                        add_admin(newadmin(player.name,args[2].replace(/"/g, "")));
                        tellraw(data.sender.name, translate(ply.lang).add_admin);
                        return;
                    }
                }
                else {
                    tellraw(data.sender.name, translate(ply.lang).error_find_player);
                }
            }
            else {
                tellraw(data.sender.name, translate(ply.lang).error_pass);
            }
        }
    }
    if (args.length >= 3) {
        if (args[1] == "remove") {
            let name = "";
            for (let i = 2; i < args.length; i++) {
                name += args[i].replace(/[@"]/g, "") + " ";
            }
            name = name.trim();
            let admin = db_admin.find((p) => p.name.toLowerCase() == name.toLowerCase());
            let player = db_player.get(name);
            if (admin != undefined && player != undefined) {
                runCommand(`tag "${player.name}" remove "pswd:${admin.password}"`);
                remove_admin(admin);
                tellraw(data.sender.name, translate(ply.lang).remove_admin);
            }
            else {
                tellraw(data.sender.name, translate(ply.lang).error_find_admin);
            }
        }
        else {
            tellraw(data.sender.name, translate(ply.lang).error_arg);
        }
    }
    else if (args.length == 2) {
        if (args[1] == "list") {
            db_admin.forEach(admin => {
                tellraw(data.sender.name, admin.name);
            })
        }
    }
    else {
        tellraw(data.sender.name, translate(ply.lang).error_arg);
    }
}

function newadmin(name,password) {
    return {name:name,permissionLevel:99,password:password}
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function Aunban (args, data, ply) {
    if (args.length >= 2) {
        let name = "";
        for (let i = 1; i < args.length; i++) {
            name += args[i].replace(/[@"]/g, "") + " ";
        }
        name = name.trim();
        let player = db_player.get(name);
        if (player != undefined) {
            remove_to_update_player(player);
            player.isunban=true;
            add_to_update_player(player);
            tellraw(data.sender.name, translate(ply.lang, player.name).unban);
        }
        else {
            tellraw(data.sender.name, translate(ply.lang).error_find_player);
        }
    }
    else {
        tellraw(data.sender.name, translate(ply.lang).error_arg);
    }
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function Aback(args, data, ply) {
    if (args.length == 1) {
        let player = db_player.get(data.sender.name);
        if (player != undefined) {
            let back = {
                x:Math.ceil(data.sender.location.x + 0.0001) - 1,
                y:Math.floor(data.sender.location.y + 0.4999),
                z:Math.ceil(data.sender.location.z + 0.0001) - 1
            }
			runCommand(`tp "${data.sender.name}" ${player.back.x} ${player.back.y} ${player.back.z}`);
			tpsound([...world.getPlayers()].find((p) => p.name === data.sender.name));
			log(data.sender.name)
            remove_to_update_player(player);
            player.back = back;
            add_to_update_player(player);
        }
        else {
            tellraw(data.sender.name, translate(ply.lang).error_find_player);
        }
    }
    else {
        tellraw(data.sender.name, translate(ply.lang).error_arg);
    }
}

/**
 * @param {Player} player 
 */
async function tpsound(player) {
	await sleep(2);
	await player.runCommandAsync(`playsound mob.shulker.teleport`);
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function Atp(args, data, ply) {
	if (db_delay.has(ply.name)) if (!check_time(db_delay.get(ply.name))) return tellraw(ply.name, "§cYou have to wait " + (db_delay.get(ply.name).time - new Date().getTime()) / 1000 + " seconds before using this command.");
    if (args.length == 2) {
        let player = db_player.get(args[1].replace(/[@"]/g,""));
        if (player != undefined) {
            let sender = db_player.get(data.sender.name);
            if (sender != undefined) {
                remove_to_update_player(sender);
                sender.back.x = Math.ceil(data.sender.location.x + 0.0001) - 1;
                sender.back.y = Math.floor(data.sender.location.y + 0.4999);
                sender.back.z = Math.ceil(data.sender.location.z + 0.0001) - 1;
                add_to_update_player(sender);
            }
            runCommand(`tp "${data.sender.name}" "${player.name}"`);
			tpsound([...world.getPlayers()].find((p) => p.name === data.sender.name));
		}
        else {
            tellraw(data.sender.name, translate(ply.lang).error_find_player);
        }
    }
    else {
        tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

function Aset_ui(ply, pl) {
	tellraw(pl.name, "§o§7you have 1 seconds to quit the chat and the form will appear.")
	system.runTimeout(() => {
		new ActionFormData()
			.title("Admin Setting")
			.button(`Command Prefix : ${db_map.prefix}`)
			.button(`Chat Prefix : ${db_map.chatPrefix}`)
			.button(`Faction Seprarator : ${db_map.factionSeparator}`)
			.button(`Custom Name : §e${db_map.customName ? "§aOn" : "§cOff"}`)
			.button(`All Delay : §etpa ${db_map.tpaDelay}\npvp ${db_map.playerHurtDelay} §7 | §epve ${db_map.randomHurtDelay}`)
			.button(`Refresh Tick : §e${db_map.refreshTick}`)
			.button(`Home Player Limit : §e${db_map.homeLimit}`)
			.button(`Member Faction Limit : §e${db_map.factionMemberLimit}`)
			.button(`Allow Faction Home : ${db_map.isFhome ? "§aAllow" : "§cDeny"}`)
			.button(`UTC / Timezone : §e${db_map.UTC}`)
			.button(`Score Money : §e${db_map.scoreMoney}`)
			.button(`Faction Color : ${db_map.factionColor}Color`)
			.button(`Rule Code : §e${db_map.ruleCode.isRuleCode ? "§aOn" : "§cOff"}\nCode : §0${db_map.ruleCode.code}`)
			.button(`powerLimit / PowerRefresh : \n§emin:${db_map.powerLimit.min}, max:${db_map.powerLimit.max} / ${db_map.timeToRegenPower}`)
			.button(`Command Module`)
			.show(pl).then((res) => {
				if (res.canceled) return;
				switch (res.selection) {
					case 0: return set_command_prefix_ui(ply, pl);
					case 1: return set_chat_prefix_ui(ply, pl);
					case 2: return set_faction_separator_ui(ply, pl);
					case 3: return set_custom_name_ui(ply, pl);
					case 4: return set_all_delay_ui(ply, pl);
					case 5: return set_refresh_tick_ui(ply, pl);
					case 6: return set_home_limit_ui(ply, pl);
					case 7: return set_faction_member_limit_ui(ply, pl);
					case 8: return set_faction_home_ui(ply, pl);
					case 9: return set_UTC_ui(ply, pl);
					case 10: return set_score_money_ui(ply, pl);
					case 11: return set_faction_color(ply, pl);
					case 12: return set_rule_code(ply, pl);
					case 13: return set_power_ui(ply, pl);
					case 14: return set_command_module_ui(ply, pl);
				}
			})
	}, 20)
}

function set_power_ui(ply, pl) {
	new ModalFormData()
		.title("Power Setting")
		.textField("§eMin Power", db_map.powerLimit.min.toString(), db_map.powerLimit.min.toString())
		.textField("§eMax Power", db_map.powerLimit.max.toString(), db_map.powerLimit.max.toString())
		.textField("§ePower Refresh (in minutes)", db_map.timeToRegenPower.toString(), db_map.timeToRegenPower.toString())
		.show(pl).then(res => {
			if (res.canceled || (
				res.formValues[0] == db_map.powerLimit.min &&
				res.formValues[1] == db_map.powerLimit.max &&
				res.formValues[2] == db_map.timeToRegenPower)) return;
			if (!res.formValues.every(v => v.match(/[0-9]/g))) return tellraw(pl.name, "§cYou need to enter a number.");
			
			const powmin = parseInt(res.formValues[0]);
			const powmax = parseInt(res.formValues[1]);
			const powref = parseInt(res.formValues[2]);

			if (powmin > powmax) return tellraw(pl.name, "§cMin power can't be higher than max power.");
			if (powref < 0) return tellraw(pl.name, "§cPower refresh can't be lower than 0.");

			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.powerLimit.min = parseInt(res.formValues[0]);
			db_map.powerLimit.max = parseInt(res.formValues[1]);
			db_map.timeToRegenPower = parseInt(res.formValues[2]);
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(ply.name, "§eMin Power: " + db_map.powerLimit.min + "\n§eMax Power: " + db_map.powerLimit.max + "\n§ePower Refresh: " + db_map.timeToRegenPower);
		})
}

function set_command_module_ui(ply, pl) {
	const all = db_map.default_cmd_module.includes(cmd_module.all)
	new ModalFormData()
		.title("Command Module\n(to disable command related to a module, uncheck the box)")
		.toggle("§e Home Module", all || db_map.default_cmd_module.includes(cmd_module.home))
		.toggle("§e Faction Module", all || db_map.default_cmd_module.includes(cmd_module.faction))
		.toggle("§e Warp Module", all || db_map.default_cmd_module.includes(cmd_module.warp))
		.toggle("§e Tpa Module", all || db_map.default_cmd_module.includes(cmd_module.tpa))
		.toggle("§e Chat Module", all || db_map.default_cmd_module.includes(cmd_module.chat))
		.toggle("§e Lang Module", all || db_map.default_cmd_module.includes(cmd_module.lang))
		.toggle("§e Money Module", all || db_map.default_cmd_module.includes(cmd_module.money))
		.toggle("§e Shop Module \n(Not Implemented)", all || db_map.default_cmd_module.includes(cmd_module.shop))
		.toggle("§e Rule Module", all || db_map.default_cmd_module.includes(cmd_module.rule))
		.toggle("§a Apply to all Player (if false it will only apply to new player)", false)
		.show(pl).then(res => {
			if (res.canceled) return;
			if ([...res.formValues].splice(0, res.formValues.length - 1).every((v) => v === true) && db_map.default_cmd_module.length > 1 && db_map.default_cmd_module[0] !== cmd_module.all) {
				Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
				db_map.default_cmd_module = [cmd_module.all];
				Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			}
			else if (![...res.formValues].splice(0, res.formValues.length - 1).every((v) => v === true)) {
				Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
				db_map.default_cmd_module = [];
				Object.keys(cmd_module).forEach((key) => {
					if (res.formValues[cmd_module[key]]) {
						db_map.default_cmd_module.push(cmd_module[key] + 1); // décalage de 1 car all = 0
					}
				});
				Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			}

			if (res.formValues[res.formValues.length - 1]) {
				let i = 0;
				db_player.forEach(async (p) => {
					i++;
					remove_to_update_player(p);
					p.cmd_module = db_map.default_cmd_module;
					add_to_update_player(p);
					if (i % 20 == 0) await sleep(1);
				});
			}
			tellraw(ply.name, "§eModule Allowed : " + translateCmdModuleValues(db_map.default_cmd_module));
		})
}

function set_rule_code(ply, pl) {
	new ModalFormData()
		.title("Rule Code")
		.toggle("§eRule Code", db_map.ruleCode.isRuleCode)
		.toggle("Generate random code", db_map.ruleCode.isAutoGen)
		.textField("§eCode", db_map.ruleCode.code, db_map.ruleCode.code)
		.show(pl).then(res => {
			if (res.canceled || (
				res.formValues[0] == db_map.ruleCode.isRuleCode && 
				res.formValues[1] == db_map.ruleCode.isAutoGen && 
				res.formValues[2] == db_map.ruleCode.code
				)) return;
				const display = db_display.find((d) => d.type == "rule");
				if (res.formValues[0] && (display === undefined || !display.text.includes("<code>"))) {
					return tellraw(pl.name, "§cYou need to add <code> in the rule display to use this function.");
				}
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.ruleCode.isRuleCode = res.formValues[0];
			db_map.ruleCode.isAutoGen = res.formValues[1];
			db_map.ruleCode.code = res.formValues[2].trim();
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(ply.name, "§eIs Rule Code: " + db_map.ruleCode.isRuleCode.toString() + "\n §eis Auto Generate: " + db_map.ruleCode.isAutoGen.toString() + "\n §eNew Code: '" + db_map.ruleCode.code + "'");
		});
}

function set_faction_color(ply, pl) {
	new ModalFormData()
		.title("Faction Color")
		.textField("§eColor", db_map.factionColor, db_map.factionColor)
		.toggle("§eApply to all faction", false)
		.show(pl).then(res => {
			if (res.canceled || res.formValues[0] == db_map.factionColor && !res.formValues[1]) return;
			if (!res.formValues[0].match(/^.*§[a-u0-9]+.*$/)) return tellraw(pl.name, "§cThe Text can only contain color code. exemple : §a§l§o");
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.factionColor = res.formValues[0];
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Faction Color: " + db_map.factionColor);
			if (res.formValues[1]) {
				let i = 0;
				db_faction.forEach(async faction => {
					if (faction.color != res.formValues[0]) {
						remove_to_update_faction(faction);
						faction.color = res.formValues[0];
						add_to_update_faction(faction);
						log("§e" + faction.name + " edited.");
					}
					if (i++ % 20 == 0) await sleep(1);
				});
			}
		});
}

function set_score_money_ui(ply, pl) {
	new ModalFormData()
		.title("Score Money")
		.textField("§eScore Money", db_map.scoreMoney, db_map.scoreMoney)
		.show(pl).then(res => {
			if (res.canceled || res.formValues[0] == db_map.scoreMoney) return;
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.scoreMoney = res.formValues[0];
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Score Money: " + db_map.scoreMoney);
		});
}

function set_UTC_ui(ply, pl) {
	new ModalFormData()
		.title("UTC / Timezone")
		.slider("§eUTC", -12, 12, 1, db_map.UTC)
		.show(pl).then(res => {
			if (res.canceled || res.formValues[0] == db_map.UTC) return;
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.UTC = res.formValues[0];
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew UTC: " + db_map.UTC);
		});
}

function set_faction_home_ui(ply, pl) {
	new ModalFormData()
		.title("Allow Faction Home")
		.toggle("§eAllow Faction Home", db_map.isFhome)
		.toggle("§eApply to all faction", false)
		.show(pl).then(res => {
			if (res.canceled || res.formValues[0] == db_map.isFhome && !res.formValues[1]) return;
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.isFhome = res.formValues[0];
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Allow Faction Home: " + db_map.isFhome);
			if (res.formValues[1]) {
				let i = 0;
				db_faction.forEach(async faction => {
					if (faction.isFhome != res.formValues[0]) {
						remove_to_update_faction(faction);
						faction.isFhome = res.formValues[0];
						add_to_update_faction(faction);
						log("§e" + faction.name + " edited.");
					}
					if (i++ % 20 == 0) await sleep(1);
				});
			}
		});
}

function set_faction_member_limit_ui(ply, pl) {
	new ModalFormData()
		.title("Member Faction Limit")
		.textField("§eLimit", db_map.factionMemberLimit.toString(), db_map.factionMemberLimit.toString())
		.toggle("§eApply to all faction", false)
		.show(pl).then(res => {
			if (res.canceled || res.formValues[0].match(/[0-9]/g) == null || res.formValues[0] == db_map.factionMemberLimit && !res.formValues[1]) return;
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.factionMemberLimit = parseInt(res.formValues[0]);
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Member Faction Limit: " + db_map.factionMemberLimit);
			if (res.formValues[1]) {
				let i = 0;
				db_faction.forEach(async faction => {
					if (faction.memberLimit != res.formValues[0]) {
						remove_to_update_faction(faction);
						faction.memberLimit = parseInt(res.formValues[0]);
						add_to_update_faction(faction);
						log("§e" + faction.name + " edited.");
					}
					if (i++ % 20 == 0) await sleep(1);
				});
			}
		});
}

function set_home_limit_ui(ply, pl) {
	new ModalFormData()
		.title("Home Limit")
		.textField("§eLimit", db_map.homeLimit.toString(), db_map.homeLimit.toString())
		.toggle("§eApply to all player", false)
		.show(pl).then(res => {
			if (res.canceled || res.formValues[0].match(/[0-9]/g) == null || (res.formValues[0] == db_map.homeLimit && !res.formValues[1])) return;
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.homeLimit = res.formValues[0];
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Home Limit: " + db_map.homeLimit);
			if (res.formValues[1]) {
				const nb = res.formValues[0];
				system.run(async () => {
					let index = 0;
					for (const player of Array.from(db_player.values())) {
						if (player.homeLimit != nb) {
							remove_to_update_player(player);
							player.homeLimit = nb;
							add_to_update_player(player);
						}
						if (index % 10 == 0) {
							runCommand(`title @a[tag=log] actionbar §eEditing Player Database Progression : §a${Math.floor(index / db_player.size * 100)}%`);
							await sleep(2);
						}
						index++;
					}
				})
			}
		});
}

function set_refresh_tick_ui (ply, pl) {
	new ModalFormData()
		.title("Refresh Tick")
		.slider("§eRefresh Tick", 1, 40, 1, db_map.refreshTick)
		.show(pl).then(res => {
			if (res.canceled || res.formValues[0] == db_map.refreshTick) return;
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.refreshTick = res.formValues[0];
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Refresh Tick: " + db_map.refreshTick);
		});
}

function set_all_delay_ui (ply, pl) {
	new ModalFormData()
		.title("Tpa Delay")
		.textField("§eTpa Delay", db_map.tpaDelay.toString(), db_map.tpaDelay.toString())
		.textField("§ePvP Delay", db_map.playerHurtDelay.toString(), db_map.playerHurtDelay.toString())
		.textField("§ePvE Delay", db_map.randomHurtDelay.toString(), db_map.randomHurtDelay.toString())
		.show(pl).then(res => {
			if (res.canceled || 
				res.formValues[0].match(/[0-9]/g) === null || 
				res.formValues[1].match(/[0-9]/g) === null || 
				res.formValues[2].match(/[0-9]/g) === null || 
				(res.formValues[0] === db_map.tpaDelay && 
				res.formValues[1] === db_map.playerHurtDelay && 
				res.formValues[2] === db_map.randomHurtDelay)) return;
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.tpaDelay = parseInt(res.formValues[0]);
			db_map.playerHurtDelay = parseInt(res.formValues[1]);
			db_map.randomHurtDelay = parseInt(res.formValues[2]);
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Delay: \n§eTpa = " + db_map.tpaDelay + "\n§ePvP = " + db_map.playerHurtDelay + "\n§ePvE = " + db_map.randomHurtDelay);
		});
}

function set_custom_name_ui (ply, pl) {
	new ModalFormData()
		.title("Custom Name")
		.toggle("§eCustom Name", db_map.customName)
		.toggle("§eShow Heart", db_map.showHeart)
		.toggle("§eShow Role", db_map.showRole)
		.show(pl).then(res => {
			if (res.canceled || res.formValues[0] == db_map.customName && res.formValues[1] == db_map.showHeart && res.formValues[2] == db_map.showRole) return;
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.customName = res.formValues[0];
			db_map.showHeart = res.formValues[1];
			db_map.showRole = res.formValues[2];
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Custom Name: " + db_map.customName.toString() + " \nHeart : " + db_map.showHeart.toString() + " \nRole : " + db_map.showRole.toString());
		});
}

function set_faction_separator_ui (ply, pl) {
	new ModalFormData()
		.title("Faction Separator")
		.textField("§eSeparator", db_map.factionSeparator, db_map.factionSeparator)
		.toggle("§eApply to all faction", false)
		.show(pl).then(res => {
			if (res.canceled || (res.formValues[0] == db_map.factionSeparator) && !res.formValues[1]) return;
			if (res.formValues[0].length > 2) return tellraw(pl.name, "§cSeparator must be 2 character long.");
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.factionSeparator = res.formValues[0];
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Faction Separator: " + db_map.factionSeparator);
			if (res.formValues[1]) {
				let i = 0;
				db_faction.forEach(async faction => {
					if (faction.separator != res.formValues[0]) {
						remove_to_update_faction(faction);
						faction.separator = res.formValues[0];
						add_to_update_faction(faction);
						log("§e" + faction.name + " edited.");
					}
					if (i++ % 20 == 0) await sleep(1);
				});
			}
		});
}

function set_chat_prefix_ui (ply, pl) {
	new ModalFormData()
		.title("Chat Prefix")
		.textField("§ePrefix", db_map.chatPrefix, db_map.chatPrefix)
		.show(pl).then(res => {
			if (res.canceled || res.formValues[0] == db_map.chatPrefix) return;
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.chatPrefix = res.formValues[0];
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Chat Prefix: " + db_map.chatPrefix);
		});
}

function set_command_prefix_ui (ply, pl) {
	new ModalFormData()
		.title("Command Prefix")
		.textField("§cYou can't use \"/\" as a Prefix\n§ePrefix", db_map.prefix, db_map.prefix)
		.show(pl).then(res => {
			if (res.canceled || res.formValues[0] == "/" || res.formValues[0] == db_map.prefix) return;
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.prefix = res.formValues[0];
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Command Prefix: " + db_map.prefix);
		});
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function setrefreshtick (args, data, ply) {
	let pl = [...world.getPlayers()].find(p => p.name === data.sender.name);
	tellraw(pl.name, "§o§7you have 1 seconds to quit the chat and the form will appear.")
	system.runTimeout(() => {
		new ModalFormData()
		.title("§eRefresh Tick Frequency")
		.slider("§cWarning, can be unstable under 5 tick\n§eRefresh Tick", 1, 40, 1, db_map.refreshTick)
		.show(pl).then(async res => {
			if (res.canceled) return;
			await Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.refreshTick = res.formValues[0];
			await Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Refresh Frequency: " + db_map.refreshTick + " Tick\nCustom Name Refresh Frequency: " + db_map.refreshTick * 4 + " Tick");
		})
	}, 20)
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function setchatprefix(args, data, ply) {
	let pl = [...world.getPlayers()].find(p => p.name === data.sender.name);
	tellraw(pl.name, "§o§7you have 1 seconds to quit the chat and the form will appear.")
	system.runTimeout(() => {
		new ModalFormData()
		.title("§eChat Prefix")
		.textField("§ePrefix", db_map.chatPrefix, db_map.chatPrefix)
		.show(pl).then(res => {
			if (res.canceled) return;
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.chatPrefix = res.formValues[0];
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Chat Prefix: " + db_map.chatPrefix);
		});
	}, 20)
	tellraw(ply.name, "§7Please quit chat, the form will appear in 5 seconds.");
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function settpadelay(args, data, ply) {
    if (args.length == 2) {
        if (args[1].match(/[0-9]/g)) {
            runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
            db_map.tpaDelay = parseInt(args[1]);
            runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
            tellraw(data.sender.name, translate(ply.lang, args[1]).set_tpa_delay);
        }
        else {
            tellraw(data.sender.name, translate(ply.lang).error_number);
        }
    }
    else {
        tellraw(data.sender.name,translate(ply.lang).error_arg);
    }
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function Adisplay_ui(args, data, ply) {
	let pl = [...world.getPlayers()].find((p) => p.name === data.sender.name);
	tellraw(data.sender.name, "§o§7you have 2 seconds to quit the chat and the form will appear.")
	system.runTimeout(() => {
		let form = new ActionFormData()
		.title("Display")
		.button("Add")
		.button("Edit")
		.button("Duplicate")
		.button("Delete")
		.show(pl).then(res => {
			if (res.canceled == true) {
				return;
			}
			else if (res.selection == 0) {
				add_display_ui({sender:pl}, ply);
			}
			else if (res.selection == 1) {
				edit_display_ui({sender:pl}, ply)
			}
			else if (res.selection == 2) {
				duplicate_display_ui({sender:pl}, ply);
			}
			else {
				remove_display_ui({sender:pl}, ply);
			}
		})
	}, 30)
}

function duplicate_display_ui(data, ply) {
	let form = new ActionFormData()
		.title("Duplicate Display")
	let copy_db = db_display.filter(d => d.type !== "rule");
	copy_db.forEach(display => {
		form.button(`TAG : ${display.tag}\nTYPE : ${display.type}`);
	})
	form.button("Quit");
	form.show(data.sender).then(res => {
		if (res.canceled == true || copy_db.length == 0) {
			Adisplay_ui(["display"], data, ply);
		}
		else if (res.selection == copy_db.length) {
			return;
		}
		else if (res.selection !== undefined) {
			let display = copy_db[res.selection]
			let dropdown = ["actionbar", "title"];
			new ModalFormData()
				.title("Duplicate Display")
				.textField("New Tag", display.tag)
				.dropdown("New Type", dropdown, dropdown.indexOf(display.type))
				.show(data.sender).then(res2 => {
					if (res2.canceled == true) {
						duplicate_display_ui(data, ply);
					}
					else {
						const new_display = newdisplay(display.text.replace("\n", "\\n"), dropdown[res2.formValues[1]], res2.formValues[0]);
						if (copy_db.find(d => d.tag == new_display.tag && d.type === new_display.type) !== undefined) {
							return tellraw(data.sender.name, "§cThis tag & type combination is already used.\n§ccanceling duplicate.");
						}
						add_display(new_display);
						tellraw(data.sender.name, "§6Display duplicated !");
					}
				})
		}
	})
}


/**
 * @param {Ply} ply
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function edit_display_ui(data, ply) {
	let form = new ActionFormData()
	.title("§6Edit Display")
	db_display.forEach(display => {
		form.button(`TAG : ${display.tag}\nTYPE : ${display.type}`);
	})
	form.button("Quit");
	form.show(data.sender).then(res => {
		if (res.canceled == true) {
			Adisplay_ui(["display"], data, ply);
		}
		else if (res.selection == db_display.length) {
			return ;
		}
		else {
			/**
			 * @type {display}
			 */
			let display = db_display[res.selection]
			let form = new ModalFormData()
			.title("§6Edit Display")
			let nb_return_line = display.text.split("\n");
			if (nb_return_line.length == 1) nb_return_line = display.text.split("\\n");
			for (let i = 0; i < nb_return_line.length; i++) {
				form.textField(`Line ${i + 1}`, nb_return_line[i], nb_return_line[i])
			}
			form.show(data.sender).then(res => {
				if (res.canceled == true) {
					edit_display_ui(data, ply);
				}
				else {
					let text = "";
					for (let i = 0; i < nb_return_line.length; i++) {
						text += res.formValues[i] + "\\n";
					}
					text = text.slice(0, -2);
					if (display.type == "rule" && db_map.ruleCode.isRuleCode && !text.includes("<code>")) {
						return tellraw(data.sender.name, "§cYou turned on rule code, you need to add <code> in the rule display, §ccanceling edit.");
					}
					remove_display(display);
					display.text = text;
					add_display(display);
					tellraw(data.sender.name, "§6Display edited !");
				}
			})
		}
	})
}

/**
 * @param {Ply} ply
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function remove_display_ui(data, ply) {
	let form = new ActionFormData()
	.title("Remove Display");
	db_display.forEach(display => {
		form.button(`TAG : ${display.tag}\nTYPE : ${display.type}`);
	})
	form.button("Quit");
	form.show(data.sender).then(res => {
		if (res.canceled == true || db_display.length == 0) {
			Adisplay_ui(["display"], data, ply);
		}
		else if (res.selection == db_display.length) {
			return ;
		}
		else {
			log("res : " + res.selection);
			let display = db_display[res.selection]
			remove_display(display);
			remove_display_ui(data, ply);
		}
	})
}

/**
 * @param {Ply} ply
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function add_display_ui(data, ply)
{
	const dropdown = ["actionbar", "title", "rule"];
	new ModalFormData()
	.title("Add display setting")
	.dropdown("display type", dropdown)
	.slider("amount of line", 1, 30, 1, 10)
	.show(data.sender).then(res1 => {
		if (res1.canceled == true) {
			return Adisplay_ui(["display"], data, ply);
		}
		const nbLine = res1.formValues[1];
		const type = dropdown[res1.formValues[0]];
		if (type == "rule") {
			if (db_display.filter(d => d.type == "rule").length >= 1) return tellraw(data.sender.name, "§cYou can't add more than 1 rule display.");
			let form = new ModalFormData()
				.title("Add Rule")
			for (let i = 0; i < nbLine; i++) {
				form.textField(`Line n°${i + 1}`, "");
			}
			form.show(data.sender).then(res => {
				if (res.canceled == true) {
					return add_display_ui(data, ply);
				}
				let display = "";
				for (let i = 0; i < nbLine; i++) {
					if (i + 1 == nbLine) {
						display += res.formValues[i];
					}
					else {
						display += res.formValues[i] + "\\n";
					}
				}
				Adisplay(["display", "add", dropdown[res1.formValues[0]], display], data, ply);
			})
		}
		else {
			let form = new ModalFormData()
				.title("Add Display")
				.textField("tag", "player", "");
			for (let i = 0; i < res1.formValues[1]; i++) {
				form.textField(`Line n°${i + 1}`, "");
			}
			form.show(data.sender).then(res => {
				if (res.canceled == true) {
					return add_display_ui(data, ply);
				}
				let display = "";
				for (let i = 0; i < res1.formValues[1]; i++) {
					if (i + 1 == res1.formValues[1]) {
						display += res.formValues[i + 1];
					}
					else {
						display += res.formValues[i + 1] + "\\n";
					}
				}
				Adisplay(["display", "add", dropdown[res1.formValues[0]], res.formValues[0], display], data, ply);
			})
		}
	})
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function Adisplay(args, data, ply) {
    if (args.length >= 5 || (args.length == 4 && args[2] == "rule")) {
        if (args[1] == "add") {
            if (args[2] == "title" || args[2] == "actionbar") {
                if(args[3].replace(/"/g,"").match(/[a-zA-Z:§0-9]{1,}/g)) {
                    let name = "";
                    for (let i = 4; i < args.length; i++) {
                        name += args[i].replace(/["]/g, "") + " ";
                    }
                    add_display(newdisplay(name.replace(/"/g,"'").replace(/\\n/g,"☼").replace(/\\/g,"").replace(/☼/g,"\n") + "§r", args[2], args[3]));
                    tellraw(data.sender.name, translate(ply.lang).add_display);
                }
                else {
                    tellraw(data.sender.name, translate(ply.lang).error_tag);
                }
            }
			else if (args[2] == "rule") {
				let name = "";
				for (let i = 3; i < args.length; i++) {
					name += args[i].replace(/["]/g, "") + " ";
				}
				add_display(newdisplay(name.replace(/"/g,"'").replace(/\\n/g,"☼").replace(/\\/g,"").replace(/☼/g,"\n") + "§r", args[2]));
				tellraw(data.sender.name, translate(ply.lang).add_display);
			}
            else {
                tellraw(data.sender.name, translate(ply.lang).error_arg_display);
            }
        }
    }
    else if (args.length == 3) {
        if (args[1] == "remove") {
            if (args[2].match(/[0-9]/g)) {
                let nb = parseInt(args[2]);
                if (db_display.length-1 >= nb) {
                    remove_display(db_display[nb]);
                    tellraw(data.sender.name, translate(ply.lang, nb).remove_display);
                }
                else {
                    tellraw(data.sender.name, translate(ply.lang, prefix).error_find_display);
                }
            }
            else {
                tellraw(data.sender.name, translate(ply.lang, prefix).error_number_display);
            }
        }
    }
    else if (args.length == 2) {
        if (args[1] == "list") {
            for (let i = 0; i < db_display.length; i++) {
                tellraw(data.sender.name, `§e§lId : §c${i}\n§etype : §a${db_display[i].type}\n§eTag : §d${db_display[i].tag === undefined ? "§cNONE" : db_display[i].tag}\n§r${db_display[i].text.replace(/\\/g,"\\\\")}`);
            }
        }
        else {
            tellraw(data.sender.name, translate(ply.lang).error_arg_display2);
        }
    }
    else {
        tellraw(data.sender.name,translate(ply.lang).error_arg);
    }
}

/**
 * @param {string} text 
 * @param {string} type 
 * @param {string} tag 
 * @returns {display}
 */
function newdisplay(text, type, tag) {
	return {tag:tag, text:text, type:type}
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function db(args, data, ply) {
	if (args.length == 1) {
		initDB_map();
		initDB_warp();
		initDB_player();
		initDB_admin();
		initDB_faction();
		initDB_display();
		initDB_delay();
		log(JSON.stringify(db_map) + "\n\n");
		log(JSON.stringify(Array.from(db_delay.values())) + "\n\n");
		log(JSON.stringify(Array.from(db_player.values())) + "\n\n");
		log(JSON.stringify(Array.from(db_faction.values())) + "\n\n");
		log(JSON.stringify(db_warp) + "\n\n");
		log(JSON.stringify(db_display)); return;
	}
	else if (args[1] == "map") {
		log(JSON.stringify(db_map, null, 8));
	}
	else if (args[1] == "player") {
		let i = 0;
		if (args.length == 3 && args[2].match(/[0-9]/g)) {
			i = args[2];
		}
		if (db_player.size - 1 >= i) {
			log(JSON.stringify(Array.from(db_player.values())[i], null, 8));
			i++;
		}
		log("§6 Length : " + db_player.size);
	}
	else if (args[1] == "delay") {
		let i = 0;
		if (args.length == 3 && args[2].match(/[0-9]/g)) {
			i = args[2];
		}
		if (db_delay.size - 1 >= i) {
			log(JSON.stringify(Array.from(db_delay.values())[i], null, 8));
			i++;
		}
		log("§6 Length : " + db_delay.size);
	}
	else if (args[1] == "faction") {
		let i = 0;
		if (args.length == 3 && args[2].match(/[0-9]/g)) {
			i = args[2];
		}
		if (db_faction.size - 1 >= i) {
			log(JSON.stringify(Array.from(db_faction.values())[i], null, 8));
			i++;
		}
		log("§6 Length : " + db_faction.size);
	}
	else if (args[1] == "warp") {
		let i = 0;
		if (args.length == 3 && args[2].match(/[0-9]/g)) {
			i = args[2];
		}
		if (db_warp.length - 1 >= i) {
			log(JSON.stringify(db_warp[i], null, 8));
			i++;
		}
		log("§6 Length : " + db_warp.length);
	}
	else if (args[1] == "display") {
		let i = 0;
		if (args.length == 3 && args[2].match(/[0-9]/g)) {
			i = args[2];
		}
		if (db_display.length - 1 >= i) {
			log(JSON.stringify(db_display[i], null, 8));
			i++;
		}
		log("§6 Length : " + db_display.length);
	}
	else if (args[1] == "chunk") {
		let i = 0;
		if (args.length == 3 && args[2].match(/[0-9]/g)) {
			i = parseInt(args[2]);
		}
		if (db_chunk.size - 1 >= i) {
			log(JSON.stringify(Array.from(db_chunk.values())[i], null, 8));
			i++;
		}
		log("§6 Length : " + db_chunk.size);
	}
	else if (args[1] == "read") {
		log(hexToText(getMap(/(?<=\$db_player\()[0-9a-f\s]+(?=\))/g).join("")));
	}
}

/**
 * +trade <playersName> <price>
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
/*function trade(args, data, ply) {
    if (args[args.length-1].match(/[0-9]/g)) {
        let name = "";
        for (let i = 1; i < args.length-1; i++) {
            name += args[i].replace(/[@"]/g, "") + " ";
        }
        name = name.trim();
        let player = db_player.find((p) => p.name.toLowerCase() == name.toLowerCase());
        if (player != undefined) {
            let money = parseInt(args[args.length-1]);
            let container = data.sender.getComponent("minecraft:inventory").container;
            let o = [];
            for (let i = 0; i < 36; i++) {
                o.push(container.getItem(i) ?? { id: "minecraft:air", amount: 0, data: 0, name: "air" })
            }
            o.forEach(o => {
                if(o.id != "minecraft:air") {
                    //log(JSON.stringify(o.getComponents,null,8));
                    o.getComponents().forEach(c => {
                        log(c.id);
                    })
                }
            })
        }
    }
}
A faire quand minecraft mettera a jour son api sur les comportements de l'item.
*/

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function setfactionhome(args, data, ply) {
    if (args.length == 1) {
        if (db_map.isFhome == true) {
            runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
            db_map.isFhome = false;
            runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
            tellraw(data.sender.name, translate(ply.lang).set_Fhome_off);
        }
        else {
            runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
            db_map.isFhome = true;
            runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
            tellraw(data.sender.name, translate(ply.lang).set_Fhome_on);
        }
    }
    else {
        let name = "";
        for (let i = 1; i < args.length; i++) {
            name += args[i].replace(/"/g, "")[0].toUpperCase() + args[i].replace(/"/g, "").substring(1).toLowerCase() + " ";
        }
        name = name.trim();
        //log(name);
        let fac = db_faction.get(name);
        if (fac != undefined) {
            if (fac.isFhome == true) {
                remove_to_update_faction(fac);
				fac.isFhome = false;
				add_to_update_faction(fac);
                tellraw(data.sender.name, translate(ply.lang).set_Fhome_off);
            }
            else {
                remove_to_update_faction(fac);
				fac.isFhome = true;
				add_to_update_faction(fac);
                tellraw(data.sender.name, translate(ply.lang).set_Fhome_on);
            }
        }
        else {
            tellraw(data.sender.name, translate(ply.lang).error_find_faction);
        }
    }
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function setutc(args, data, ply) {
    if (args.length == 2) {
        if (args[1].match(/[-+0-9]/)) {
            try {
                let nb = parseInt(args[1]);
                if (nb < 13 && nb > -13) {
                    runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
                    db_map.UTC = nb;
                    runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
                    tellraw(data.sender.name, translate(ply.lang).set_utc);
                }
                else {
                    tellraw(data.sender.name, translate(ply.lang).error_number);
                }
            }
            catch (er) {
                tellraw(data.sender.name, "§cError : " + er);
            }
        }
        else {
            tellraw(data.sender.name, translate(ply.lang).error_number);
        }
    }
    else {
        tellraw(data.sender.name, translate(ply.lang).error_arg);
    }
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function Amute(args, data, ply) {
    if (args.length >= 2) {
        let name = "";
        for (let i = 1; i < args.length; i++) {
            name += args[i].replace(/[@"]/g, "") + " ";
        }
        name = name.trim();
        let player = db_player.get(name)
        if (player != undefined) {
			remove_to_update_player(player);
            if (player.isMute) {
                player.isMute = false;
                tellraw(data.sender.name, translate(ply.lang, player.name).unmute);
            }
            else {
                player.isMute = true;
                tellraw(data.sender.name, translate(ply.lang, player.name).mute);
            }
			add_to_update_player(player);
        }
        else {
            tellraw(data.sender.name, translate(ply.lang).error_find_player);
        }
    }
    else {
        tellraw(data.sender.name, translate(ply.lang).error_arg);
    }
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function Ainventory(args, data, ply) {
    if (args.length >= 2) {
        let name = "";
        for (let i = 1; i < args.length; i++) {
            name += args[i].replace(/[@"]/g, "") + " ";
        }
        name = name.trim();
        const players = [...world.getPlayers()]
        let player = players.find((p) => p.name === name)
        if (player != undefined) {
            let container = player.getComponent("minecraft:inventory").container
            let o = []
            for (let i = 0; i < 36; i++) {
                o.push(container.getItem(i) ?? { typeId: "§ominecraft:air", amount: 0, data: 0 })
            }
            let message = `§l§e${player.name}'s HotBar :`;
            o.forEach(i => {
                if (o.indexOf(i) == 9) {
                    message += "\n§e§lInventory :"
                }
                message += `\n§r§aSlot ${o.indexOf(i) + 1}:§b ${i.typeId}§c x${i.amount}§r`
            })
            tellraw(data.sender.name, message);
        }
    }
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function Aunwarn(args, data, ply) {
    let name = "";
    for (let i = 1; i < args.length; i++) {
        name += args[i].replace(/[@"]/g, "") + " ";
    }
    name = name.trim();
	let player = db_player.get(name)
	if (player != undefined) {
		if (player.warn > 0) {
            remove_to_update_player(player);
			player.warn--;
            add_to_update_player(player);
			tellraw(data.sender.name, translate(ply.lang, player.name, player.warn).unwarn);
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_unwarn);
		}
    }
    else {
        tellraw(data.sender.name, translate(ply.lang).error_find_player);
    }
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function Awarn(args, data, ply) {
    let name = "";
    for (let i = 1; i < args.length; i++) {
        name += args[i].replace(/[@"]/g, "") + " ";
    }
    name = name.trim();
    let player = db_player.get(name)
    if (player != undefined) {
        remove_to_update_player(player);
        player.warn++;
        add_to_update_player(player);
        tellraw(data.sender.name, translate(ply.lang, player.name, player.warn).warn);
        tellraw(player.name, translate(ply.lang).warn_get);
    }
    else {
        tellraw(data.sender.name, translate(ply.lang).error_find_player);
    }
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function Ptpayes(args, data, ply) {
	if (!data.sender.hasTag(adminTag) && !ply.cmd_module.includes(cmd_module.all) && !ply.cmd_module.includes(cmd_module.tpa)) return tellraw(data.sender.name, "§cThis Module is disabled.");
	if (db_delay.has(ply.name)) if (!check_time(db_delay.get(ply.name))) return tellraw(ply.name, "§cYou have to wait " + (db_delay.get(ply.name).time - new Date().getTime()) / 1000 + " seconds before using this command.");
    if (args.length == 1) {
		if (data.sender.hasTag("tpCanceled") && !data.sender.hasTag(adminTag)) return tellraw(data.sender.name, "§cYou can't accept a teleportation request in this area.");
        let player = db_player.get(data.sender.name)
        if (player != undefined) {
            if (player.tpa.length != 0) {
                player.tpa.forEach(tp => {
                    let other = db_player.get(tp.name);
                    if (other != undefined) {
                        remove_to_update_player(player);
                        player.back.x = Math.ceil(data.sender.location.x + 0.0001) - 1;
                        player.back.y = Math.floor(data.sender.location.y + 0.4999);
                        player.back.z = Math.ceil(data.sender.location.z + 0.0001) - 1;
                        if (tp.type == "tpa") {
                            runCommand(`tp "${other.name}" "${player.name}"`);
							tpsound([...world.getPlayers()].find((p) => p.name === other.name));
                            player.tpa.splice(player.tpa.indexOf(tp), 1);
                        }
                        else if (tp.type == "tpahere") {
                            runCommand(`tp "${player.name}" "${other.name}"`);
							tpsound([...world.getPlayers()].find((p) => p.name === player.name));
                            player.tpa.splice(player.tpa.indexOf(tp), 1);
                        }
                        else {
                            log("§cError tpa");
                        }
                        add_to_update_player(player);
                    }
                })
            }
            else {
                tellraw(data.sender.name, translate(ply.lang).error_find_tpayes);
            }
        }
        else {
            tellraw(data.sender.name, translate(ply.lang).error_find_player);
        }
    }
    else {
        tellraw(data.sender.name, translate(ply.lang).error_arg);
    }
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function Ptpahere(args, data, ply) {
	if (!data.sender.hasTag(adminTag) && !ply.cmd_module.includes(cmd_module.all) && !ply.cmd_module.includes(cmd_module.tpa)) return tellraw(data.sender.name, "§cThis Module is disabled.");
	if (args.length >= 2) {
		let name = "";
		for (let i = 1; i < args.length; i++) {
			name += args[i].replace(/["@]/g, "") + " ";
		}
		name = name.trim();
		let player = db_player.get(name);
		if (player != undefined) {
			if (player.tpa.find((tp) => tp.name === data.sender.name) == undefined) {
				remove_to_update_player(player);
				player.tpa = [{name:data.sender.name, type:"tpahere", delay:db_map.tpaDelay}];
				add_to_update_player(player);
				tellraw(data.sender.name, translate(ply.lang, player.name).tpa_send);
				tellraw(player.name, translate(ply.lang, data.sender.name, prefix).tpahere_get)
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_tpa);
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_find_player);
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function Ptpa(args, data, ply) {
	if (!data.sender.hasTag(adminTag) && !ply.cmd_module.includes(cmd_module.all) && !ply.cmd_module.includes(cmd_module.tpa)) return tellraw(data.sender.name, "§cThis Module is disabled.");
	try {
		if (args.length >= 2) {
			let name = "";
			for (let i = 1; i < args.length; i++) {
				name += args[i].replace(/["@]/g, "") + " ";
			}
			name = name.trim();
			let player = db_player.get(name)
			if (player != undefined) {
				if (player.tpa.find((tp) => tp.name === data.sender.name) == undefined) {
					remove_to_update_player(player)
					player.tpa = [{ name: data.sender.name, type: "tpa", delay: db_map.tpaDelay }];
					add_to_update_player(player);
					tellraw(data.sender.name, translate(ply.lang, player.name).tpa_send);
					tellraw(player.name, translate(ply.lang, data.sender.name, prefix).tpa_get)
				}
				else {
					tellraw(data.sender.name, translate(ply.lang).error_tpa);
				}
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_find_player);
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_arg);
		}
	}
	catch (er) { log(er.toString) }
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function setcustomname(args, data, ply) {
	if (args.length == 1) {
		if (db_map.customName) {
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.customName = false;
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(data.sender.name, translate(ply.lang).set_customName_off);
		}
		else {
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.customName = true;
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(data.sender.name, translate(ply.lang).set_customName_on);
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * +shop add <sell|buy> <itemPrice> <itemLimit> <shopName>
 * +shop remove <sell|buy> <shopName>
 * +shop add <sell|buy> <runCommand> <shopName>
 * +shop add sell 25 *
 * +shop add buy 25 100
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function shop(args, data, ply) {
	if (args.length) {
		
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function Fenemy(args, data, ply) {
	if (args.length > 3) {
		if (args[2] == "add") {
			let fac = db_faction.get(ply.faction_name);
			if (fac != undefined && fac.playerList.find((p) => p.name === data.sender.name && p.permission == "Leader") == undefined) fac = undefined;
			if (fac != undefined) {
				let name = "";
				for (let i = 3; i < args.length; i++) {
					name += args[i].replace(/"/g, "")[0].toUpperCase() + args[i].replace(/"/g, "").substring(1).toLowerCase() + " ";
				}
				name = name.trim();
				if (fac.enemy.find((a) => a.name === name) == undefined && fac.ally.find((a) => a.name === name) == undefined) {
					let enemy = db_faction.get(name);
					if (enemy != undefined) {
						remove_to_update_faction(fac);
						fac.enemy.push({ name: name });
						add_to_update_faction(fac);
						tellraw(data.sender.name, translate(ply.lang, name).faction_add_enemy);
					}
					else {
						tellraw(data.sender.name, translate(ply.lang).error_find_faction);
					}
				}
				else {
					tellraw(data.sender.name, translate(ply.lang).error_set_relation);
				}
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_faction_leader_permission);
			}
		}
		else if (args[2] == "remove") {
			let fac = db_faction.get(ply.faction_name);
			if (fac != undefined && fac.playerList.find((p) => p.name === data.sender.name && p.permission == "Leader") == undefined) fac = undefined;
			if (fac != undefined) {
				let name = "";
				for (let i = 3; i < args.length; i++) {
					name += args[i].replace(/"/g, "")[0].toUpperCase() + args[i].replace(/"/g, "").substring(1).toLowerCase() + " ";
				}
				name = name.trim();
				let enemy = fac.enemy.find((a) => a.name === name);
				if (enemy != undefined) {
					if (enemy != undefined) {
						remove_to_update_faction(fac);
						fac.enemy.splice(fac.enemy.indexOf(enemy),1);
						add_to_update_faction(fac);
						tellraw(data.sender.name, translate(ply.lang, name).faction_remove_enemy);
					}
					else {
						tellraw(data.sender.name, translate(ply.lang).error_find_faction);
					}
				}
				else {
					tellraw(data.sender.name, translate(ply.lang).error_not_set_relation);
				}
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_faction_leader_permission);
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_arg_add_remove);
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns
*/
function Fally(args, data, ply) {
	if (args.length > 3) {
		if (args[2] == "add") {
			let fac = db_faction.get(ply.faction_name);
			if (fac != undefined && fac.playerList.find((p) => p.name === data.sender.name && p.permission == "Leader") == undefined) fac = undefined;
			if (fac != undefined) {
				let name = "";
				for (let i = 3; i < args.length; i++) {
					name += args[i].replace(/"/g, "")[0].toUpperCase() + args[i].replace(/"/g, "").substring(1).toLowerCase() + " ";
				}
				name = name.trim();
				if (fac.ally.find((a) => a.name === name) == undefined && fac.enemy.find((a) => a.name === name) == undefined) {
					let ally = db_faction.get(name);
					if (ally != undefined) {
						remove_to_update_faction(fac);
						fac.ally.push({ name: name });
						add_to_update_faction(fac);
						tellraw(data.sender.name, translate(ply.lang, name).faction_add_ally);
					}
					else {
						tellraw(data.sender.name, translate(ply.lang).error_find_faction);
					}
				}
				else {
					tellraw(data.sender.name, translate(ply.lang).error_set_relation);
				}
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_faction_leader_permission);
			}
		}
		else if (args[2] == "remove") {
			let fac = db_faction.get(ply.faction_name);
			if (fac != undefined && fac.playerList.find((p) => p.name === data.sender.name && p.permission == "Leader") == undefined) fac = undefined;
			if (fac != undefined) {
				let name = "";
				for (let i = 3; i < args.length; i++) {
					name += args[i].replace(/"/g, "")[0].toUpperCase() + args[i].replace(/"/g, "").substring(1).toLowerCase() + " ";
				}
				name = name.trim();
				let ally = fac.ally.find((a) => a.name === name);
				if (ally != undefined) {
					if (ally != undefined) {
						remove_to_update_faction(fac);
						fac.ally.splice(fac.ally.indexOf(ally),1);
						add_to_update_faction(fac);
						tellraw(data.sender.name, translate(ply.lang, name).faction_remove_ally);
					}
					else {
						tellraw(data.sender.name, translate(ply.lang).error_find_faction);
					}
				}
				else {
					tellraw(data.sender.name, translate(ply.lang).error_not_set_relation);
				}
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_faction_leader_permission);
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_arg_add_remove);
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
*/
function Fopen(args, data, ply) {
	if (args.length == 2) {
		let fac = db_faction.get(ply.faction_name);
			if (fac != undefined && fac.playerList.find((p) => p.name === data.sender.name && p.permission == "Leader") == undefined) fac = undefined;
		if (fac != undefined) {
			if (fac.isOpen == true) {
				remove_to_update_faction(fac);
				fac.isOpen = false;
				add_to_update_faction(fac);
				tellraw(data.sender.name, translate(ply.lang).Fopen_off);
			}
			else if (fac.isOpen == false) {
				remove_to_update_faction(fac);
				fac.isOpen = true;
				add_to_update_faction(fac);
				tellraw(data.sender.name, translate(ply.lang).Fopen_on);
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_find_faction);
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
*/
function Fdemote(args, data, ply) {
	if (args.length >= 3) {
		let fac = db_faction.get(ply.faction_name);
		if (fac != undefined && fac.playerList.find((p) => p.name === data.sender.name && (p.permission == "Leader" || p.permission == "Officer")) == undefined) fac = undefined;
		if (fac != undefined) {
			let name = "";
			for (let i = 2; i < args.length; i++) {
				name += args[i].replace(/[@"]/g, "") + " ";
			}
			name = name.trim();
			let player = fac.playerList.find((p) => p.name.toLowerCase() == name.toLowerCase());
			let promoter = fac.playerList.find((p) => p.name === data.sender.name);
			if (player != undefined) {
				if (player.permission == "Officer" && promoter.permission == "Leader") {
					remove_to_update_faction(fac);
					fac.playerList[fac.playerList.indexOf(player)].permission = "Member";
					add_to_update_faction(fac);
					tellraw(data.sender.name, translate(ply.lang, player.name).faction_demote_member);
					tellraw(db_player.get(player.name).name, translate(ply.lang).faction_demote_member_get);
				}
				else if (player.permission == "Member" && promoter.permission == "Leader") {
					remove_to_update_faction(fac);
					fac.playerList[fac.playerList.indexOf(player)].permission = "Visitor";
					add_to_update_faction(fac);
					tellraw(data.sender.name,translate(ply.lang, player.name).faction_demote_visitor);
					tellraw(db_player.get(player.name).name, translate(ply.lang).faction_demote_visitor_get);
				}
				else if (player.permission == "Visitor") {
					tellraw(data.sender.name, translate(ply.lang).error_demote_visitor);
				}
				else {
					tellraw(data.sender.name, translate(ply.lang).error_cant_do_that);
				}
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_find_player);
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_cant_do_that);
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
*/
function Fpromote(args, data, ply) {
	if (args.length >= 3) {
		let fac = db_faction.get(ply.faction_name);
		if (fac != undefined && fac.playerList.find((p) => p.name === data.sender.name && (p.permission == "Leader" || p.permission == "Officer")) == undefined) fac = undefined;
		if (fac != undefined) {
			let name = "";
			for (let i = 2; i < args.length; i++) {
				name += args[i].replace(/[@"]/g, "") + " ";
			}
			name = name.trim();
			let player = fac.playerList.find((p) => p.name.toLowerCase() == name.toLowerCase());
			let promoter = fac.playerList.find((p) => p.name === data.sender.name);
			if (player != undefined) {
				if (player.permission == "Officer" && promoter.permission == "Leader") {
					remove_to_update_faction(fac);
					fac.owner = player.name;
					fac.playerList[fac.playerList.indexOf(player)].permission = "Leader";
					fac.playerList[fac.playerList.indexOf(promoter)].permission = "Officer";
					add_to_update_faction(fac)
					fac.playerList.forEach((p) => {
						tellraw(db_player.get(p.name).name, translate(ply.lang, player.name).faction_new_leader);
					})
					tellraw(data.sender.name, translate(ply.lang).faction_new_leader_get);
				}
				else if (player.permission == "Member" && promoter.permission == "Leader") {
					remove_to_update_faction(fac);
					fac.playerList[fac.playerList.indexOf(player)].permission = "Officer";
					add_to_update_faction(fac);
					tellraw(data.sender.name, translate(ply.lang, player.name).faction_promote_co_leader);
					tellraw(db_player.get(player.name).name, translate(ply.lang).faction_promote_co_leader_get);
				}
				else if (player.permission == "Visitor") {
					remove_to_update_faction(fac);
					fac.playerList[fac.playerList.indexOf(player)].permission = "Member";
					add_to_update_faction(fac);
					tellraw(data.sender.name, translate(ply.lang, player.name).faction_promote_member);
					tellraw(db_player.get(player.name).name, translate(ply.lang).faction_promote_member_get);
				}
				else {
					tellraw(data.sender.name, translate(ply.lang).error_cant_do_that);
				}
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_find_player);
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_cant_do_that);
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
*/
function setprefix(args, data, ply) {
	if (args.length == 2) {
		if (!args[1].startsWith("/")) {
			if (!args[1].match(/[ "]/g)) {
				runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
				db_map.prefix = args[1];
				runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
				tellraw(data.sender.name, translate(ply.lang, args[1] ).set_prefix)
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_prefix);
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_prefix2);
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
*/
function Flist(args, data, ply) {
	if (args.length == 2) {
		let fac = db_faction.get(ply.faction_name);
		if (fac != undefined) {
			let message = "§eList of "+fac.playerList.length+" player(s) :"
			fac.playerList.forEach( p => {
				message += `\n  §e-§a${p.name}§e |role> ${p.permission}`;
			});
			tellraw(data.sender.name, message);
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_find_faction)
		}
	}
	else {
		let name = "";
		for (let i = 2; i < args.length; i++) {
			name += args[i].replace(/"/g, "")[0].toUpperCase() + args[i].replace(/"/g, "").substring(1).toLowerCase() + " ";
		}
		name = name.trim();
		let playerList = db_faction.get(name).playerList;
		if (playerList != undefined) {
			let message = "§eList of "+playerList.length+" player(s) :"
			playerList.forEach( p => {
				message += `\n  §e-§a${p.name} §e|role> ${p.permission}`;
			});
			tellraw(data.sender.name, message);
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_find_faction)
		}
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
*/
function Arole(args, data, ply) {
	if (args.length >= 4) {
		if (args[1] == "add") {
			let name = "";
			for (let i = 3; i < args.length; i++) {
				name += args[i].replace(/[@"]/g, "") + " ";
			}
			name = name.trim();
			let player = db_player.get(args[2].replace(/[@"]/g, ""));
			if (player != undefined) {
				runCommand(`tag "${player.name}" add role:${name}`);
				tellraw(data.sender.name, translate(ply.lang, name, args[2].replace(/"/g, "")).role_add);
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_find_player);
			}
		}
		else if (args[1] == "remove") {
			let name = "";
			for (let i = 3; i < args.length; i++) {
				name += args[i].replace(/[@"]/g, "") + " ";
			}
			name = name.trim();
			let player = db_player.get(args[2].replace(/[@"]/g, ""));
			if (player != undefined) {
				runCommand(`tag "${player.name}" remove role:${name}`);
				tellraw(data.sender.name, translate(ply.lang, name, args[2].replace(/"/g, "")).role_remove);
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_find_player);
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_arg_add_remove);
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
*/
function balance(args, data, ply) {
	if (!data.sender.hasTag(adminTag) && !ply.cmd_module.includes(cmd_module.all) && !ply.cmd_module.includes(cmd_module.money)) return tellraw(data.sender.name, "§cThis Module is disabled.");
	if (args.length == 1) {
		tellraw(data.sender.name, "§e" + db_player.get(data.sender.name).money);
	}
	else {
		let name = "";
		for (let i = 1; i < args.length; i++) {
			name += args[i].replace(/[@"]/g, "") + " ";
		}
		name = name.trim();
		let player = db_player.get(name);
		if (player != undefined) {
			tellraw(data.sender.name, "§e•> "+player.name+" : "+player.money);
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_find_player);
		}
	}
}

/**
 * 
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 */
function Pui_pay(args, data, ply) {
	if (!data.sender.hasTag(adminTag) && !ply.cmd_module.includes(cmd_module.all) && !ply.cmd_module.includes(cmd_module.money)) return tellraw(data.sender.name, "§cThis Module is disabled.");
	//ui style
	tellraw(data.sender.name, "§o§7you have 2 seconds to quit the chat and the form will appear.")
	if (args.length >= 1 && db_player.size > 1) {
		let money = ply.money;
		let pl = [...world.getPlayers()].find((p) => p.name === data.sender.name);
		if (money > 0) {
			system.runTimeout(async () => {
				new ActionFormData()
				.title("§r§6Select Pay Method§r")
				.button("§r§aOnline Player§r")
				.button("§r§aScearch Player§r")
				.button("§r§aEnter Player Name§r")
				.show(pl).then(async (res) => {
					if (res.canceled == true) return;
					if (res.selection == 0) {
						const players = [...world.getPlayers()].filter((p) => p.name !== ply.name).map((p) => p.name);
						if (players.length == 0) return tellraw(ply.name, "§cNo player online");
						new ModalFormData()
							.title("§r§6Select Player§r")
							.dropdown("§r§aPlayer List§r", players)
							.textField(`§r§aMoney to transfert (limit : ${ply.money})§r`, "1")
							.show(pl).then((res) => {
								if (res.canceled == true) return;
								let target = db_player.get(players[res.formValues[0]]);
								let money = res.formValues[1];
								pay(["pay", target.name, money + ""], { sender: pl }, ply);
							})
					}
					else if (res.selection == 1) {
						let target = await UI_find_player(pl);
						if (target == undefined) return;
						new ModalFormData()
							.title("§r§6Pay to " + target.name + "§r")
							.textField(`§r§aMoney to transfert (limit : ${ply.money})§r`, "1")
							.show(pl).then((res) => {
								if (res.canceled == true) return;
								let money = res.formValues[0];
								pay(["pay", target.name, money + ""], { sender: pl }, ply);
							})
					}
					else if (res.selection == 2) {
						new ModalFormData()
							.title("§r§6Pay§r")
							.textField(`§r§aPlayer Name§r`, "")
							.textField(`§r§aMoney to transfert (limit : ${ply.money})§r`, "1")
							.show(pl).then((res) => {
								if (res.canceled == true) return;
								let target = db_player.get(res.formValues[0]);
								let money = res.formValues[1];
								pay(["pay", target.name, money + ""], { sender: pl }, ply);
							})
					}
				})
			}, 18);
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_money)
		}
	}
	else {
		tellraw(data.sender.name, "§cnot enough player in the database");
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function pay(args, data, ply) {
	if (!data.sender.hasTag(adminTag) && !ply.cmd_module.includes(cmd_module.all) && !ply.cmd_module.includes(cmd_module.money)) return tellraw(data.sender.name, "§cThis Module is disabled.");
	//command style
	if (args[args.length - 1].match(/[0-9]/g)) {
		let name = "";
		for (let i = 1; i < args.length - 1; i++) {
			name += args[i].replace(/[@"]/g, "") + " ";
		}
		name = name.trim();
		let money = parseInt(args[args.length - 1])
		if (money > 0) {
			let sender = db_player.get(data.sender.name);
			if (sender != undefined) {
				let player = db_player.get(name);
				if (player != undefined) {
					if (sender.money >= money) {
						remove_to_update_player(player);
						remove_to_update_player(sender);
						sender.money -= money;
						player.money += money;
						add_to_update_player(player);
						add_to_update_player(sender);
						tellraw(data.sender.name, translate(ply.lang, money, player.name).pay);
						tellraw(player.name, translate(ply.lang, money, sender.name).pay_get);
					}
					else {
						tellraw(data.sender.name, translate(ply.lang).error_money);
					}
				}
				else {
					tellraw(data.sender.name, translate(ply.lang).error_find_player);
				}
			}
			else {
				tellraw(data.sender.name, "§cError you aren't in the database ??? it should be imposible");
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_number);
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * @param {Ply} ply 
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function help(args, data, ply) {
	const endl = `\n\n§7(UI) command can be use by quitting the chat after typing the command without argument\nif you want to know more about a command do §o"${prefix}help <CommandName>"§r\n§7${translate(ply.lang)?.credit_translate}`
	if (args.length == 1 && data.sender.hasTag(adminTag)) {
		return "§e§lBetter Faction §r§7(by Mister Art43) §ev" + version + ` :\n§aAdmin command§e\n§7>>§e ${prefix}claim §7(UI)\n§7>>§e ${prefix}module §7(UI)\n§7>>§e ${prefix}set §7(UI)\n§7>>§e ${prefix}sethomelimit\n§7>>§e ${prefix}setmemberlimit\n§7>>§e ${prefix}setscoremoney\n§7>>§e ${prefix}setrefreshtime §7(UI)\n§7>>§e ${prefix}setprefix\n§7>>§e ${prefix}setcustomname\n§7>>§e ${prefix}role\n§7>>§e ${prefix}warn\n§7>>§e ${prefix}unwarn\n§7>>§e ${prefix}inventory\n§7>>§e ${prefix}setchatprefix \n§7>>§e ${prefix}display §7(UI & command)\n§7>>§e ${prefix}admin\n§7>>§e ${prefix}lock\n\n§aCommon Command§e\n§7>>§e ${prefix}home\n§7>>§e ${prefix}sethome\n§7>>§e ${prefix}delhome\n§7>>§e ${prefix}listhome\n§7>>§e ${prefix}faction §7(UI & command)\n§7>>§e ${prefix}warp §7(UI & command)\n§7>>§e ${prefix}pay §7(UI & command)\n§7>>§e ${prefix}showChunk\n§7>>§e ${prefix}balance\n§7>>§e ${prefix}tpa\n§7>>§e ${prefix}tpahere\n§7>>§e ${prefix}tpayes` + endl;
	}
	if (args.length == 1) {
		return "§e§lBetter Faction §r§7(by Mister Art43) §ev" + version + ` :\n§7>>§e ${prefix}home\n§7>>§e ${prefix}sethome\n§7>>§e ${prefix}delhome\n§7>>§e ${prefix}listhome\n§7>>§e ${prefix}faction §7(UI & command)\n§7>>§e ${prefix}warp §7(UI & command)\n§7>>§e ${prefix}pay §7(UI & command)\n§7>>§e ${prefix}showChunk\n§7>>§e ${prefix}balance\n§7>>§e ${prefix}tpa\n§7>>§e ${prefix}tpahere\n§7>>§e ${prefix}tpayes` + endl;
	}
	else if (args.length == 2) {
		if (args[1] == "home" || args[1] == "h") {
			let Alias = "§e§lAlias : h, home";
			let command = `\n  §r§ecommand : "${prefix}home <homeName>"`;
			let example = `\n  example : "${prefix}h base"`;
			let explain = "\n  §6teleport the player to his home.";
			return Alias + command + example + explain;
		}
		if (args[1] == "sethome" || args[1] == "sh") {
			let Alias = "§e§lAlias : sh, sethome";
			let command = `\n  §r§ecommand : "${prefix}sethome <homeName>"`;
			let example = `\n  example : "${prefix}sh base"`;
			let explain = "\n  §6add a new home.";
			return Alias + command + example + explain;
		}
		if (args[1] == "listhome" || args[1] == "homelist" || args[1] == "lh") {
			if (data.sender.hasTag(adminTag)) {
				let Alias = "§e§lAlias : lh, listhome, homelist";
				let command = `\n  §r§ecommand : "${prefix}listhome"\n  §r§aAdmin §ecommand : "${prefix}listhome <playerName>"`;
				let example = `\n  example : "${prefix}listhome"`;
				let explain = "\n  §6show all home a player have.";
				return Alias + command + example + explain;
			}
			else {
				let Alias = "§e§lAlias : lh, listhome, homelist";
				let command = `\n  §r§ecommand : "${prefix}listhome"`;
				let example = `\n  example : "${prefix}listhome"`;
				let explain = "\n  §6show all home you have.";
				return Alias + command + example + explain;
			}
		}
		if (args[1] == "delhome" || args[1] == "dh") {
			if (data.sender.hasTag(adminTag)) {
				let Alias = "§e§lAlias : dh, delhome";
				let command = `\n  §r§ecommand : "${prefix}delhome base"\n  §r§aAdmin §ecommand : "${prefix}delhome "<playerName>" "<HomeName>""`;
				let example = `\n  example : "${prefix}listhome"`;
				let explain = "\n  §6delete the home of a player (/!\\ : <playerName> and <HomeName> need to be between quote)";
				return Alias + command + example + explain;
			}
			else {
				let Alias = "§e§lAlais : dh, delhome";
				let command = `\n  §r§ecommand : "${prefix}delhome <homeName>"`;
				let example = `\n  example : "${prefix}delhome base"`;
				let explain = "\n  §6delete a home you have.";
				return Alias + command + example + explain;
			}
		}
	}
	if (args[1] == "warp" || args[1] == "w") {
		if (args.length == 2) {
			let Alias = "§e§lAlias : w, warp";
			let command = `\n  §r§ecommand : "${prefix}warp <warpName>"`;
			let example = `\n  example : "${prefix}warp spawn"`;
			let explain = "\n  §6teleport you to a warp.";
			let other = `\n  §eOther command : "warp list".`;
			if (data.sender.hasTag(adminTag)) {
				other += `\n  §eOther Admin command : "warp add", "warp remove", "warp access", "warp message", "warp close".`;
			}
			return Alias + command + example + explain + other;
		}
		else if (args[2] == "list" || args[2] == "l") {
			let Alias = "§e§lAlias : l, list";
			let command = `\n  §r§ecommand : "${prefix}warp list"`;
			let example = `\n  example : "${prefix}warp l"`;
			let explain = "\n  §6show all warp you have access.";
			return Alias + command + example + explain;
		}
		else if (data.sender.hasTag(adminTag)) {

		}
	}
    if (args[1] == "faction" || args[1] == "f") {
        if (args.length == 2) {
            let Alias = "§e§lAlias : f, faction";
			let command = `\n  §r§ecommand : \n  "${prefix}faction create <FactionName>"\n  "${prefix}faction invite <PlayerName>"\n  "${prefix}faction kick <PlayerName>"\n  "${prefix}faction join <FactionName>"\n  "${prefix}faction info <FactionName>"\n  "${prefix}faction info\n  "${prefix}faction open"\n  "${prefix}faction promote <PlayerName>"\n  "${prefix}faction demote <PlayerName>\n  "${prefix}faction bank <add|remove> <number>"\n  "${prefix}faction <ally|enemy> <add|remove> <FactionName>"`;
			let example = ``;
			let explain = "\n  §6All faction command.";
            return Alias + command + example + explain;
        }
        else {
            if (args[2] == "info" || args[1] == "i") {
                let Alias = "§e§lAlias : i, info";
                let command = `\n  §r§ecommand : "${prefix}faction info"\n  §r§ecommand : "${prefix}faction info <factionName>"`;
                let example = `\n  example : "${prefix}f i"`;
                let explain = "\n  §6show info about your faction.";
                return Alias + command + example + explain;
            }
            else if (args[2] == "list" || args[1] == "l") {
                let Alias = "§e§lAlias : l, list";
                let command = `\n  §r§ecommand : "${prefix}faction list"\n  §r§ecommand : "${prefix}faction list <factionName>"`;
                let example = `\n  example : "${prefix}f l"`;
                let explain = "\n  §6list all player + permission inside the faction.";
                return Alias + command + example + explain;
            }
        }
    }
	return "§cUnknow Command";
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function setscoremoney(args, data, ply) {
	if (args.length >= 2) {
		let name = "";
		for (let i = 1; i < args.length; i++) {
			name += args[i].replace(/"/g, "") + " ";
		}
		name = name.trim();
		if (name != "") {
			runCommand(`scoreboard objectives add "${name}" dummy `);
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.scoreMoney = name;
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(data.sender.name, translate(ply.lang, name).set_scoreMoney);
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_name);
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function Fbank(args, data, ply) {
	if (args.length == 2) {
		let fac = db_faction.get(ply.faction_name);
		if (fac != undefined) {
			tellraw(data.sender.name, translate(ply.lang, fac.bank).faction_bank);
		}
	}
	else if (args.length == 4) {
		if (args[3].match(/[0-9]/g)) {
			let money = parseInt(args[3]);
			if (money > 0) {
				if (args[2] == "add") {
					let fac = db_faction.get(ply.faction_name);
					if (fac != undefined) {
                        let player = db_player.get(data.sender.name);
                        if (player != undefined) {
                            if (player.money >= money) {
                                remove_to_update_faction(fac);
                                remove_to_update_player(player);
                                player.money -= money;
                                fac.bank += money;
                                add_to_update_faction(fac);
                                add_to_update_player(player);
                                tellraw(data.sender.name, translate(ply.lang, money).faction_bank_add);
                            }
                            else {
                                tellraw(data.sender.name, translate(ply.lang).error_money);
                            }
                        }
                        else {
                            tellraw(data.sender.name, translate(ply.lang).error_find_player)
                        }
					}
					else {
						tellraw(data.sender.name, translate(ply.lang).error_no_faction);
					}
				}
				else if (args[2] == "remove") {
					let fac = db_faction.get(ply.faction_name);
					if (fac != undefined && fac.playerList.find((p) => p.name === data.sender.name && (p.permission == "Leader" || p.permission == "Officer")) == undefined) fac = undefined;
					if (fac != undefined) {
                        let player = db_player.get(data.sender.name);
                        if (player != undefined) {
                            if (fac.bank >= money) {
                                remove_to_update_faction(fac);
                                remove_to_update_player(player);
                                player.money += money;
                                fac.bank -= money;
                                add_to_update_faction(fac);
                                add_to_update_player(player);
                                tellraw(data.sender.name, translate(ply.lang, money).faction_bank_remove);
                            }
                            else {
                                tellraw(data.sender.name, translate(ply.lang).error_bank_money);
                            }
                        }
                        else {
                            tellraw(data.sender.name, translate(ply.lang).error_find_player)
                        }
					}
					else {
						tellraw(data.sender.name, translate(ply.lang).error_cant_do_that);
					}
				}
				else {
					tellraw(data.sender.name, translate(ply.lang).error_arg_add_remove);
				}
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_number);
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_number);
		}
	}
    else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function Fkick(args, data, ply) {
	if (args.length >= 3) {
		let name = "";
		for (let i = 2; i < args.length; i++) {
			name += args[i].replace(/[@"]/g, "") + " ";
		}
		name = name.trim();
		let fac = db_faction.get(ply.faction_name);
		if (fac != undefined && fac.playerList.find((p) => p.name === data.sender.name && (p.permission == "Leader" || p.permission == "Officer")) == undefined) fac = undefined;		if (fac != undefined) {
			let player = fac.playerList.find((p) => p.name.toLowerCase() == name.toLowerCase() && p.permission != "Leader");
			if (player != undefined) {
				remove_to_update_faction(fac);
				fac.playerList.splice(fac.playerList.indexOf(player),1);
				add_to_update_faction(fac);
				player = db_player.get(player.name);
				remove_to_update_player(player);
				player.faction_name = null;
				add_to_update_player(player);
				tellraw(data.sender.name, translate(ply.lang, name).faction_kick);
				tellraw(player.name, translate(ply.lang, fac.name).faction_kick_get);
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_faction_kick)
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_not_allow_command)
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function Fsethome(args, data, ply) {
	let fac = db_faction.get(ply.faction_name);
		if (fac != undefined && fac.playerList.find((p) => p.name === data.sender.name && p.permission == "Leader") == undefined) fac = undefined;
	if (fac != undefined) {
		if (fac.isFhome) {
			//log(getCurrentDimension(data.sender))
			if (getCurrentDimension(data.sender) == "minecraft:overworld") {
				remove_to_update_faction(fac);
				fac.x = Math.ceil(data.sender.location.x + 0.0001) - 1;
				fac.y = Math.ceil(data.sender.location.y - 0.4999);
				fac.z = Math.ceil(data.sender.location.z + 0.0001) - 1;
				add_to_update_faction(fac);
				tellraw(data.sender.name, translate(ply.lang, fac.x, fac.y, fac.z).faction_home);
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_faction_home)
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_faction_home_off);
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_cant_do_that);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function setmemberlimit(args, data, ply) {
	if (args[args.length - 1].match(/^([0-9]{1,})$/)) {
		let nb = parseInt(args[args.length - 1]);
		if (args.length == 2) {
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.factionMemberLimit = nb;
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(data.sender.name, translate(ply.lang, nb).set_memberlimit_g);
		}
		else {
			let Fname = "";
			for (let i = 1; i < args.length - 1; i++) {
				Fname += args[i].replace(/"/g, "")[0].toUpperCase() + args[i].replace(/"/g, "").substring(1).toLowerCase() + " ";
			}
			Fname = Fname.trim();
			let fac = db_faction.get(Fname);
			if (fac != undefined) {
				remove_to_update_faction(fac);
				fac.memberLimit = nb;
				add_to_update_faction(fac);
				tellraw(data.sender.name, translate(ply.lang, Fname, nb).set_memberlimit_l);
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_find_faction);
			}
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_number);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function Wmessage(args, data, ply) {
	if (args.length == 4) {
		let warp = db_warp.find((w) => w.name.toLowerCase() == args[2].replace(/"/g, "").toLowerCase());
		if (warp != undefined) {
			remove_warp(warp);
			warp.message = args[3].replace(/"/g, "");
			add_warp(warp);
			tellraw(data.sender.name, translate(ply.lang, args[3].replace(/"/g,"")).warp_msg_add);
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_find_warp);
		}
	}
	else if (args.length == 3) {
		let warp = db_warp.find((w) => w.name.toLowerCase() == args[2].replace(/"/g, "").toLowerCase());
		if (warp != undefined) {
			remove_warp(warp);
			if (warp.displayMessageOnTp == true) {
				warp.displayMessageOnTp = false;
				tellraw(data.sender.name, translate(ply.lang).warp_msg_off);
			}
			else {
				warp.displayMessageOnTp = true;
				tellraw(data.sender.name, translate(ply.lang).warp_msg_on);
			}
			add_warp(warp);
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_find_warp);
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * w close <name>
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function Wclose(args, data, ply) {
	let name = "";
	for (let i = 2; i < args.length; i++) {
		name += args[i].replace(/"/g, "") + " ";
	}
	name = name.trim();
	let warp = db_warp.find((w) => w.name.toLowerCase() == name.toLowerCase());
	if (warp != undefined) {
		remove_warp(warp);
		if (warp.isOpen) {
			warp.isOpen = false;
			tellraw(data.sender.name, translate(ply.lang, warp.name).warp_close);
		}
		else {
			warp.isOpen = true;
			tellraw(data.sender.name, translate(ply.lang, warp.name).warp_open);
		}
		add_warp(warp)
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_find_warp);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
*/
function WrunCommand(args, data, ply) {
	if (args.length == 4) {
		let warp = db_warp.find((w) => w.name.toLowerCase() == args[3].replace(/"/g, ""));
		if (warp != undefined) {
			if (args[2] == "clear") {
				if (warp.runCommandAsync.length != 0) {
					remove_warp(warp);
					warp.runCommandAsync.splice(0);
					add_warp(warp);
					tellraw(data.sender.name, translate(ply.lang).warp_cmd_clear);
				}
				else {
					tellraw(data.sender.name, translate(ply.lang).error_warp_cmd);
				}
			}
			else if (args[2] == "list") {
				if (warp.runCommandAsync.length != 0) {
					let message = "§eList of commands :";
					warp.runCommandAsync.forEach(cmd => {
						message += "\n    " + cmd.cmd;
					})
					tellraw(data.sender.name, message);
				}
				else {
					tellraw(data.sender.name, translate(ply.lang).error_warp_cmd);
				}
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_arg);
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_find_warp);
		}
	}
	else if (args.length == 5) {
		let warp = db_warp.find((w) => w.name.toLowerCase() == args[3].replace(/"/g, ""));
		if (warp != undefined) {
			if (args[2] == "add") {
				if (warp.runCommandAsync.find((c) => c.cmd.replace(/"/g, "") == args[4].replace(/"/g, "")) == undefined) {
					let cmd = args[4];
					if (cmd.startsWith("\"")) {
						cmd = cmd.substring(1).substring(0, cmd.length - 2);
						//log(cmd);
					}
					remove_warp(warp);
					warp.runCommandAsync.push({ cmd: cmd });
					add_warp(warp);
					tellraw(data.sender.name, "command added with success");
				}
				else {
					tellraw(data.sender.name, translate(ply.lang).error_have_warp_cmd)
				}
			}
			else if (args[2] == "remove") {
				let cmd = warp.runCommandAsync.find((c) => c.cmd == args[4].replace(/"/g, ""));
				if (cmd != undefined) {
					remove_warp(warp);
					warp.runCommandAsync.splice(warp.runCommandAsync.indexOf(cmd), 1);
					add_warp(warp);
					tellraw(data.sender.name, "command removed with success");
				}
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_arg_warp_cmd)
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_find_warp)
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * w delay test 10
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
*/
function Wdelay(args, data, ply) {
	if (args.length >= 4) {
		let name = "";
		for (let i = 2; i < args.length - 1; i++) {
			name += args[i].replace(/"/g, "") + " ";
		}
		name = name.trim();
		let warp = db_warp.find((w) => w.name.toLowerCase() == name.toLowerCase());
		if (warp != undefined) {
			if (args[args.length - 1].match(/[0-9]/g)) {
				remove_warp(warp);
				warp.delay = args[args.length - 1];
				add_warp(warp)
				tellraw(data.sender.name, "warp delay edited");
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_number);
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_find_warp);
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * +warp add spawn
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @param {Ply} ply
 * @returns 
*/
function Wwarp(args, data, ply) {
	if (db_delay.has(ply.name)) if (!check_time(db_delay.get(ply.name))) return tellraw(ply.name, "§cYou have to wait " + (db_delay.get(ply.name).time - new Date().getTime()) / 1000 + " seconds before using this command.");
	if (data.sender.hasTag("tpCanceled") && !data.sender.hasTag(adminTag)) return tellraw(data.sender.name, "§cYou can't accept a teleportation request in this area.");
	let name = "";
	for (let i = 1; i < args.length; i++) {
		name += args[i].replace(/"/g, "") + " ";
	}
	name = name.trim();
	let warp = db_warp.find((w) => w.name.toLowerCase() == name.toLowerCase());
	if (warp != undefined) {
		if (warp.isOpen == true || data.sender.hasTag(adminTag)) {
			if (warp.deny.length != 0 && !data.sender.hasTag(adminTag)) {
				for (let i = 0; i < warp.deny.length; i++) {
					//runCommand("say " + i)
					if (data.sender.hasTag(warp.deny[i].tag)) {
						tellraw(data.sender.name, "§cyoure are not allowed to use this warp")
						return;
					}
				}
			}
			if (warp.allow.length == 0) {
				let logs = warp.log.find((l) => l.name === data.sender.name);
				if (logs == undefined) {
					if (warp.displayMessageOnTp == true) {
						tellraw(data.sender.name, warp.message);
					}
					if (warp.runCommandAsync.length != 0) {
						warp.runCommandAsync.forEach(cmd => {
							try {
								data.sender.runCommandAsync(cmd.cmd.replaceAll(/\//g, ""));
							}
							catch (er) {
								log("§cWarp cmd Error -> " + warp.name + " : §r" + er.toString());
							}
						})
					}
					remove_warp(warp);
					warp.log.push({ name: data.sender.name, delay: warp.delay });
					add_warp(warp);
					let player = db_player.get(data.sender.name);
					if (player != undefined) {
						remove_to_update_player(player);
						player.back.x = Math.ceil(data.sender.location.x + 0.0001) - 1;
						player.back.y = Math.floor(data.sender.location.y + 0.4999);
						player.back.z = Math.ceil(data.sender.location.z + 0.0001) - 1;
						add_to_update_player(player);
					}
					runCommandDim(`tp \"${data.sender.name}\" ${warp.x} ${warp.y} ${warp.z}`, warp.dimension);
					tpsound([...world.getPlayers()].find((p) => p.name === data.sender.name));
				}
				else {
					tellraw(data.sender.name, translate(ply.lang, logs.delay).error_warp);
				}
			}
			else {
				for (let i = 0; i < warp.allow.length; i++) {
					if (data.sender.hasTag(warp.allow[i].tag) || data.sender.hasTag(adminTag)) {
						let logs = warp.log.find((l) => l.name === data.sender.name);
						if (logs == undefined) {
							if (warp.displayMessageOnTp == true) {
								tellraw(data.sender.name, warp.message);
							}
							if (warp.runCommandAsync.length != 0) {
								warp.runCommandAsync.forEach(cmd => {
									try {
										data.sender.runCommandAsync(cmd.cmd.replaceAll(/\//g, ""));
									}
									catch (er) {
										log("§cWarp cmd Error -> " + warp.name + " : §r" + er.toString());
									}
								})
							}
							remove_warp(warp);
							warp.log.push({ name: data.sender.name, delay: warp.delay });
							add_warp(warp);
							let player = db_player.get(data.sender.name);
							if (player != undefined) {
								remove_to_update_player(player);
								player.back.x = Math.ceil(data.sender.location.x + 0.0001) - 1;
								player.back.y = Math.floor(data.sender.location.y + 0.4999);
								player.back.z = Math.ceil(data.sender.location.z + 0.0001) - 1;
								add_to_update_player(player);
							}
							runCommandDim(`tp \"${data.sender.name}\" ${warp.x} ${warp.y} ${warp.z}`, warp.dimension);
							tpsound([...world.getPlayers()].find((p) => p.name === data.sender.name));
						}
						else {
							tellraw(data.sender.name, translate(ply.lang, logs.delay).error_warp);
						}
						return;
					}
					else if (i == warp.allow.length - 1) {
						tellraw(data.sender.name, "you are not allowed to use this warp")
					}
				}
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_warp_close);
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_find_warp);
	}
}

/**
 * +warp access add allow WarpName myTag
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function Waccess(args, data, ply) {
	if (args[2] == "list") {
		let name = "";
		for (let i = 3; i < args.length; i++) {
			name += args[i].replace(/"/g, "") + " ";
		}
		name = name.trim();
		let warp = db_warp.find((w) => w.name.toLowerCase() == name.toLowerCase());
		if (warp != undefined) {
			let message = "§eList of warp Access :\n Allow :";
			if (warp.allow.length != 0) {
				warp.allow.forEach(tag => {
					message += "§r\n  §e-" + tag.tag;
				})
			}
			else {
				message += "\n§cNo Allow";
			}
			message += "\n\n§e Deny :";
			if (warp.deny.length != 0) {
				warp.deny.forEach(tag => {
					message += "§r\n  §e-" + tag.tag;
				})
			}
			else {
				message += "\n§cNo Deny";
			}
			tellraw(data.sender.name, message);
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_find_warp);
		}
	}
	else if (args.length > 5) {
		let name = "";
		for (let i = 4; i < args.length - 1; i++) {
			name += args[i].replace(/"/g, "") + " ";
		}
		name = name.trim();
		let warp = db_warp.find((w) => w.name.toLowerCase() == name.toLowerCase());
		if (warp != undefined) {
			if (args[2] == "add") {
				if (args[3] == "allow") {
					remove_warp(warp);
					warp.allow.push({tag:args[args.length - 1].replace(/"/g, "")});
					add_warp(warp);
					tellraw(data.sender.name, `§e•> Warp Access :\n you just ${args[2]} access to "${name}" \n| tag : "${args[args.length - 1].replace(/"/g, "")}"\n| mode : ${args[3]}`);
				}
				else if (args[3] == "deny") {
					remove_warp(warp);
					warp.deny.push({tag:args[args.length - 1].replace(/"/g, "")});
					add_warp(warp);
					tellraw(data.sender.name, `§e•> Warp Access :\n you just ${args[2]} access to "${name}" \n| tag : "${args[args.length - 1].replace(/"/g, "")}"\n| mode : ${args[3]}`);
				}
				else {
					tellraw(data.sender.name, "§cWrong Argument (should be allow | deny).");
				}
			}
			else if (args[2] == "remove") {
				if (args[3] == "allow") {
					if (warp.allow.find((w) => w.tag == args[args.length-1].replace(/"/g, "")) != undefined) {
						remove_warp(warp);
						warp.allow.splice(warp.allow.indexOf(warp.allow.find((w) => w.tag == args[args.length-1].replace(/"/g, ""))),1);
						add_warp(warp);
						tellraw(data.sender.name, `§e•> Warp Access :\n you just ${args[2]} access to "${name}" \n| tag : "${args[args.length - 1].replace(/"/g, "")}"\n| mode : ${args[3]}`);
					}
					else {
						tellraw(data.sender.name, `§c"${args[args.length-1].replace(/"/g, "")}" tag is not on ${name} warp`)
					}
				}
				else if (args[3] == "deny") {
					if (warp.deny.find((w) => w.tag == args[args.length-1].replace(/"/g, "")) != undefined) {
						remove_warp(warp);
						warp.deny.splice(warp.deny.indexOf(warp.deny.find((w) => w.tag == args[args.length-1].replace(/"/g, ""))),1);
						add_warp(warp);
						tellraw(data.sender.name, `§e•> Warp Access :\n you just ${args[2]} access to "${name}" \n| tag : "${args[args.length - 1].replace(/"/g, "")}"\n| mode : ${args[3]}`);
					}
					else {
						tellraw(data.sender.name, `§c"${args[args.length-1].replace(/"/g, "")}" tag is not on ${name} warp.`)
					}
				}
				else {
					tellraw(data.sender.name, "§cWrong Argument (should be allow | deny).");
				}
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_arg_add_remove);
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_find_warp);
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}



/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function Wlist(args, data, ply) {
	let msg = "List of Warp :"
	for (const warp of db_warp) {
		if (warp.deny.length == 0) {
			if (warp.allow.length == 0) {
				msg += `\n -${warp.name}`;
			}
			else {
				for (let i = 0; i < warp.allow.length; i++) {
					if (data.sender.hasTag(warp.allow[i].tag)) {
						msg += `\n -${warp.name}`;
						break;
					}
				}
			}
		}
		else {
			for (let i = 0; i < warp.deny.length; i++) {
				if (data.sender.hasTag(warp.deny[i].tag)) {
 					break;
				}
				else if (i == warp.deny.length) {
					msg += `\n -${warp.name}`;	
					//break; useless...
				}
			}
		}
	}
	if (msg != "List of Warp :") {
		tellraw(data.sender.name, msg);
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).warp_list_empty);
	}
}

/**
 * +warp remove <WarpName>
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function Wremove(args, data, ply) {
	if (args.length > 2) {
		let name = "";
		for (let i = 2; i < args.length; i++) {
			name += args[i].replace(/"/g, "") + " ";
		}
		name = name.trim();
		let warp = db_warp.find((w) => w.name.toLowerCase() == name.toLowerCase());
		if (warp != undefined) {
            remove_warp(warp);
			tellraw(data.sender.name, translate(ply.lang, name).warp_remove);
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_find_warp);
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function Wadd(args, data, ply) {
	if (args.length > 2) {
		let name = "";
		for (let i = 2; i < args.length; i++) {
			name += args[i].replace(/"/g, "") + " ";
		}
		name = name.trim();
		if (name.match(/^([0-9a-zA-Z ]){1,20}$/)) {
			if (db_warp.find((w) => w.name.toLowerCase() == name.toLowerCase()) == undefined) {
				let warp = newwarp(name, data.sender);
                add_warp(warp);
				tellraw(data.sender.name, translate(ply.lang, name, warp.x, warp.y, warp.z).warp_add);
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_have_name);
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_name)
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * @param {string} Wname 
 * @param {Player} player 
 * @returns 
 */
function newwarp(Wname, player) {
    return {
        name: Wname,
        message: "",
        displayMessageOnTp: false,
        creator: player.name,
        allow: [],
        deny: [],
        isOpen: true,
        x: Math.ceil(player.location.x + 0.0001) - 1,
        y: Math.ceil(player.location.y - 0.4999),
        z: Math.ceil(player.location.z + 0.0001) - 1,
        dimension: getCurrentDimension(player),
        delay:db_map.warpDelay,
        runCommandAsync:[],
        log:[]
    }
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
async function Fjoin(args, data, ply) {
	let name = "";
	for (let i = 2; i < args.length; i++) {
		name += args[i].replace(/"/g, "")[0].toUpperCase() + args[i].replace(/"/g, "").substring(1).toLowerCase() + " ";
	}
	name = name.trim();
    if (db_faction.has(ply.faction_name) == false) {
		log(name.toString())
        let fac = db_faction.get(name);
        if (fac != undefined) {
			let i = 0;
            if (fac.isOpen == true) {
                if (fac.playerList.length < fac.memberLimit) {
					for (const afac of db_faction.values()) {
						if (afac.invitList.find((p) => p.name === data.sender.name)) {
							remove_to_update_faction(afac)
                            afac.invitList.splice(afac.invitList.indexOf(afac.invitList.find((p) => p.name === data.sender.name)), 1)
							add_to_update_faction(afac);
                        }
						if (i % 7 === 0) await sleep(1);
						i++;
                    }
					remove_to_update_faction(fac);
                    fac.playerList.push({ name: data.sender.name, permission: "Visitor" });
                    add_to_update_faction(fac);
					remove_to_update_player(ply);
					ply.faction_name = fac.name;
					add_to_update_player(ply);
                    for (const p of fac.playerList) {
                        tellraw(db_player.get(p.name).name, translate(ply.lang, data.sender.name).faction_join);
                    }
                }
                else {
                    tellraw(data.sender.name, translate(ply.lang).error_faction_join_full)
                }
            }
            else {
                let invit = fac.invitList.find((p) => p.name === data.sender.name);
                if (invit != undefined) {
                    if (fac.playerList.length < fac.memberLimit) {
						for (const afac of db_faction.values()) {
							if (afac.invitList.find((p) => p.name === data.sender.name)) {
								remove_to_update_faction(afac)
                                afac.invitList.splice(afac.invitList.indexOf(afac.invitList.find((p) => p.name === data.sender.name)), 1)
								add_to_update_faction(afac);
                            }
							if (i % 7 === 0) await sleep(1);
							i++;
                        }
						remove_to_update_faction(fac);
                        fac.playerList.push({ name: data.sender.name, permission: "Visitor" });
						add_to_update_faction(fac);
						remove_to_update_player(ply);
						ply.faction_name = fac.name;
						add_to_update_player(ply);
                        for (const p of fac.playerList) {
                            tellraw(db_player.get(p.name).name, translate(ply.lang, data.sender.name).faction_join);
                        }
                    }
                    else {
                        tellraw(data.sender.name, translate(ply.lang).error_faction_join_full)
                    }
                }
                else {
                    tellraw(data.sender.name, translate(ply.lang).error_faction_join_invit);
                }
            }
        }
        else {
            tellraw(data.sender.name, translate(ply.lang).error_find_faction);
        }
    }
    else {
        tellraw(data.sender.name, translate(ply.lang).error_have_faction2)
    }
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function Finfo(args, data, ply) {
	if (args.length == 2) {
		let fac = db_faction.get(ply.faction_name);
		if (fac == undefined) {
			tellraw(data.sender.name, translate(ply.lang).error_faction_info);
		}
		else {
			tellraw(data.sender.name, translate(ply.lang, fac.name, fac.description, fac.date2.day+"/"+(fac.date2.month+"/"+fac.date2.year+" : "+addDateZ(fac.date2.hour)+"h"+addDateZ(fac.date2.minute)), fac.playerList.length, fac.memberLimit, fac.bank, fac.power).faction_info);
		}
	}
	else {
		let name = "";
		for (let i = 2; i < args.length; i++) {
			name += args[i].replace(/"/g, "")[0].toUpperCase() + args[i].replace(/"/g, "").substring(1).toLowerCase() + " ";
		}
		name = name.trim();
		let fac = db_faction.get(name);
		if (fac == undefined) {
			tellraw(data.sender.name, translate(ply.lang).error_faction_info);
		}
		else {
			tellraw(data.sender.name, translate(ply.lang, fac.name, fac.description, fac.date2.day+"/"+(fac.date2.month+"/"+fac.date2.year+" : "+addDateZ(fac.date2.hour)+"h"+addDateZ(fac.date2.minute)), fac.playerList.length, fac.memberLimit, fac.bank, fac.power).faction_info);
		}
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function Finvit(args, data, ply) {
	if (args[2] == "clear") {
		let fac = db_faction.get(ply.faction_name);
		if (fac != undefined && fac.playerList.find((p) => p.name === data.sender.name && (p.permission == "Leader" || p.permission == "Officer")) == undefined) fac = undefined;
		if (fac != undefined) {
			remove_to_update_faction(fac);
			fac.invitList.splice(0,fac.invitList.length);
			add_to_update_faction(fac)
			tellraw(data.sender.name, translate(ply.lang).faction_invit_clear);
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_cant_do_that);
		}
	}
	else if (args[2] == "list") {
		let fac = db_faction.get(ply.faction_name);
		if (fac != undefined && fac.playerList.find((p) => p.name === data.sender.name && (p.permission == "Leader" || p.permission == "Officer")) == undefined) fac = undefined;
		if (fac != undefined) {
			let message = "§eInvited players :§r";
			for (const p of fac.invitList) {
				message += "\n -"+p.name;
			}
			if (message == "§eInvited players :§r") {
				tellraw(data.sender.name, translate(ply.lang).error_list_invit); return;
			}
			tellraw(data.sender.name, message);
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_cant_do_that);
		}
	}
	else {
		let name = "";
		for (let i = 2; i < args.length; i++) {
			name += args[i].replace(/"/g, "").replace(/@/g, "") + " ";
		}
		name = name.trim();
		let fac = db_faction.get(ply.faction_name);
		if (fac != undefined && fac.playerList.find((p) => p.name === data.sender.name && (p.permission == "Leader" || p.permission == "Officer")) == undefined) fac = undefined;
		if (fac != undefined) {
			if (db_faction.get(db_player.get(name).faction_name) == undefined) {
				if (fac.invitList.find((p) => p.name === name) == undefined) {
					remove_to_update_faction(fac)
					fac.invitList.push({ name: name });
					add_to_update_faction(fac);
					tellraw(data.sender.name, translate(ply.lang, name).faction_invit);
					let player = db_player.get(name);
					if (player != undefined){
						tellraw(player.name, translate(ply.lang, fac.name).faction_invit_get);
					}
				}
				else {
					tellraw(data.sender.name, translate(ply.lang).error_have_invit);
				}
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_have_faction);
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_cant_do_that);
		}
	}
}

/**
 * Quits the faction.
 * @param {string[]} args - The arguments passed to the command.
 * @param {ChatSendAfterEvent} data - The data of the chat event.
 * @param {Ply} ply - The player executing the command.
 * @returns {Promise<void>} A promise resolved after the command execution.
 */
async function Fquit(args, data, ply) {
	const fac = db_faction.get(ply.faction_name);
	if (fac) {
		if (fac.playerList.find(p => p.name === ply.name && p.permission === "Leader")) {
			log(`§e${ply.name}§r has disbanded the faction §e${fac.name}§r.`);
			let i = 1;
			for (const [key, faction] of db_faction) {
				const allyIndex = faction.ally.findIndex(a => a.name === fac.name);
				if (allyIndex !== -1) {
					remove_to_update_faction(faction);
					faction.ally.splice(allyIndex, 1);
					add_to_update_faction(faction);
				}

				const enemyIndex = faction.enemy.findIndex(e => e.name === fac.name);
				if (enemyIndex !== -1) {
					remove_to_update_faction(faction);
					faction.enemy.splice(enemyIndex, 1);
					add_to_update_faction(faction);
				}

				if (i % 6 === 0) await sleep(1);
				i++;
			}

			fac.playerList.forEach(p => {
				const pl = db_player.get(p.name);
				remove_to_update_player(pl);
				pl.faction_name = null;
				add_to_update_player(pl);
			});

			fac.claim.forEach((c) => {
				let chunk = db_chunk.get(c.x + "," + c.z + Server.id);
				if (chunk !== undefined) remove_chunk(chunk);
			});

			remove_faction(fac);
		} else {
			remove_to_update_player(ply);
			ply.faction_name = null;
			add_to_update_player(ply);
			remove_to_update_faction(fac);
			fac.playerList.splice(fac.playerList.findIndex(p => p.name === ply.name), 1);
			add_to_update_faction(fac);

			fac.playerList.forEach(p => {
				tellraw(p.name, translate(ply.lang, ply.name).faction_quit);
			});
		}

		tellraw(ply.name, translate(ply.lang, fac.name).faction_quit_get);
	} else {
		tellraw(ply.name, translate(ply.lang).error_find_faction);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function Fcreate(args, data, ply) {
	if (args.length >= 3) {
		let Fname = "";
		for (let i = 2; i < args.length; i++) {
			Fname += args[i].replace(/"/g, "")[0].toUpperCase() + args[i].replace(/"/g, "").substring(1).toLowerCase() + " ";
		}
		Fname = Fname.trim();
		if (Fname.match(/^([0-9a-zA-Z ]){1,40}$/) && Fname != "Admin") {//nom des claims Admin
			if (ply.faction_name != null) return tellraw(data.sender.name, translate(ply.lang).error_faction_create);
			if (db_faction.has(Fname)) return tellraw(data.sender.name, translate(ply.lang).error_have_name);
			let FacObject = new faction(Fname, data.sender.name);
			if (getCurrentDimension(data.sender) == "minecraft:overworld") {
				FacObject.x = Math.ceil(data.sender.location.x + 0.0001) - 1;
				FacObject.y = Math.ceil(data.sender.location.y - 0.4999);
				FacObject.z = Math.ceil(data.sender.location.z + 0.0001) - 1;
			}
			add_faction(FacObject);
			remove_to_update_player(ply);
			ply.faction_name = FacObject.name;
			add_to_update_player(ply);
			tellraw(data.sender.name, translate(ply.lang, Fname).faction_create);
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_name)
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

class faction_member {
	/**
	 * @param {string} name 
	 * @param {string} permission 
	 */
	constructor(name, permission) {
		this.name = name;
		this.permission = permission;
	}
}

class faction {
	/**
	 * @param {string} Fname 
	 * @param {string} plName 
	 */
	constructor(Fname, plName) {
		this.name = Fname;
		this.description = "";
		this.color = "§6";
		this.separator = db_map.factionSeparator;
		this.date2 = new custom_date(new Date());
		this.owner = plName;
		this.bank = 0;
		this.power = 5;
		this.ally = new Array();
		this.enemy = new Array();
		this.invitList = new Array();
		this.playerList = [new faction_member(plName, "Leader")];
		this.memberLimit = db_map.factionMemberLimit;
		this.isFhome = db_map.isFhome;
		this.x = null;
		this.y = null;
		this.z = null;
		this.isOpen = false;
		/** @type {Vector2[]} */
		this.claim = new Array();
	}
}

class delay {
	/**
	 * @param {string} name 
	 * @param {number} seconds 
	 */
	constructor(name, seconds) {
		if (seconds === 0) return;
		if (db_delay.has(name)) remove_delay(this);
		this.name = name;
		this.time = seconds * 1000 + new Date().getTime();
		add_delay(this);
		tellraw(name, "§cYou can't teleport for " + seconds + " seconds");
	}
}

class ChunkPermission {
	/**
	 * @param {boolean} canBreak
	 * @param {boolean} canPlace
	 * @param {boolean} canInteract
	 * @returns {chunkPermission}
	*/
	constructor(canBreak, canPlace, canInteract) {
		/** @type {boolean} */
		this.canBreak = canBreak;
		/** @type {boolean} */
		this.canPlace = canPlace;
		/** @type {boolean} */
		this.canInteract = canInteract;
	}
}

const factionRank = {
	"Leader": 0,
	"Officer": 1,
	"Member": 2,
	"Visitor": 3
}

class ChunkRankPermission {
	/**
	 * @param {number} rank 
	 * @param {ChunkPermission} permission 
	 * @returns {ChunkRankPermission}
	 */
	constructor(rank, permission) {
		/** @type {number} */
		this.rank = rank;
		/** @type {ChunkPermission} */
		this.permission = permission;
		return this;
	}
}

class ChunkPlayerPermission {
	/**
	 * @param {string} name
	 * @param {ChunkPermission} permission
	 * @returns {ChunkPlayerPermission}
	 */
	constructor(name, permission) {
		/** @type {string} */
		this.name = name;
		/** @type {ChunkPermission} */
		this.permission = permission;
		return this;
	}
}

class Chunk {
	/**
	 * @param {number} xChunk 
	 * @param {number} zChunk 
	 * @param {string} owner 
	 * @param {custom_date} date 
	 * @param {string} faction 
	 * @param {string} dimensionID
	 * @param {string} group
	 * @returns {chunk}
	 */
	constructor(xChunk, zChunk, owner, date, faction, dimensionID, group) {
		if (db_chunk.get(xChunk + "," + zChunk + dimensionID) !== undefined) return log("chunk already exist\n constructor chunk");
		/** @type {number} */
		this.x = xChunk;
		/** @type {number} */
		this.z = zChunk;
		/** @type {string} */
		this.owner = owner;
		/** @type {string} */
		this.faction_name = faction;
		/** @type {custom_date} */
		this.date = date;

		/** @type {ChunkPermission} */
		this.defaultPermission = new ChunkPermission(false, false, false);
		/** @type {ChunkPlayerPermission[]} */
		this.permission = new Array();
		if (faction !== "Admin") {
			/** @type {ChunkRankPermission[]} */
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
}

// world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
// 	log("playerInteractWithBlock");
// });

world.beforeEvents.explosion.subscribe((data) => {
	data.getImpactedBlocks().forEach((block) => {
		const xChunk = (block.location.x >> 4).toFixed(0);
		const zChunk = (block.location.z >> 4).toFixed(0);
		const chunk = db_chunk.get(xChunk + "," + zChunk + data.dimension.id);
		if (chunk !== undefined && chunk.faction_name === "Admin") {
			data.cancel = true;
			return;
		}
	});
});

world.afterEvents.playerLeave.subscribe((data) => {
	const date = new Date();
	const customDate = new custom_date(date);
	let ply = db_player.get(data.playerName);
	if (ply !== undefined) {
		log("§7" + customDate.hour + ":" + customDate.minute + ":" + customDate.second + " §7[Left§7] §e" + ply.name);
		db_online_player.delete(data.playerName);
		remove_to_update_player(ply);
		ply.lastConnect = date.getTime();
		add_to_update_player(ply);
	}
});

world.afterEvents.playerJoin.subscribe((data) => {
	const date = new Date();
	const customDate = new custom_date(date);
	let ply = db_player.get(data.playerName);
	if (ply !== undefined) {
		log("§7" + customDate.hour + ":" + customDate.minute + ":" + customDate.second + " §7[Join§7] §e" + ply.name);
		remove_to_update_player(ply);
		ply.lastConnect = date.getTime();
		add_to_update_player(ply);
	}
});

world.beforeEvents.playerBreakBlock.subscribe((data) => {
	if (data.player.hasTag(adminTag)) return;
	const player = db_player.get(data.player.name);
	const xChunk = (data.block.location.x >> 4).toFixed(0);
	const zChunk = (data.block.location.z >> 4).toFixed(0);
	const chunk = db_chunk.get(xChunk + "," + zChunk + data.dimension.id);
	if (chunk !== undefined) {
		if (chunk.faction_name !== player.faction_name) {
			if (chunk.permission.length !== 0 && 
				(chunk.permission.find((p) => p.name === player.name)?.permission?.canBreak ?? false)) {
			}
		}
		else {
			if (chunk?.rankPermission.length !== 0 ?? false) {
				const faction = db_faction.get(player.faction_name);
				const rank = faction.playerList.find((p) => p.name === player.name).permission;
				const permission = chunk.rankPermission.find((p) => p.rank === factionRank[rank]);
				if (permission?.permission?.canBreak ?? false) {
					return;
				}
			}
		}
		if (chunk.defaultPermission.canBreak) return log("default permission OK");
		data.cancel = true;
	}
});

world.beforeEvents.playerPlaceBlock.subscribe((data) => {
	if (data.player.hasTag(adminTag)) return;
	const player = db_player.get(data.player.name);
	const xChunk = (data.block.location.x >> 4).toFixed(0);
	const zChunk = (data.block.location.z >> 4).toFixed(0);
	const chunk = db_chunk.get(xChunk + "," + zChunk + data.dimension.id);
	if (chunk !== undefined) {
		if (chunk.faction_name !== player.faction_name) {
			if (chunk.permission.length !== 0 && 
				(chunk.permission.find((p) => p.name === player.name)?.permission?.canPlace ?? false)) {
				return;
			}
		}
		else {
			if (chunk?.rankPermission.length !== 0 ?? false) {
				const faction = db_faction.get(player.faction_name);
				const rank = faction.playerList.find((p) => p.name === player.name).permission;
				const permission = chunk.rankPermission.find((p) => p.rank === factionRank[rank]);
				if (permission?.permission?.canPlace ?? false) {
					return;
				}
			}
		}
		if (chunk.defaultPermission.canPlace) return;
		data.cancel = true;
	}
});

world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
	if (data.player.hasTag(adminTag)) return;
	log("interact")
	const player = db_player.get(data.player.name);
	const xChunk = (data.block.location.x >> 4).toFixed(0);
	const zChunk = (data.block.location.z >> 4).toFixed(0);
	const chunk = db_chunk.get(xChunk + "," + zChunk + data.player.dimension.id);
	if (chunk !== undefined) {
		if (chunk.faction_name !== player.faction_name) {
			if (chunk.permission.length !== 0 && 
				(chunk.permission.find((p) => p.name === player.name)?.permission?.canInteract ?? false)) {
				return;
			}
		}
		else {
			if (chunk?.rankPermission.length !== 0 ?? false) {
				const faction = db_faction.get(player.faction_name);
				const rank = faction.playerList.find((p) => p.name === player.name).permission;
				const permission = chunk.rankPermission.find((p) => p.rank === factionRank[rank]);
				if (permission?.permission?.canInteract ?? false) {
					return;
				}
			}
		}
		if (chunk.defaultPermission.canInteract) return;
		data.cancel = true;
	}
});

/**
 * 
 * @param {string[]} args 
 * @param {ChatSendBeforeEvent} data 
 * @param {Ply} ply 
 */
function Aclaim(args, pl, ply) {
	const player = [...world.getAllPlayers()].find(p => p.name === pl.name);
	system.runTimeout(() => {
		new ActionFormData()
		.title("§eClaim Admin")
		.button("§aManage Claim")
		.button("§aAdd Admin Claim")
		.show(player).then((res) => {
			if (res.canceled) return;
			if (res.selection === 0) {
				ManageClaim(player, ply);
			}
			else {
				const xChunk = (player.location.x >> 4).toFixed(0);
				const zChunk = (player.location.z >> 4).toFixed(0);
				let oldChunk = db_chunk.get(xChunk + "," + zChunk + player.dimension.id);
				if (oldChunk !== undefined) {
					if (oldChunk.faction_name === "Admin") return tellraw(player.name, "§cThis chunk is already an admin claim.");
					let fac = db_faction.get(oldChunk.faction_name);
					if (fac === undefined) {
						log("§cError : Faction not found\n" + oldChunk.faction_name)
						return remove_chunk(oldChunk);
					}
					remove_to_update_faction(fac);
					fac.claim.splice(fac.claim.indexOf(fac.claim.find((c) => c.x === oldChunk.x && c.z === oldChunk.z)), 1);
					add_to_update_faction(fac);
					remove_chunk(oldChunk);
					tellraw(player.name, "§eYou have overwritten the claim of §c" + oldChunk.faction_name + "§e on this chunk.");
					log("§e" + player.name + "§r has overwritten the claim of §c" + oldChunk.faction_name + "§r on the chunk §e" + xChunk + "§r, §e" + zChunk + "§r.");
				}
				add_chunk(new Chunk(xChunk, zChunk, "Admin", new custom_date(new Date()), "Admin", player.dimension.id));
				tellraw(player.name, "§aNew Admin claim created.");
			}
		});
	}, 10);
}

/**
 * @param {Player} player
 * @param {Ply} ply
 * @param {faction} faction
 */
function ManageFactionClaimChoose(player, ply, faction) {
	if (faction === undefined) return tellraw(player.name, "§cFatal Error : Faction not found.");
	/** @type {Chunk[]} */
	let chunks = new Array();
	if (faction.claim.length === 0) return tellraw(player.name, "§cThis faction doesn't have any claim.");
	for (const cPos of faction.claim) {
		const chunk = db_chunk.get(cPos.x + "," + cPos.z + Server.id);
		if (chunk !== undefined) {
			chunks.push(chunk);
		}
		else {
			tellraw(player.name, "§cFatal Error : MissMatch between faction claim and chunk database.");
		}
	}
	let form = new ActionFormData()
	.title("§eSelect a chunk")
	for (const chunk of chunks) {
		form.button(chunk.x + ", " + chunk.z + "\nCoordinates: " + (chunk.x << 4) + ", " + (chunk.z << 4));
	}
	form.show(player).then((res) => {
		if (res.canceled) return;
		let chunk = chunks[res?.selection ?? 0];
		new ActionFormData()
		.title("§eManage Claim")
		.button("§aEdit Claim")
		.button("§aDelete Claim")
		.show(player).then((res) => {
			if (res.canceled) return ManageFactionClaimChoose(player, ply, faction);
			if (res.selection === 0) {
				new ActionFormData()
				.title("§eSelect Permission Type")
				.button("§aDefault Permission")
				.button("§aRank Permission")
				.button("§aPlayer Permission")
				.show(player).then(async (res) => {
					if (res.canceled) return ManageFactionClaimChoose(player, ply, faction);
					if (res.selection === 0) {
						let newPermission = await UI_chunkEditPermission(ply, player, {...chunk.defaultPermission});
						chunk = db_chunk.get(chunk.x + "," + chunk.z + Server.id);
						if (chunk === undefined) return tellraw(player.name, "§cThis chunk doesn't exist anymore.");
						remove_to_update_chunk(chunk);
						chunk.defaultPermission = newPermission;
						add_to_update_chunk(chunk);
						tellraw(player.name, "§aDefault Permission edited.");
					}
					else if (res.selection === 1) {
						new ActionFormData()
						.title("§eSelect Rank")
						.button("§aLeader")
						.button("§aOfficer")
						.button("§aMember")
						.button("§aVisitor")
						.show(player).then(async (res) => {
							if (res.canceled) return ManageFactionClaimChoose(player, ply, faction);
							const rank = res.selection;
							let permission = {...chunk.rankPermission.find((p) => p.rank === rank).permission};
							permission = await UI_chunkEditPermission(ply, player, {...permission});
							chunk = db_chunk.get(chunk.x + "," + chunk.z + Server.id);
							if (chunk === undefined) return tellraw(player.name, "§cThis chunk doesn't exist anymore.");
							remove_to_update_chunk(chunk);
							chunk.rankPermission.find((p) => p.rank === rank).permission = permission;
							add_to_update_chunk(chunk);
							tellraw(player.name, "§aRank Permission edited.");

						});
					}
					else {
						new ActionFormData()
						.title("§eSelect Mode")
						.button("§aAdd Player Permission")
						.button("§aEdit Player Permission")
						.show(player).then(async (res) => {
							if (res.canceled) return ManageFactionClaimChoose(player, ply, faction);
							if (res.selection === 0) {
								const newPlayer = await UI_find_player(player);
								if (newPlayer === undefined) return;
								let newPlayerPerm = new ChunkPlayerPermission(newPlayer.name, new ChunkPermission(false, false, false));
								let permission = await UI_chunkEditPermission(ply, player, {...newPlayerPerm.permission});
								if (permission === undefined) return;
								newPlayerPerm.permission = permission;
								chunk = db_chunk.get(chunk.x + "," + chunk.z + Server.id);
								if (chunk === undefined) return tellraw(player.name, "§cThis chunk doesn't exist anymore.");
								if (chunk.permission.find((p) => p.name === newPlayer.name) !== undefined) return tellraw(player.name, "§cThis player already have a permission on this chunk.");
								remove_to_update_chunk(chunk);
								chunk.permission.push(newPlayerPerm);
								add_to_update_chunk(chunk);
								tellraw(player.name, "§aPlayer Permission added.");
							}
						});
						if (chunk.permission.length === 0) return tellraw(player.name, "§cThis chunk doesn't have any player permission.");
						form = new ActionFormData()
						.title("§eSelect Player")
						const chunkPerm = chunk.permission.sort((a, b) => a.name > b.name ? 1 : -1);
						for (const p of chunkPerm) {
							form.button(p.name);
						}
						form.show(player).then(async (res) => {
							if (res.canceled) return ManageFactionClaimChoose(player, ply, faction);
							const PlayerPermission = chunkPerm[res?.selection ?? 0];
							let newPermission = await UI_chunkEditPermission(ply, player, {...PlayerPermission.permission}, true);
							if (newPermission === undefined) return;
							chunk = db_chunk.get(chunk.x + "," + chunk.z + Server.id);
							if (chunk === undefined) return tellraw(player.name, "§cThis chunk doesn't exist anymore.");
							remove_to_update_chunk(chunk);
							if (newPermission === true) {
								chunk.permission.splice(chunk.permission.indexOf(chunk.permission.find((p) => p.name === permission.name), 1));
								tellraw(player.name, "§aPlayer Permission deleted.");
							}
							else {
								chunk.permission.find((p) => p.name === PlayerPermission.name).permission = newPermission;
								tellraw(player.name, "§aPlayer Permission edited.");
							}
							add_to_update_chunk(chunk);
						});
					}
				});
			}
			else {
				chunk = db_chunk.get(chunk.x + "," + chunk.z + Server.id);
				if (chunk === undefined) return tellraw(player.name, "§cThis chunk doesn't exist anymore.");
				remove_chunk(chunk);
				tellraw(player.name, "§aClaim deleted.");
				ManageFactionClaimChoose(player, ply, faction);
			}
		});
	});
}

async function ManageFactionClaim(player, ply) {
	let factions;
	if (db_faction.size < 100) factions = [...db_faction.keys()].sort((a, b) => a > b ? 1 : -1);
	else {
		let i = 1;
		for (const [fac] of db_faction) {
			factions.push(fac);
			if (i++ % 30 === 0) await sleep(1);
		}
	}
	await sleep(2);
	if (factions.length === 0) return tellraw(player.name, "§cThere is no faction.");
	let form = new ActionFormData()
	.title("§eSelect a faction")
	for (let i = 0; i < factions.length; i++) {
		form.button(factions[i]);
		if (i % 10 === 0) await sleep(1);
	}
	form.show(player).then((res) => {
		if (res.canceled) return;
		ManageFactionClaimChoose(player, ply, db_faction.get(factions[res.selection]));
	});
}

async function ManageAdminClaim(player, ply) {
	const chunks = [...db_chunk.values()].filter(c => c.faction_name === "Admin");
	await sleep(2);
	if (chunks.length === 0) return tellraw(player.name, "§cThere is no admin claim.");
	let form = new ActionFormData()
		.title("§eSelect a chunk")
	for (const chunk of chunks) {
		form.button(chunk.x + ", " + chunk.z + "\nCoordinates: " + (chunk.x << 4) + ", " + (chunk.z << 4));
	}
	form.show(player).then((res) => {
		if (res.canceled) return;
		let chunk = chunks[res?.selection ?? 0];
		new ActionFormData()
			.title("§eManage Claim")
			.button("§aDefault Permission")
			.button("§aPlayer Permission")
			.button("§aDelete Claim")
			.show(player).then(async (res) => {
				if (res.canceled) return;
				if (res.selection === 0) {
					let newPermission = await UI_chunkEditPermission(ply, player, { ...chunk.defaultPermission });
					if (newPermission === undefined) return;
					chunk = db_chunk.get(chunk.x + "," + chunk.z + chunk.dimension);
					if (chunk === undefined) return tellraw(player.name, "§cThis chunk doesn't exist anymore.");
					remove_to_update_chunk(chunk);
					chunk.defaultPermission = newPermission;
					add_to_update_chunk(chunk);
					tellraw(player.name, "§aDefault Permission edited.");
				}
				else if (res.selection === 1) {
					new ActionFormData()
						.title("§eSelect Mode")
						.button("§aAdd Player Permission")
						.button("§aEdit Player Permission")
						.button("§aDelete Player Permission")
						.show(player).then(async (res) => {
							if (res.canceled) return;
							if (res.selection === 0) {
								const newPlayer = await UI_find_player(player);
								if (newPlayer === undefined) return;
								let newPlayerPerm = new ChunkPlayerPermission(newPlayer.name, new ChunkPermission(false, false, false));
								let permission = await UI_chunkEditPermission(ply, player, { ...newPlayerPerm.permission });
								if (permission === undefined) return;
								newPlayerPerm.permission = permission;
								chunk = db_chunk.get(chunk.x + "," + chunk.z + chunk.dimension);
								if (chunk === undefined) return tellraw(player.name, "§cThis chunk doesn't exist anymore.");
								if (chunk.permission.find((p) => p.name === newPlayer.name) !== undefined) return tellraw(player.name, "§cThis player already have a permission on this chunk.");
								remove_to_update_chunk(chunk);
								chunk.permission.push(newPlayerPerm);
								add_to_update_chunk(chunk);
								tellraw(player.name, "§aPlayer Permission added.");
							}
							else if (res.selection === 1) {
								if (chunk.permission.length === 0) return tellraw(player.name, "§cThis chunk doesn't have any player permission.");
								form = new ActionFormData()
									.title("§eSelect Player")
								const chunkPerm = chunk.permission.sort((a, b) => a.name > b.name ? 1 : -1);
								for (const p of chunkPerm) {
									form.button(p.name);
								}
								form.show(player).then(async (res) => {
									if (res.canceled) return;
									const PlayerPermission = chunkPerm[res?.selection ?? 0];
									let newPermission = await UI_chunkEditPermission(ply, player, { ...PlayerPermission.permission }, true);
									if (newPermission === undefined) return;
									chunk = db_chunk.get(chunk.x + "," + chunk.z + chunk.dimension);
									if (chunk === undefined) return tellraw(player.name, "§cThis chunk doesn't exist anymore.");
									remove_to_update_chunk(chunk);
									if (newPermission === true) {
										chunk.permission.splice(chunk.permission.indexOf(chunk.permission.find((p) => p.name === permission.name), 1));
										tellraw(player.name, "§aPlayer Permission deleted.");
									}
									else {
										chunk.permission.find((p) => p.name === PlayerPermission.name).permission = newPermission;
										tellraw(player.name, "§aPlayer Permission edited.");
									}
									add_to_update_chunk(chunk);
								});
							}
							else {
								if (chunk.permission.length === 0) return tellraw(player.name, "§cThis chunk doesn't have any player permission.");
								form = new ActionFormData()
									.title("§eSelect Player")
								const chunkPerm = chunk.permission.sort((a, b) => a.name > b.name ? 1 : -1);
								for (const p of chunkPerm) {
									form.button(p.name);
								}
								form.show(player).then(async (res) => {
									if (res.canceled) return;
									const PlayerPermission = chunkPerm[res?.selection ?? 0];
									chunk = db_chunk.get(chunk.x + "," + chunk.z + chunk.dimension);
									if (chunk === undefined) return tellraw(player.name, "§cThis chunk doesn't exist anymore.");
									remove_to_update_chunk(chunk);
									chunk.permission.splice(chunk.permission.indexOf(chunk.permission.find(PlayerPermission), 1));
									add_to_update_chunk(chunk);
									tellraw(player.name, "§aPlayer Permission deleted.");
								});
							}
						});
				}
				else {
					chunk = db_chunk.get(chunk.x + "," + chunk.z + chunk.dimension);
					if (chunk === undefined) return tellraw(player.name, "§cThis chunk doesn't exist anymore.");
					remove_chunk(chunk);
					tellraw(player.name, "§aClaim deleted.");
				}
			});
	});
}

function ManageClaim(player, ply) {
	new ActionFormData()
	.title("§eManage Claim")
	.button("§aFaction Claim")
	.button("§aAdmin Claim")
	.show(player).then((res) => {
		if (res.canceled) return;
		if (res.selection === 0) {
			ManageFactionClaim(player, ply);
		}
		else {
			ManageAdminClaim(player, ply);
		}
	});
}

/**
 * @param {delay} delay 
 * @param {number} seconds 
 * @returns 
 */
function update_time(delay, seconds) {
	if (seconds === 0) return remove_delay(delay);
	const date = new Date();
	if (date.getTime() >= delay.time) {
		tellraw(delay.name, "§cYou can't teleport for " + seconds + " seconds");
	}
	remove_to_update_delay(delay);
	delay.time = seconds * 1000 + date.getTime();
	add_to_update_delay(delay);
}

/**
 * @param {delay} delay 
 * @returns 
 */
function check_time(delay) {
	const date = new Date();
	if (date.getTime() >= delay.time) {
		remove_delay(delay);
		return true;
	}
	return false;
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function Fhome(args, data, ply) {
	if (db_delay.has(ply.name)) if (!check_time(db_delay.get(ply.name))) return tellraw(ply.name, "§cYou have to wait " + (db_delay.get(ply.name).time - new Date().getTime()) / 1000 + " seconds before using this command.");
	if (data.sender.hasTag("tpCanceled") && !data.sender.hasTag(adminTag)) return tellraw(data.sender.name, "§cYou can't accept a teleportation request in this area.");
	let fac = db_faction.get(ply.faction_name);
	if (fac != undefined) {
		if (fac.isFhome == true && fac.x != null) {
            let player = db_player.get(data.sender.name);
            if (player != undefined) {
                remove_to_update_player(player);
                player.back.x = Math.ceil(data.sender.location.x + 0.0001) - 1;
                player.back.y = Math.floor(data.sender.location.y + 0.4999);
                player.back.z = Math.ceil(data.sender.location.z + 0.0001) - 1;
                add_to_update_player(player);
            }
			runCommand(`tp "${data.sender.name}" ${fac.x} ${fac.y} ${fac.z}`);
			tpsound([...world.getPlayers()].find((p) => p.name === data.sender.name));
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_find_faction);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function sethomelimit(args, data, ply) {
	if (args[args.length - 1].match(/^([0-9]{1,})$/)) {
		let nb = parseInt(args[args.length - 1])
		if (args.length == 2) {
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.homeLimit = nb;
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			tellraw(data.sender.name, translate(ply.lang, args[1]).set_homelimit_g);
		}
		else {
			let name = "";
			for (let i = 1; i < args.length - 1; i++) {
				name += args[i].replace(/"/g, "").replace(/@/g, "") + " ";
			}
			name = name.trim();
			let player = db_player.get(name)
			if (player != undefined) {
				remove_to_update_player(player);
				player.homeLimit = nb;
				add_to_update_player(player);
				tellraw(data.sender.name, translate(ply.lang, name, nb).set_homelimit_l);
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_find_player);
			}
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_number);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args
 * @param {ChatSendAfterEvent} data
 * @returns 
 */
function sethome(args, data, ply) {
	if (!data.sender.hasTag(adminTag) && !ply.cmd_module.includes(cmd_module.all) && !ply.cmd_module.includes(cmd_module.home)) return tellraw(data.sender.name, "§cThis Module is disabled.");
	if (args.length >= 2) {
		let name = "";
		for (let i = 1; i < args.length; i++) {
			name += args[i].replace(/"/g,"") + " ";
		}
		name = name.trim();
		let player = db_player.get(data.sender.name);
		if (player.home.find((h) => h.name === name) != undefined) {
			tellraw(data.sender.name, translate(ply.lang).error_have_home);
			return;
		}
		if (player.home.length >= player.homeLimit) {
			tellraw(data.sender.name, translate(ply.lang).error_limit_home);
			return;
		}
		const homeObject = {
			x: Math.ceil(data.sender.location.x + 0.0001) - 1,
			y: Math.ceil(data.sender.location.y - 0.4999),
			z: Math.ceil(data.sender.location.z + 0.0001) - 1,
			dimension: getCurrentDimension(data.sender),
			name: name
		};
		remove_to_update_player(player)
		player.home.push(homeObject);
		add_to_update_player(player);
		tellraw(data.sender.name, translate(ply.lang, name).home_add);
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function delhome(args, data, ply) {
	if (!data.sender.hasTag(adminTag) && !ply.cmd_module.includes(cmd_module.all) && !ply.cmd_module.includes(cmd_module.home)) return tellraw(data.sender.name, "§cThis Module is disabled.");
	if (args.length >= 2) {
		let name = "";
		for (let i = 1; i < args.length; i++) {
			name += args[i] + " ";
		}
		name = name.trim();
		let player = db_player.get(data.sender.name);
		if (player != undefined) {
			let home = player.home.find((h) => h.name === name);
			if (home != undefined) {
				remove_to_update_player(player);
				player.home.splice(player.home.indexOf(home),1);
				add_to_update_player(player);
				tellraw(data.sender.name, translate(ply.lang, home.name).home_remove);
			}
			else {
				if (args == 3) {
					if (data.sender.hasTag(adminTag)) {
						let player = db_player.get(args[1].replace(/[@"]/g,""));
						if (player != undefined) {
							let home = player.home.find((h) => h.name === args[2].replace(/"/g,""));
							if (home != undefined) {
								remove_to_update_player(player);
								player.home.splice(player.home.indexOf(home),1);
								add_to_update_player(player)
								tellraw(data.sender.name, translate(ply.lang, home.name, args[1]).admin_home_remove);
							}
							else {
								tellraw(data.sender.name, translate(ply.lang).error_find_home);
							}
						}
						else {
							tellraw(data.sender.name, translate(ply.lang).error_find_player);
						}
					}
					else {
						tellraw(data.sender.name, translate(ply.lang).error_find_home);
					}
				}
				else {
					tellraw(data.sender.name, translate(ply.lang).error_find_home);
				}
			}
		}
		else {
			tellraw(data.sender.name, "§cPlayer not found. (this shouldn't happen, please contact an admin).");
		}
	}
	else {
		if (!data.sender.hasTag(adminTag)) return tellraw(data.sender.name, translate(ply.lang).error_arg);
		let pl = [...world.getPlayers()].find((p) => p.name === data.sender.name)
		tellraw(data.sender.name, "§7You have 1 second to quit chat, a form will appear.");
		system.runTimeout(async () => {
			let target = await UI_find_player(pl);
			if (!target) return;
			if (target.home.length == 0) return tellraw(pl.name, "§cThis player doesn't have any home.");
			let copy_home = [...target.home];
			let form = new ModalFormData()
			.title("§cDelete home \n§7(check the home you want to delete)")
			copy_home.forEach((h) => {
				form.toggle(h.name + " §b" + h.x + ", " + h.y + ", " + h.z + " §e" + h.dimension, false)
			})
			form.show(pl).then(res => {
				target = db_player.get(target.name);
				if (res.canceled || !target || res.formValues.every((v) => v == false)) return;
				remove_to_update_player(target);
				for (let i = 0; i < res.formValues.length; i++) {
					if (res.formValues[i] === true) {
						target.home.splice(target.home.indexOf(copy_home[i]), 1);
						tellraw(pl.name, "§aHome §b" + copy_home[i].name + " §aof §b" + target.name + " §ahas been deleted.")
					}
				}
				add_to_update_player(target);
			})
		}, 25)
	}
}

/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function home(args, data, ply) {
	if (!data.sender.hasTag(adminTag) && !ply.cmd_module.includes(cmd_module.all) && !ply.cmd_module.includes(cmd_module.home)) return tellraw(data.sender.name, "§cThis Module is disabled.");
	if (db_delay.has(ply.name)) if (!check_time(db_delay.get(ply.name))) return tellraw(ply.name, "§cYou have to wait " + (db_delay.get(ply.name).time - new Date().getTime()) / 1000 + " seconds before using this command.");
	if (args.length >= 2) {
		if (data.sender.hasTag("tpCanceled") && !data.sender.hasTag(adminTag)) return tellraw(data.sender.name, "§cYou can't accept a teleportation request in this area.");
		let name = "";
		for (let i = 1; i < args.length; i++) {
			name += args[i] + " ";
		}
		name = name.trim();
		const ahome = db_player.get(data.sender.name).home.find((h) => h.name === name);
		if (ahome != undefined) {
            // if (ahome.dimension != getCurrentDimension(data.sender)) {
            //     tellraw(data.sender.name, "§cYou need to be in the same dimension.");return;
            // }
            let player = db_player.get(data.sender.name);
            if (player != undefined) {
                remove_to_update_player(player);
                player.back.x = Math.ceil(data.sender.location.x + 0.0001) - 1;
                player.back.y = Math.floor(data.sender.location.y + 0.4999);
                player.back.z = Math.ceil(data.sender.location.z + 0.0001) - 1;
                add_to_update_player(player);
            }
			runCommandDim(`tp \"${data.sender.name}\" ${ahome.x} ${ahome.y} ${ahome.z}`, ahome.dimension);
			tpsound([...world.getPlayers()].find((p) => p.name === data.sender.name));
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_find_home);
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}
/**
 * @param {Ply} ply
 * @param {string[]} args 
 * @param {ChatSendAfterEvent} data 
 * @returns 
 */
function listhome(args, data, ply) {
	if (!data.sender.hasTag(adminTag) && !ply.cmd_module.includes(cmd_module.all) && !ply.cmd_module.includes(cmd_module.home)) return tellraw(data.sender.name, "§cThis Module is disabled.");
	if (args.length == 1) {
		let message = "";
		const homes = db_player.get(data.sender.name).home;
		for (const h of homes) {
			message += `\n§e  -"§a${h.name}§e" ${h.x}, ${h.y}, ${h.z} | ${h.dimension}`;
		}
		if (message != "") {
			tellraw(data.sender.name, translate(ply.lang, message).home_list);
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_home_list);
		}
	}
	else if (args.length >= 2) {
		if (data.sender.hasTag(adminTag)) {
			let name = "";
			for (let i = 1; i < args.length; i++) {
				name += args[i].replace(/"/g,"").replace(/@/g, "") + " ";
			}
			name = name.trim();
			
			let player = db_player.get(name);
			let message = "";
			if (player != undefined) {
				for (const ahome of player.home) {
					message += `\n§e  -"§a${ahome.name}§e" ${ahome.x}, ${ahome.y}, ${ahome.z} | ${ahome.dimension}`;
				}
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_find_player);
				return;
			}
			if (message != "") {
				tellraw(data.sender.name, translate(ply.lang, message).home_list);
			}
			else {
				tellraw(data.sender.name, translate(ply.lang).error_home_list);
			}
		}
		else {
			tellraw(data.sender.name, translate(ply.lang).error_not_allow_command);
		}
	}
	else {
		tellraw(data.sender.name, translate(ply.lang).error_arg);
	}
}

function getDateUTC() {
    let date = new Date();
    date.setTime(date.getTime() + db_map.UTC * 60 * 60 * 1000);
    return date;
}

/**
 * @param {string} command 
 * @returns {Object.CommandResult}
 */
function runCommand(command) {
	try {
		return { error: false, ...Server.runCommandAsync(command) };
	} catch (error) {
		return { error: true };
	}
}
/**
 * 
 * @param {string} command
 * @param {Dimension} dimension
 * @returns {Boolean}
 */
async function runCommandDim(command, dimension) {
	try {
		return { error: false, ...world.getDimension(dimension).runCommandAsync(command)};//to fix at the next update
	} catch (error) {
		return { error: true };
	}
}

/**
 * 
 * @param {string} score
 * @example getScoreboardValue("fakePlayer scoreName") 
 * @returns 
 */
function getScoreboardValue(score) {
	var value = runCommand(`scoreboard players test ${score} * *`).statusMessage;
	let i = 0;

	if (value == undefined) { return 0; }
	while (!(value.substring(0, 1).match(/[0-9]/) || value.substring(0, 1) == "-")) { value = value.substring(1); }
	while (value.substring(i, 1 + i).match(/[ 0-9]/) || value.substring(i, 1 + i) == "-") { i++; }
	return (value.substring(0, i));
}


/**
 * @param {Player} player 
 * @returns {string} Dimension.id
 */
function getCurrentDimension(player)
{
	return (player.dimension.id);
}

/** @param {string} text */
function log(text) { Server.runCommandAsync(`tellraw @a[tag=log] {"rawtext":[{"text":"§7{log} §r${text.toString().replace(/"/g, "\'").replace(/\n/g, "§r\n")}"}]}`) }

/**
 * Convert string to Hexadecimal
 * @param {string} text
 * @returns {string}
 */
function textToHex(text) {
	return text.split("").map((char) => {
		return char.charCodeAt(0).toString(16);
	}).join(" ");
}

/**
 * Convert Hexadecimal to string
 * @param Hexadecimal
 * @returns {String}
 */
 function hexToText(hex) {
	return hex.split(" ").map((char) => {
		return String.fromCharCode(parseInt(char, 16));
	}).join("");
}

/**
 * @param {RegExp} regexObj
 * @example getMap(/(?<=\$db_player\()[0-9a-f\s]+(?=\))/g);
 * @returns {String[]} string array
 */
function getMap(regexObj) {
	try {
		let data = "";
		let score = world.scoreboard.getObjective('database').getScores();
		score.forEach(s => {
			data += s.participant.displayName;
		})
		try {
			if (data == "")
				return null;
			return data.match(regexObj);
		} catch (e) {
			runCommand(`say getBinary error: ${e}`);
		}

	} catch (e) {
		runCommand(`say getBinary error: ${e}`);
	}
}

/**
 * @param {Player.name} selector
 * @param {String} selector 
 * @param {String} text 
 */
function tellraw(selector, text) {
	//runCommand("say " + `tellraw "${selector}" {"rawtext":[{"text":"§r${text.replace(/"/g, "\'")}"}]}`)
	if (!selector.match(/@/g)) {
		runCommand(`tellraw "${selector}" {"rawtext":[{"text":"§r${text.replace(/"/g, "\'")}"}]}`);
	}
	else {
		runCommand(`tellraw ${selector} {"rawtext":[{"text":"§r${text.replace(/"/g, "\'")}"}]}`);
	}
}

/**
 * findFirstTagStartWith("Mister Art43", "Admin");
 * @param {Player} player 
 * @param {String} tag 
 * @returns {String|undefined}
 */
function findFirstTagStartWith(player, tag) {
	const regex = /"/g;
	let foundTag = player.getTags().find((aTag) => aTag.replace(regex, "").startsWith(tag));

	if (arguments[2]) foundTag = arguments[2].find((aTag) => aTag.replace(regex, "").startsWith(tag));
	else foundTag = player.getTags().find((aTag) => aTag.replace(regex, "").startsWith(tag));
	return foundTag ? foundTag.replace(regex, "") : undefined;
}

/**
 * findTagsStartWith("Mister Art43", "Admin");
 * @param {Player} player 
 * @param {String} tag 
 * @returns {String[]}
 */
 function findTagsStartWithV2(player, tag) {
	if (arguments[2]) return arguments[2].filter((aTag) => aTag.replace(/"/g, "").startsWith(tag));
	return player.getTags().filter((aTag) => aTag.replace(/"/g, "").startsWith(tag));
}

function addDateZ(n) {
	if (n <= 9)
		return "0" + n;
	return n
}

async function initDB_map() {
	if (db_map == undefined) {
		Server.runCommandAsync("scoreboard objectives add database dummy");
		try {
			db_map = JSON.parse(hexToText(getMap(/(?<=\$db_map\()[0-9a-f\s]+(?=\))/g).join(""))); //notabene PENSER A PROTEGER LE MATCH !!!
			if (db_map == undefined) {
				log("§7[DB] no map database found, creating a new one. try");
				runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
				db_map = newmap();
				runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			}
		}
		catch (e) {//always catch after a reset
			log("§7[DB] no map database found, creating a new one");
			try {
				runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
				db_map = newmap();
				runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			}
			catch (er) {
				db_map = newmap();
				runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
			}
			log("§7[DB] map fixed");
		}
	}
	if (db_map.v != version) {
		log(`§7[DB] database version is outdated, do ${prefix}update`);
		if (db_map.refreshTick == undefined) {
			runCommand("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
			db_map.refreshTick = 10;
			runCommand("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
		}
	}
}

//TODO
class my_map {
	constructor() {
		this.v = version;
		this.homeLimit = 3;
		this.factionMemberLimit = 5;
		this.scoreMoney = "money";
		this.isFhome = false;
		this.prefix = prefix;
		this.customName = false;
		this.showHeart = false;
		this.showRole = false;
		this.warpDelay = 5;
		this.UTC = 0;
		this.tpaDelay = 60;
		this.lockAdmin = false;
		this.privateChat = false;
		this.chatPrefix = "§r•>";
		this.defaultLang = "en";
		this.factionSeparator = "••";
		this.refreshTick = 10;
		this.factionColor = "§6";
		/** @type {rule} */
		this.ruleCode = new rule();
		/** @type {cmd_module[]} */
		this.default_cmd_module = [cmd_module.all];
	}
}

/**
 * @property {boolean} isRuleCode
 * @property {boolean} isAutoGen
 * @property {string} code
 */
class rule {
	constructor() {
		this.isRuleCode = false,
		this.isAutoGen = false,
		this.code = "" 
	}
}

/**
 * @returns {db_map}
 */
function newmap() {
	return {
		v:version, 
		homeLimit: 3, 
		factionMemberLimit: 5, 
		scoreMoney: "money", 
		isFhome: false, 
		prefix: prefix, 
		customName:false , 
		showHeart:false,
		showRole:false,
		warpDelay:5, 
		UTC:0, 
		tpaDelay:60, 
		lockAdmin:false, 
		privateChat:false, 
		chatPrefix:"§r•>",
		defaultLang:"en",
		factionSeparator:"••",
		refreshTick: 5,
		factionColor:"§6",
		ruleCode: new rule(),
		playerHurtDelay: 5,
		randomHurtDelay: 3,
		default_cmd_module: [cmd_module.all],
		defaultPower: 5,
		powerLimit: {min:-10, max:10},
		timeToRegenPower: 60,
	};
}

async function initDB_faction() {
	if (db_faction.size === 0) {
		const objectiveName = "db_faction";
		await Server.runCommandAsync(`scoreboard objectives add ${objectiveName} dummy`);
		const start = Date.now();

		try {
			const objective = world.scoreboard.getObjective(objectiveName);
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
					/** @type {faction} */
					let faction = JSON.parse(hexToText(db.join("")));

					
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

/** @param {faction} faction */
function add_to_update_faction(faction) {
	runCommand("scoreboard players set \"$db_faction(" + textToHex(JSON.stringify(faction)) + ")\" db_faction 1");
}

/** @param {faction} faction */
function remove_to_update_faction(faction) {
	runCommand("scoreboard players reset \"$db_faction(" + textToHex(JSON.stringify(faction)) + ")\" db_faction");
}

/** @param {faction} faction */
function add_faction(faction) {
	runCommand("scoreboard players set \"$db_faction(" + textToHex(JSON.stringify(faction)) + ")\" db_faction 1");
	db_faction.set(faction.name, faction); //to rework because unefficient when updating
}

/** @param {faction} faction */
function remove_faction(faction) {
	runCommand("scoreboard players reset \"$db_faction(" + textToHex(JSON.stringify(faction)) + ")\" db_faction");
	db_faction.delete(faction.name);
}

function initDB_warp() {
	// log("§lDEBUG DB_warp\n len : " + db_warp.length);
	if (db_warp.length == 0) {
		runCommand("scoreboard objectives add db_warp dummy")
		try {
			world.scoreboard.getObjective('db_warp').getScores().forEach(s => {
				if (s.participant.displayName.match(/(?<=\$db_warp\()[0-9a-f\s]+(?=\))/g) != null) {
					db_warp.push(JSON.parse(hexToText(s.participant.displayName.match(/(?<=\$db_warp\()[0-9a-f\s]+(?=\))/g).join(""))))
					//log(db_warp.length.toString())
					sleep(2)
				}
			})
			log("db_warp loaded")
		}
		catch (e) {
			log("§7[DB] can't find any databse for db_warp, creating a new one " + e);
		}
	}
}

function add_warp(warp) {
	if (db_warp.find((w) => w.name === warp.name) == undefined) {
		db_warp.push(warp);
		runCommand("scoreboard players set \"$db_warp(" + textToHex(JSON.stringify(warp)) + ")\" db_warp 1");
		//log("warp added");
	}
	else {
		log("§cadd warp error, the warp already exist");
	}
}

function remove_warp(warp) {
	if (db_warp.find((w) => w == warp) != undefined) {
		runCommand("scoreboard players reset \"$db_warp(" + textToHex(JSON.stringify(warp)) + ")\" db_warp");
		db_warp.splice(db_warp.indexOf(warp), 1);
	}
	else {
		log("§ccannot remove " + warp.name + "possible duplication in the database");
	}
}

system.beforeEvents.watchdogTerminate.subscribe( data => {
	log(data.terminateReason.toString())
	// data.cancel = true;
})

async function initDB_player() {
	if (db_player.size === 0) {
		const objectiveName = "db_player";
		await Server.runCommandAsync(`scoreboard objectives add ${objectiveName} dummy`);
		const start = Date.now();

		try {
			const objective = world.scoreboard.getObjective(objectiveName);
			const sc = objective.getScores();
			const nbParticipants = sc.length;
			// log("§7[DB] §atotal Participants : " + nbParticipants)
			const batchSize = 61 >>> 0;
			const batchNumber = Math.ceil(nbParticipants / batchSize);

			const progressBar = "§a[DB] §7loading db_player... §e";
			const percentageUnit = 100 / nbParticipants;
			loadDatabase.player = progressBar + "0.00%";

			const onlinePlayers = [...world.getPlayers()];

			// if (nbParticipants > 100) await sleep(1);
			for (let i = 0; i < batchNumber; i++) {
				const batchStart = i * batchSize;
				const batchEnd = batchStart + batchSize;
				const batch = batchEnd < nbParticipants ? sc.slice(batchStart, batchEnd) : sc.slice(batchStart);
				// log("§7[DB] §abatchEnd : " + batchEnd)

				const updateDbPlayerPromises = batch.map(async (score, i) => {
					const db = score.participant.displayName.match(/(?<=\$db_player\()[0-9a-f\s]+(?=\))/g);
					if (!db) {
						log("§cError: Mismatch data in db_player, try deleting the database and restarting the server. Contact the developer.");
						return;
					}
					/** @type {Ply} */
					let player = JSON.parse(hexToText(db.join("")));

					// Update db_player map
					const existingPlayer = db_player.get(player.name);

					if (existingPlayer) {
						// Update existing player data
						log(`§cDuplicate player found, fixing ${player.name}`)
						objective.removeParticipant(score.participant);
						if (existingPlayer.timePlayed < player.timePlayed) {
							await async_remove_to_update_player(existingPlayer);
							player = existingPlayer;
							await async_add_to_update_player(player);
						}
					} else {
						db_player.set(player.name, player);
					}
					// log("§7[DB] §a" + player.name + " loaded")
					// Update db_online_player map
					const onlinePlayer = onlinePlayers.find((p) => p.name === player.name);
					if (onlinePlayer) {
						db_online_player.set(player.name, db_player.get(player.name));
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
		isLoaded = true;
	}
}



system.beforeEvents.watchdogTerminate.subscribe( data => {
	log(data.terminateReason.toString())
})

/** @param {Ply} player */
function remove_to_update_player(player) {
	Server.runCommandAsync("scoreboard players reset \"$db_player(" + textToHex(JSON.stringify(player)) + ")\" db_player");
}

/** @param {Ply} player */
function add_to_update_player(player) {
	//log("updated !")
	Server.runCommandAsync("scoreboard players set \"$db_player(" + textToHex(JSON.stringify(player)) + ")\" db_player 1");
}

async function async_remove_to_update_player(player) {
	await Server.runCommandAsync("scoreboard players reset \"$db_player(" + textToHex(JSON.stringify(player)) + ")\" db_player");
}

/** @param {Ply} player */
async function async_add_to_update_player(player) {
	//log("updated !")
	await Server.runCommandAsync("scoreboard players set \"$db_player(" + textToHex(JSON.stringify(player)) + ")\" db_player 1");
}

/** @param {Ply} player */
function add_player(player) {
	if (db_player.has(player.name)) {
		log(`§cDuplicate player found, fixing ${player.name}`);
		remove_player(db_player.get(player.name));
	}
	db_player.set(player.name, player);
	Server.runCommandAsync("scoreboard players set \"$db_player(" + textToHex(JSON.stringify(player)) + ")\" db_player 1");
}

/** @param {Ply} player */
function remove_player(player) {
	Server.runCommandAsync("scoreboard players reset \"$db_player(" + textToHex(JSON.stringify(player)) + ")\" db_player");
	db_player.delete(player.name);
}

//----------------------DELAY----------------------//

async function initDB_delay() {
	if (db_delay.size === 0) {
		const objectiveName = "db_delay";
		await Server.runCommandAsync(`scoreboard objectives add ${objectiveName} dummy`);
		const start = Date.now();

		try {
			const sc = world.scoreboard.getObjective(objectiveName).getScores();
			const totaldelays = sc.length;
			const batchSize = 30 >>> 0;

			const progressBar = "§a[DB] §7loading db_delay... §e";
			const percentageUnit = 100 / totaldelays;

			for (let i = 0; i < totaldelays; i++) {
				const db = sc[i].participant.displayName.match(/(?<=\$db_delay\()[0-9a-f\s]+(?=\))/g);
				if (!db) {
					log("§cError: Mismatch data in db_delay, try deleting the database and restarting the server. Contact the developer.");
					continue;
				}

				const delay = JSON.parse(hexToText(db.join("")));
				if (db_delay.has(delay.name)) {
					await Server.runCommandAsync(`scoreboard players reset "${sc[i].participant.displayName}" ${objectiveName}`);
					log(`§cDuplicate delay found, removing ${delay.name}`);
					continue;
				}

				db_delay.set(delay.name, delay);

				if (i && i % batchSize === 0) {
					loadDatabase.delay = progressBar + (i * percentageUnit).toFixed(2) + "%";
					await sleep(1);
				}
			}
		} catch (e) {
			log("§7[DB] can't find any database for db_delay, creating a new one " + e);
		}

		const end = Date.now();
		log("§7db_delay loaded in " + ((end - start) / 1000) + " second(s)");
	}
}

/** @param {delay} delay */
function remove_to_update_delay(delay) {
	Server.runCommandAsync("scoreboard players reset \"$db_delay(" + textToHex(JSON.stringify(delay)) + ")\" db_delay");
}

/** @param {delay} delay */
function add_to_update_delay(delay) {
	Server.runCommandAsync("scoreboard players set \"$db_delay(" + textToHex(JSON.stringify(delay)) + ")\" db_delay 1");
}

/** @param {delay} delay */
function add_delay(delay) {
	if (db_delay.has(delay.name)) {
		log(`§cDuplicate delay found, fixing ${delay.name}`);
		remove_delay(db_delay.get(delay.name));
	}
	db_delay.set(delay.name, delay);
	Server.runCommandAsync("scoreboard players set \"$db_delay(" + textToHex(JSON.stringify(delay)) + ")\" db_delay 1");
}

/** @param {delay} delay */
function remove_delay(delay) {
	Server.runCommandAsync("scoreboard players reset \"$db_delay(" + textToHex(JSON.stringify(delay)) + ")\" db_delay");
	db_delay.delete(delay.name);
}

function initDB_display() {
	// log("§lDEBUG DB_display\n len : " + db_display.length);
	if (db_display.length == 0) {
		runCommand("scoreboard objectives add db_display dummy")
		try {
			world.scoreboard.getObjective('db_display').getScores().forEach(s => {
				if (s.participant.displayName.match(/(?<=\$db_display\()[0-9a-f\s]+(?=\))/g) != null) {
					db_display.push(JSON.parse(hexToText(s.participant.displayName.match(/(?<=\$db_display\()[0-9a-f\s]+(?=\))/g).join(""))))
					// log(db_display.length.toString())
					sleep(2)
				}
			})
			log("db_display loaded")
		}
		catch (e) {
			log("§7[DB] can't find any databse for db_display, creating a new one " + e);
		}
	}
}

/** @param {display} display */
function add_display(display) {
	if (db_display.find((w) => w == display) == undefined) {
		db_display.push(display);
		runCommand("scoreboard players set \"$db_display(" + textToHex(JSON.stringify(display)) + ")\" db_display 1");
		//log("display added");
	}
	else {
		log("§cadd display error, the display already exist");
	}
}

/** @param {display} display */
function remove_display(display) {
	if (db_display.find((w) => w == display) != undefined) {
		runCommand("scoreboard players reset \"$db_display(" + textToHex(JSON.stringify(display)) + ")\" db_display");
		db_display.splice(db_display.indexOf(display), 1);
	}
	else {
		log("§ccannot remove " + display.name + "possible duplication in the database");
	}
}

function initDB_admin() {
	//log("§lDEBUG DB_admin\n len : " + db_admin.length);
	if (db_admin.length == 0) {
		runCommand("scoreboard objectives add db_admin dummy")
		try {
			world.scoreboard.getObjective('db_admin').getScores().forEach(s => {
				if (s.participant.displayName.match(/(?<=\$db_admin\()[0-9a-f\s]+(?=\))/g) != null) {
					db_admin.push(JSON.parse(hexToText(s.participant.displayName.match(/(?<=\$db_admin\()[0-9a-f\s]+(?=\))/g).join(""))))
					// log(db_admin.length.toString())
					sleep(2)
				}
			})
			log("db_admin loaded")
		}
		catch (e) {
			log("§7[DB] can't find any databse for db_admin, creating a new one " + e);
		}
	}
}

/** @param {admin} admin */
function add_admin(admin) {
	if (db_admin.find((w) => w.name === admin.name) == undefined) {
		db_admin.push(admin);
		runCommand("scoreboard players set \"$db_admin(" + textToHex(JSON.stringify(admin)) + ")\" db_admin 1");
		//log("admin added");
	}
	else {
		log("§cadd admin error, the admin already exist");
	}
}

/** @param {admin} admin */
function remove_admin(admin) {
	if (db_admin.find((w) => w == admin) != undefined) {
		runCommand("scoreboard players reset \"$db_admin(" + textToHex(JSON.stringify(admin)) + ")\" db_admin");
		db_admin.splice(db_admin.indexOf(admin), 1);
	}
	else {
		log("§ccannot remove " + admin.name + "possible duplication in the database");
	}
}

async function initDB_chunk() {
	if (db_chunk.size === 0) {
		const objectiveName = "db_chunk";
		await Server.runCommandAsync(`scoreboard objectives add ${objectiveName} dummy`);
		const start = Date.now();

		try {
			const objective = world.scoreboard.getObjective(objectiveName);
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
						let GC = group_chunk.get(chunk.group + chunk.faction_name);
						if (GC == undefined) {
							group_chunk.set(chunk.group + chunk.faction_name, [chunk]);
						}
						else {
							GC.push(chunk);
							group_chunk.set(chunk.group + chunk.faction_name, GC);
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

//NEXT UPDATE
/** @param {Chunk} chunk */
function add_to_update_chunk(chunk) {
	runCommand("scoreboard players set \"$db_chunk(" + textToHex(JSON.stringify(chunk)) + ")\" db_chunk 1");
}

/** @param {Chunk} chunk */
function remove_to_update_chunk(chunk) {
	runCommand("scoreboard players reset \"$db_chunk(" + textToHex(JSON.stringify(chunk)) + ")\" db_chunk");
}

/** @param {Chunk} chunk */
function add_chunk(chunk) {
	if (db_chunk.has(chunk.x + "," + chunk.z)) return log(`§cDuplicate chunk found, fixing ${chunk.x}, ${chunk.z}`);
	runCommand("scoreboard players set \"$db_chunk(" + textToHex(JSON.stringify(chunk)) + ")\" db_chunk 1");
	db_chunk.set(chunk.x + "," + chunk.z + chunk.dimension, chunk); //to rework because unefficient when updating
	log(JSON.stringify(Array.from(db_chunk.keys()), null, 2));
}

/** @param {Chunk} chunk */
function remove_chunk(chunk) {
	if (!db_chunk.has(chunk.x + "," + chunk.z + chunk.dimension)) log(`§cERROR: try to remove a chunk that doesn't exist, ${chunk.x}, ${chunk.z}, possible duplication in the database`);
	runCommand("scoreboard players reset \"$db_chunk(" + textToHex(JSON.stringify(chunk)) + ")\" db_chunk");
	db_chunk.delete(chunk.x + "," + chunk.z + chunk.dimension);
}


/** @param {number} ticks */
function sleep(ticks) {
	return new Promise(resolve => system.runTimeout(resolve, ticks));
}

world.afterEvents.worldInitialize.subscribe(async () => {
	initDB_player();
	initDB_map();
	initDB_warp();
	initDB_admin();
	initDB_faction();
	initDB_display();
	initDB_chunk();
	initDB_delay();
	await sleep(5);
	prefix = db_map.prefix;
	
})

world.afterEvents.playerSpawn.subscribe(data => {
	if (data.player.hasTag(adminTag) && db_map.v != version) {
		tellraw(data.player.name, "§7[DB] database version is outdated, do " + prefix + "update");
	}
})