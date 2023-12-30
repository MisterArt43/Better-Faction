import { Player, system, world } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { DB } from "../../Object/database/database";
import { log, sleep } from "../../Object/tool/tools";
import { ActionFormData, FormCancelationReason, ModalFormData } from "@minecraft/server-ui";
import { displayTypes } from "../../Object/display/Display";
import { addSubCommand, cmd_permission } from "../CommandManager";
import { cmd_module } from "../../Object/database/db_map";
import { formatCreationDayTime } from "../../Object/tool/dateTools";

addSubCommand(
	"rule",
	"show the rule of the server",
	`${prefix}rule`,
	["rule"],
	cmd_module.rule,
	cmd_permission.member,
	true,
	false,
	rule
);

function rule(args: string[], player: Player, ply: Ply) {
	display_rule(player, ply, false);
}

export async function display_rule(player: Player, ply: Ply, isNewPlayer: boolean) {
	if (DB.db_display.db_display_rule === null) return;
	const faction = DB.db_faction.get(ply.faction_name ?? "");

	const Fname = faction?.name ?? "none";
	const Frank = faction?.playerList.find((pla) => pla.name === ply.name)?.permission.toString() ?? "none";
	const Fcount = faction === undefined ? "none" : faction.playerList.length + "/" + faction?.memberLimit;
	const Fbank = faction?.bank.toString() ?? "0";

	const date = new Date(new Date().getTime() + ply.UTC * 3600000); // 60 * 60 * 1000
	const localTime = formatCreationDayTime(date.getTime())

	const coordX = Math.floor(player.location.x);
	const coordY = Math.floor(player.location.y);
	const coordZ = Math.floor(player.location.z);
	const chunkX = (coordX >> 4).toFixed(0);
	const chunkZ = (coordZ >> 4).toFixed(0);
	const chunk = DB.db_chunk?.get(chunkX + "," + chunkZ + player.dimension.id)?.faction_name ?? "none";

	const onlinePlCount = world.getAllPlayers().length;

	await sleep(1);
	let formated_display = DB.db_display.db_display_rule.text.replace(/<([^>]+)>/g, (match, key) => {
		switch (key) {
			case "faction": return Fname;
			case "player": return ply.name;
			case "x": return coordX.toString();
			case "y": return coordY.toString();
			case "z": return coordZ.toString();
			case "money": return ply.money.toString();
			case "warn": return ply.warn.toString();
			case "Frank": return Frank;
			case "memberCount": return Fcount;
			case "Fbank": return Fbank;
			case "Fcount": return Fcount;
			case "Xchunk": return chunkX;
			case "Zchunk": return chunkZ;
			case "chunk": return chunk;
			case "online": return onlinePlCount.toString();
			case "allPlayer": return DB.db_player.size.toString();
			case "version": return version;
			case "prefix": return prefix;
			case "time": return localTime;
			case "timeS": return localTime + ":" + addDateZ(date.getSeconds());
			case "day": return addDateZ(date.getDate());
			case "month": return addDateZ(date.getMonth() + 1);
			case "year": return date.getFullYear().toString();
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
		.title(displayTypes.rule)
		.button("close")
	const form2 = new ModalFormData()
		.title("Enter the Code that was in The Rule")
		.textField("Code", "enter the code here")
	const interval = system.runInterval(async () => {
		try {
			if (hasRead) { system.clearRun(interval); log("§a" + ply.name + " has read the rule"); return; }
			else if (test === false) {
				let code = "";
				if (DB.db_map.ruleCode.isRuleCode) code = DB.db_map.ruleCode.code;
				if (DB.db_map.ruleCode.isAutoGen) code = generateRandomCode(5);
				if (code === undefined) code = "none";
				form.body(formated_display.replace(/\<code\>/g, "§r" + code))
				const res = await form.show(player)
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
				if (DB.db_map.ruleCode.isRuleCode) {
					const res1 = await form2.show(player)
					if (res1.canceled) return;
					if (res1.formValues?.[0] === code) {
						hasRead = true;
					}
					else {
						form.title("§c§lWrong Code");
						test = false;
					}
				}
				else {
					hasRead = true;
					system.clearRun(interval);
				}
			}
			else test = false;
		} catch (error) {
			log(error.toString());
		}
	}, 30);
}

function generateRandomCode(length: number): string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let code = "";

	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * charset.length);
		code += charset[randomIndex];
	}
	return code;
}