import { EntityHealthComponent, Player, system, world } from "@minecraft/server";
import { Server, findFirstTagStartWith, findTagsStartWithV2, log, tellraw, textToHex } from "../Object/tool/tools";
import { Ply, db_player, db_player_online } from "../Object/player/Ply";
import { Display, db_display } from "../Object/display/Display";
import { Faction, db_faction } from "../Object/faction/Faction";
import { display_rule } from "../Command/Player/Rule";
import { addDateZ, formatCreationDayTime } from "../Object/tool/dateTools";
import { translate } from "../Object/tool/lang";
import { db_map } from "../Object/database/db_map";
import { db_warp } from "../Object/warp/Warp";
import { db_admin } from "../Object/player/Admin";
import { db_chunk } from "../Object/chunk/Chunk";
import { db_delay } from "../Object/player/Delay";

let curTick = 0;
const START_TICK = 20; //start 0.5 secondes after a "/reload"

async function processTags(player: Player, playerData: Ply, tags: string[]) : Promise<boolean> {
	const nbParticipants = tags.length;
	const batchSize = 10 >>> 0;
	const batchNumber = Math.ceil(nbParticipants / batchSize);
	let is_edit = false;

	const processTag = (tag: string, keyString: string): number => {
		if (tag.startsWith(keyString)) {
			if (is_edit === false)
			{
				playerData.remove_to_update_player();
				is_edit = true;
			}
			const amount = parseInt(tag.replace(keyString, ""));
			player.removeTag(tag);
			if (!isNaN(amount)) {
				return amount;
			}
			log(`§cError Convert Tag : ${tag} for ${player.name}`);
		}
		return 0;
	};

	for (let i = 0; i < batchNumber; i++) {
		const batchStart = i * batchSize;
		const batchEnd = batchStart + batchSize;
		const batch = batchEnd < nbParticipants ? tags.slice(batchStart, batchEnd) : tags.slice(batchStart);

		const updateDbPlayerPromises = batch.map(async (score) => {
			let amount = processTag(score, "money:");
			if (amount) {
				playerData.money += amount;
			}
			amount = processTag(score, "setmoney:");
			if (amount) {
				playerData.money = amount;
			}
			amount = processTag(score, "power:");
			if (amount) {
				playerData.power = amount;
			}
		});
		await Promise.all(updateDbPlayerPromises);
	}
	return is_edit;
}

function processTPA(playerData: Ply) {
	if (playerData.tpa !== null) {
		if (playerData.tpa.delay === 0) {
			tellraw(playerData.name, translate(playerData.lang, playerData.tpa.name, playerData.tpa.type)?.tpa_expire ?? "§cTPA Expired");
			playerData.tpa = null;
		}
		else {
			playerData.tpa.delay--;
		}
	}
}

system.runInterval(() => {
	try {
		if (isLoaded) {
			if (db_player_online.size !== 0) {
				for (const [key, p] of db_player_online) {
					p.remove_to_update_player();
					p.timePlayed += 5;
					if (p.power < db_map.powerLimit.max && p.lastPowerRegen + db_map.timeToRegenPower * 60 < p.timePlayed) {
						log("power regen for " + p.name + " : " + p.power + " -> " + (p.power + 1));
						p.power++;
						p.lastPowerRegen = p.timePlayed;
					}
					else if (p.lastPowerRegen + 1 > p.timePlayed + db_map.timeToRegenPower * 60) {
						p.lastPowerRegen = p.timePlayed;
					}
					p.add_to_update_player();
				}
			}
		}
	} catch (er) {
		if (er instanceof Error)
			log("error in runInterval : " + er.toString());
	}
}, 100)

system.runInterval(async () => {
	if (isLoaded && curTick > START_TICK) {
		const players = world.getPlayers()
		if (players.length !== 0 && db_map != undefined) {
			const start = Date.now();
			if (curTick % (db_map.refreshTick + 1) === 0) Server.runCommandAsync("title @a[tag=debug] actionbar " + Math.round(curTick / 20) + " script is now running.\n§7> RefreshTime : §s" + loadDatabase.refreshTime);
			
			//------------------------------------ warp delay
			const is_second = curTick % 20 === 0;
			if (is_second) {
				prefix = db_map.prefix;
				if (db_warp.size !== 0) {
					for (let [k, warp] of db_warp) {
						if (warp.log.length === 0) continue;
						warp.remove_to_update_warp();
						for (let i = warp.log.length - 1; i >= 0; i--) {
							const log = warp.log[i];
							if (log.delay > 1) {
								log.delay--;
							} else {
								warp.log[i] = warp.log[warp.log.length - 1];
								warp.log.pop();
							}
						}
						warp.add_to_update_warp();
					}
				}
			}

			//------------------------------------ Global Gameplay
			
			let objectiveMoney = world.scoreboard.getObjective(db_map.scoreMoney) ?? world.scoreboard.addObjective(db_map.scoreMoney, "");
			let objectiveWarn = world.scoreboard.getObjective("warn") ?? world.scoreboard.addObjective("warn", "");
			const refreshCalc = curTick % db_map.refreshTick === 0;
			let refreshCalc2 = refreshCalc ? curTick % (db_map.refreshTick * 2) === 0 : false;
			let refreshCalc3 = refreshCalc ? curTick % (db_map.refreshTick * 20) === 0 : false;
			for (const p of players) {
				let is_edit = false
				const player = db_player.get(p.name);
				if (!p || !p.isValid()) continue;
				const tags = p.getTags();
				if (player !== undefined) {
	
					if (!db_player.has(p.name)) continue;
	
					if (await processTags(p, player, tags)) {
						is_edit = true;
					}
	
					if (is_second && player.tpa !== null) {
						player.remove_to_update_player();
						processTPA(player);
						is_edit = true;
					}
				}
				if (refreshCalc) {
					let admin = db_admin.get(p.name);
					if (db_map.lockAdmin && p.hasTag(globalThis.adminTag)) {
						if (admin === undefined) {
							p.removeTag(globalThis.adminTag);
							log(`§7${p.name} had Admin tag but was not register in the Admin database.`);
						}
						else if (!p.hasTag("pswd:" + admin.passphrase)) {
							p.removeTag(globalThis.adminTag);
							log(`§7${p.name} had Admin tag, was register in the Admin database, but don't have the passphrase tag §d` + "pswd:" + admin.passphrase);
						}
					}
					if (p.hasTag("ban") && player !== undefined) {
						if (player.isunban || (admin !== undefined && p.hasTag("pswd:" + admin.passphrase))) {
							try {
								p.removeTag("ban");
							}
							finally {
								player.remove_to_update_player();
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
						let new_id = p.id;
						p.addTag("id:" + new_id);
						const ply = new Ply(p);
						Ply.add_player(ply);
						db_player_online.set(p.name, ply);
						display_rule(p, ply, true);
					}
					else if (player !== undefined) {
						let faction: Faction | undefined;

						if (db_display.size() > 0 || db_map.customName) faction = db_faction.get(player.faction_name ?? "");

						//-- display
						if (db_display.size() > 0) {
							let display_list: Display[] = [];
							tags.forEach((tag) => { display_list.concat(db_display.get(tag)); });
							if (display_list[0] !== undefined || display_list[1] !== undefined) {
								const Fname = faction?.name ?? "none";
								const Frank = faction?.playerList.find((pla) => pla.name === player.name)?.permission.toString() ?? "none";
								const Fcount = faction === undefined ? "none" : faction.playerList.length + "/" + faction?.memberLimit;
								const Fbank = faction?.bank.toString() ?? "0";
								const date = new Date(new Date().getTime() + player.UTC * 3600000); // 60 * 60 * 1000
								const localTime = formatCreationDayTime(date.getTime())

								const coordX = Math.floor(p.location.x);
								const coordY = Math.floor(p.location.y);
								const coordZ = Math.floor(p.location.z);
								const chunkX = (coordX >> 4).toFixed(0);
								const chunkZ = (coordZ >> 4).toFixed(0);
								const chunk = db_chunk?.get(chunkX + "," + chunkZ + p.dimension.id)?.faction_name ?? "none";
								const timePlayed = Math.floor(player.timePlayed / 3600) + "h" + Math.floor((player.timePlayed % 3600) / 60) + "m" + (player.timePlayed % 60) + "s";

								for (const display of display_list) {
									if (display === undefined) continue;
									try {
										const formated_display = display.text.replace(/<([^>]+)>/g, (match, key) => {
											switch (key) {
												case "faction": return Fname;
												case "player": return player.name;
												case "x": return coordX.toString();
												case "y": return coordY.toString();
												case "z": return coordZ.toString();
												case "money": return player.money.toString();
												case "warn": return player.warn.toString();
												case "Frank": return Frank;
												case "memberCount": return Fcount;
												case "Fbank": return Fbank;
												case "Fcount": return Fcount;
												case "Xchunk": return chunkX;
												case "Zchunk": return chunkZ;
												case "chunk": return chunk;
												case "online": return players.length.toString();
												case "allPlayer": return db_player.size.toString();
												case "version": return version;
												case "prefix": return prefix;
												case "time": return localTime;
												case "timeS": return localTime + ":" + addDateZ(date.getSeconds());
												case "timePlayed": return timePlayed;
												case "day": return addDateZ(date.getDate());
												case "month": return addDateZ(date.getMonth() + 1);
												case "year": return date.getFullYear().toString();
												case "power": return player.power.toString();
												case "killCount": return player.killCount.toString();
												case "deathCount": return player.deathCount.toString();
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
										if (er instanceof Error)
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
								const rankSeparator = (text: string) => { return "§7[" + text + "§7]§r"; };
								let rank = findTagsStartWithV2(p, "role:", tags).map(tag => rankSeparator(tag.replace("role:", ""))).join("\n");
								let colorN = findFirstTagStartWith(p, "colorName:", tags)?.replace("colorName:", "") ?? "§r";
								nameTag = colorN + nameTag + "§r";

								if (rank && db_map.showRole) nameTag = rank + "\n" + nameTag;

								if (faction) {
									nameTag = `${faction.color + faction.separator[0] + faction.name + faction.separator[1]}\n${nameTag}`;
								}

								if (db_map.showHeart) nameTag = nameTag + "\n§r§4§l§o" + (p.getComponent("minecraft:health") as EntityHealthComponent)?.currentValue.toFixed(1) + "§r§c§l ❤§r";

								if (nameTag !== p.nameTag) {
									player.remove_to_update_player();
									player.nameTag = nameTag;
									is_edit = true;
									p.nameTag = nameTag;
								}
							}
							else if (p.name !== p.nameTag) {
								player.remove_to_update_player();
								player.nameTag = p.name;
								is_edit = true;
								p.nameTag = nameTag;
							}
							if (refreshCalc3)
							{
								let delay = db_delay.get(player.name);
								if (delay !== undefined) {
									if (delay.check_time()) tellraw(player.name, "§7You aren't in combat anymore");
								}
							}
						}
					}
				}
				if (is_edit) player?.add_to_update_player(); // Add player to update queue if edited
				if (curTick % 200 === 0) {
					if (db_admin.size == 0 && db_map.lockAdmin == true) {
						log("§7admin database is lock but nobody is inside ? unlocking it");
						Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database");
						db_map.lockAdmin = false;
						Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(db_map)) + ")\" database 1");
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

system.runInterval(() => {
	try {
		if (isLoaded) {
			if (db_player_online.size !== 0) {
				for (const [key, p] of db_player_online) {
					p.remove_to_update_player();
					p.timePlayed += 5;
					if (p.power < db_map.powerLimit.max && p.lastPowerRegen + db_map.timeToRegenPower * 60 < p.timePlayed) {
						log("power regen for " + p.name + " : " + p.power + " -> " + (p.power + 1));
						p.power++;
						p.lastPowerRegen = p.timePlayed;
					}
					else if (p.lastPowerRegen + 1 > p.timePlayed + db_map.timeToRegenPower * 60) {
						p.lastPowerRegen = p.timePlayed;
					}
					p.add_to_update_player();
				}
			}
		}
	} catch (er) {
		if (er instanceof Error)
			log("error in runInterval : " + er.toString());
	}
}, 100)