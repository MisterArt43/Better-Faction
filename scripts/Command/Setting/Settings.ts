import { Player, system } from "@minecraft/server";
import { DB } from "../../Object/database/database";
import { BFModalFormData } from "../../Object/formQueue/formQueue";
import { Ply } from "../../Object/player/Ply";
import { log, Server, sleep, tellraw, textToHex } from "../../Object/tool/tools";
import { addSubCommand } from "../CommandManager";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";

addSubCommand(
	"prefix",
	"Set the command prefix. Current is +",
	`${globalThis.prefix}set prefix`,
	["prefix"],
	cmd_module.commoncommand,
	cmd_permission.admin,
	true,
	true,
	set_command_prefix_ui,
	[["set", "setting"]]
)

function set_command_prefix_ui(args: string[], player: Player, ply: Ply) {
	const form = new BFModalFormData();

	form.title("Command Prefix")
		.textField("§cYou can't use \"/\" as a Prefix\n§ePrefix", DB.db_map.prefix, DB.db_map.prefix)
	form.show(player).then(async res => {
		if (res.canceled || res.formValues && (res.formValues[0] == "/" || res.formValues[0] == DB.db_map.prefix)) return;

		await Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database");
		DB.db_map.prefix = res.formValues![0] as string;
		await Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database 1");

		tellraw(ply.name, "§eNew Command Prefix: " + DB.db_map.prefix);
	});
}

addSubCommand(
	"chatprefix",
	"Set the chat prefix. Current is §r•>, exemple: UserName §r•> Hello",
	`${globalThis.prefix}set chatprefix`,
	["chatprefix"],
	cmd_module.commoncommand,
	cmd_permission.admin,
	true,
	true,
	set_chat_prefix_ui,
	[["set", "setting"]]
)

function set_chat_prefix_ui(args: string[], player: Player, ply: Ply) {
	const form = new BFModalFormData();
		form.title("Chat Prefix")
			.textField("§ePrefix", DB.db_map.chatPrefix, DB.db_map.chatPrefix)
		form.show(player).then(async res => {
			if (res.canceled || res.formValues![0] == DB.db_map.chatPrefix) return;
			await Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database");
			DB.db_map.chatPrefix = res.formValues![0] as string;
			await Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Chat Prefix: " + DB.db_map.chatPrefix);
		});
}

addSubCommand(
	"factionseparator",
	"Set the faction separator. Current is §r••, exemple: §6•FactionName•§r UserName §r•> Hello",
	`${globalThis.prefix}set factionseparator`,
	["factionseparator", "fseparator", "fsep"],
	cmd_module.commoncommand,
	cmd_permission.admin,
	true,
	true,
	set_faction_separator_ui,
	[["set", "setting"]]
)

function set_faction_separator_ui(args: string[], player: Player, ply: Ply) {
	const form = new BFModalFormData();
		form.title("Faction Separator")
		.textField("§eSeparator", DB.db_map.factionSeparator, DB.db_map.factionSeparator)
		.toggle("§eApply to all faction", false)
		form.show(player).then(async res => {
			if (res.canceled || (res.formValues![0] == DB.db_map.factionSeparator) && !res.formValues![1]) return;
			if ((res.formValues![0] as string).length > 2) return tellraw(player.name, "§cSeparator must be 2 character long.");
			await Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database");
			DB.db_map.factionSeparator = res.formValues![0] as string;
			await Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Faction Separator: " + DB.db_map.factionSeparator);
			if (res.formValues![1]) {
				let i = 0;
				DB.db_faction.forEach(async faction => {
					if (faction.separator != res.formValues![0]) {
						faction.remove_to_update_faction();
						faction.separator = res.formValues![0] as string;
						faction.add_to_update_faction();
						log("§e" + faction.name + " edited.");
					}
					if (i++ % 20 == 0) await sleep(1);
				});
			}
		});
}

addSubCommand(
	"customname",
	"Set the custom name. Current is true",
	`${globalThis.prefix}set customname`,
	["customname", "cname"],
	cmd_module.commoncommand,
	cmd_permission.admin,
	true,
	true,
	set_custom_name_ui,
	[["set", "setting"]]
)

function set_custom_name_ui(args: string[], player: Player, ply: Ply) {
	const form = new BFModalFormData();
		form.title("Custom Name")
		.toggle("§eCustom Name", DB.db_map.customName)
		.toggle("§eShow Heart", DB.db_map.showHeart)
		.toggle("§eShow Role", DB.db_map.showRole)
		form.show(player).then(async res => {
			if (res.canceled || res.formValues![0] == DB.db_map.customName && res.formValues![1] == DB.db_map.showHeart && res.formValues![2] == DB.db_map.showRole) return;
			await Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database");
			DB.db_map.customName = res.formValues![0] as boolean;
			DB.db_map.showHeart = res.formValues![1] as boolean;
			DB.db_map.showRole = res.formValues![2] as boolean;
			await Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Custom Name: " + DB.db_map.customName.toString() + " \nHeart : " + DB.db_map.showHeart.toString() + " \nRole : " + DB.db_map.showRole.toString());
		});
}

addSubCommand(
	"delay",
	"Set the delay after a player take a damage (can be used for pvp, pve, tpa). Current is " + DB.db_map.tpaDelay + " for tpa, " + DB.db_map.playerHurtDelay + " for pvp, " + DB.db_map.randomHurtDelay + " for pve",
	`${globalThis.prefix}set delay`,
	["delay"],
	cmd_module.commoncommand,
	cmd_permission.admin,
	true,
	true,
	set_all_delay_ui,
	[["set", "setting"]]
)

function set_all_delay_ui(args: string[], player: Player, ply: Ply) {
	const form = new BFModalFormData();
		form.title("Tpa Delay")
		.textField("§eTpa Delay", DB.db_map.tpaDelay.toString(), DB.db_map.tpaDelay.toString())
		.textField("§ePvP Delay", DB.db_map.playerHurtDelay.toString(), DB.db_map.playerHurtDelay.toString())
		.textField("§ePvE Delay", DB.db_map.randomHurtDelay.toString(), DB.db_map.randomHurtDelay.toString())
		form.show(player).then(async res => {
			if (res.canceled || 
				(res.formValues![0] as string).match(/[0-9]/g) === null || 
				(res.formValues![1] as string).match(/[0-9]/g) === null || 
				(res.formValues![2] as string).match(/[0-9]/g) === null || 
				(parseInt(res.formValues![0] as string) === DB.db_map.tpaDelay && 
				parseInt(res.formValues![1] as string) === DB.db_map.playerHurtDelay && 
				parseInt(res.formValues![2] as string) === DB.db_map.randomHurtDelay)) return;
			await Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database");
			DB.db_map.tpaDelay = parseInt((res.formValues![0] as string));
			DB.db_map.playerHurtDelay = parseInt((res.formValues![1] as string));
			DB.db_map.randomHurtDelay = parseInt((res.formValues![2] as string));
			await Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Delay: \n§eTpa = " + DB.db_map.tpaDelay + "\n§ePvP = " + DB.db_map.playerHurtDelay + "\n§ePvE = " + DB.db_map.randomHurtDelay);
		});
}

addSubCommand(
	"refresh_tick",
	"Set the refresh tick. Current is " + DB.db_map.refreshTick,
	`${globalThis.prefix}set refresh_tick`,
	["refresh_tick", "rt"],
	cmd_module.commoncommand,
	cmd_permission.admin,
	true,
	true,
	set_refresh_tick_ui,
	[["set", "setting"]]
)

function set_refresh_tick_ui(args: string[], player: Player, ply: Ply) {
	const form = new BFModalFormData();
		form.title("Refresh Tick")
		.slider("§eRefresh Tick", 1, 40, 1, DB.db_map.refreshTick)
		form.show(player).then(async res => {
			if (res.canceled || res.formValues![0] == DB.db_map.refreshTick) return;
			await Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database");
			DB.db_map.refreshTick = res.formValues![0] as number;
			await Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Refresh Tick: " + DB.db_map.refreshTick);
		});
}

addSubCommand(
	"home_limit",
	"Set the home limit. Current is " + DB.db_map.homeLimit,
	`${globalThis.prefix}set home_limit`,
	["home_limit", "homelimit", "hl"],
	cmd_module.commoncommand,
	cmd_permission.admin,
	true,
	true,
	set_home_limit_ui,
	[["set", "setting"]]
)

function set_home_limit_ui(args: string[], player: Player, ply: Ply) {
	const form = new BFModalFormData();
		form.title("Home Limit")
		.textField("§eLimit", DB.db_map.homeLimit.toString(), DB.db_map.homeLimit.toString())
		.toggle("§eApply to all player", false)
		form.show(player).then(async res => {
			if (res.canceled ||( res.formValues![0] as string).match(/[0-9]/g) == null || (res.formValues![0] == DB.db_map.homeLimit && !res.formValues![1])) return;
			await Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database");
			DB.db_map.homeLimit = parseInt(res.formValues![0] as string);
			await Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Home Limit: " + DB.db_map.homeLimit);
			if (res.formValues![1]) {
				const nb = parseInt(res.formValues![0] as string);
				system.run(async () => {
					let index = 0;
					for (const player of Array.from(DB.db_player.values())) {
						if (player.homeLimit != nb) {
							player.remove_to_update_player();
							player.homeLimit = nb;
							player.add_to_update_player();
						}
						if (index % 10 === 0) {
							await Server.runCommandAsync(`title @a[tag=log] actionbar §eEditing Player Database Progression : §a${Math.floor(index / DB.db_player.size * 100)}%`);
							await sleep(2);
						}
						index++;
					}
				})
			}
		});
}

addSubCommand(
	"faction_member_limit",
	"Set the faction member limit. Current is " + DB.db_map.factionMemberLimit,
	`${globalThis.prefix}set faction_member_limit`,
	["faction_member_limit", "fml"],
	cmd_module.commoncommand,
	cmd_permission.admin,
	true,
	true,
	set_faction_member_limit_ui,
	[["set", "setting"]]
)

function set_faction_member_limit_ui(args: string[], player: Player, ply: Ply) {
	const form = new BFModalFormData();
		form.title("Member Faction Limit")
		.textField("§eLimit", DB.db_map.factionMemberLimit.toString(), DB.db_map.factionMemberLimit.toString())
		.toggle("§eApply to all faction", false)
		form.show(player).then(async res => {
			if (res.canceled || (res.formValues![0] as string).match(/[0-9]/g) == null || res.formValues![0] == DB.db_map.factionMemberLimit && !res.formValues![1]) return;
			await Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database");
			DB.db_map.factionMemberLimit = parseInt(res.formValues![0] as string);
			await Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Member Faction Limit: " + DB.db_map.factionMemberLimit);
			if (res.formValues![1]) {
				let i = 0;
				DB.db_faction.forEach(async faction => {
					if (faction.memberLimit != res.formValues![0]) {
						faction.remove_to_update_faction();
						faction.memberLimit = parseInt(res.formValues![0] as string);
						faction.add_to_update_faction();
						log("§e" + faction.name + " edited.");
					}
					if (i++ % 20 == 0) await sleep(1);
				});
			}
		});
}

addSubCommand(
	"faction_home",
	"Set the faction home. Current is " + DB.db_map.isFhome,
	`${globalThis.prefix}set faction_home`,
	["faction_home", "fhome"],
	cmd_module.commoncommand,
	cmd_permission.admin,
	true,
	true,
	set_faction_home_ui,
	[["set", "setting"]]
)

function set_faction_home_ui(args: string[], player: Player, ply: Ply) {
	const form = new BFModalFormData();
		form.title("Allow Faction Home")
		.toggle("§eAllow Faction Home", DB.db_map.isFhome)
		.toggle("§eApply to all faction", false)
		.show(player).then(async res => {
			if (res.canceled || (res.formValues![0] as boolean) == DB.db_map.isFhome && !(res.formValues![1] as boolean)) return;
			await Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database");
			DB.db_map.isFhome = res.formValues![0] as boolean;
			await Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Allow Faction Home: " + DB.db_map.isFhome);
			if (res.formValues![1]) {
				let i = 0;
				DB.db_faction.forEach(async faction => {
					if (faction.isFhome != res.formValues![0]) {
						faction.remove_to_update_faction();
						faction.isFhome = res.formValues![0] as boolean;
						faction.add_to_update_faction();
						log("§e" + faction.name + " edited.");
					}
					if (i++ % 20 == 0) await sleep(1);
				});
			}
		});
}

addSubCommand(
	"set_utc",
	"Set the UTC. Current is " + DB.db_map.UTC,
	`${globalThis.prefix}set utc`,
	["set_utc", "utc"],
	cmd_module.commoncommand,
	cmd_permission.admin,
	true,
	true,
	set_UTC_ui,
	[["set", "setting"]]
)

function set_UTC_ui(args: string[], player: Player, ply: Ply) {
	const form = new BFModalFormData();
		form.title("UTC / Timezone")
		.slider("§eUTC", -12, 12, 1, DB.db_map.UTC)
		form.show(player).then(async res => {
			if (res.canceled || res.formValues![0] == DB.db_map.UTC) return;
			await Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database");
			DB.db_map.UTC = res.formValues![0] as number;
			await Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew UTC: " + DB.db_map.UTC);
		});
}


addSubCommand(
	"set_faction_color",
	"Set the faction color. Current is " + DB.db_map.factionColor,
	`${globalThis.prefix}set faction_color`,
	["set_faction_color", "fcolor"],
	cmd_module.commoncommand,
	cmd_permission.admin,
	true,
	true,
	set_faction_color,
	[["set", "setting"]]
)

function set_faction_color(args: string[], player: Player, ply: Ply) {
	const form = new BFModalFormData();
		form.title("Faction Color")
		.textField("§eColor", DB.db_map.factionColor, DB.db_map.factionColor)
		.toggle("§eApply to all faction", false)
		form.show(player).then(async res => {
			if (res.canceled || res.formValues![0] == DB.db_map.factionColor && !res.formValues![1]) return;
			if (!(res.formValues![0] as string).match(/^.*§[a-u0-9]+.*$/)) return tellraw(player.name, "§cThe Text can only contain color code. exemple : §a§l§o");
			await Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database");
			DB.db_map.factionColor = res.formValues![0] as string;
			await Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Faction Color: " + DB.db_map.factionColor);
			if (res.formValues![1]) {
				let i = 0;
				DB.db_faction.forEach(async faction => {
					if (faction.color != res.formValues![0]) {
						faction.remove_to_update_faction();
						faction.color = res.formValues![0] as string;
						faction.add_to_update_faction();
						log("§e" + faction.name + " edited.");
					}
					if (i++ % 20 == 0) await sleep(1);
				});
			}
		});
}


addSubCommand(
	"set_score_money",
	"Set the money scoreboard. Current is " + DB.db_map.scoreMoney,
	`${globalThis.prefix}set score_money`,
	["set_score_money", "smoney"],
	cmd_module.commoncommand,
	cmd_permission.admin,
	true,
	true,
	set_score_money_ui,
	[["set", "setting"]]
)

function set_score_money_ui(args: string[], player: Player, ply: Ply) {
	const form = new BFModalFormData();
		form.title("Score Money")
		.textField("§eScore Money", DB.db_map.scoreMoney, DB.db_map.scoreMoney)
		form.show(player).then(async res => {
			if (res.canceled || res.formValues![0] == DB.db_map.scoreMoney) return;
			await Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database");
			DB.db_map.scoreMoney = res.formValues![0] as string;
			await Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database 1");
			tellraw(ply.name, "§eNew Score Money: " + DB.db_map.scoreMoney);
		});
}


addSubCommand(
	"set_rule_code",
	"Set the rule code. Current is " + DB.db_map.ruleCode.code,
	`${globalThis.prefix}set rule_code`,
	["set_rule_code", "src"],
	cmd_module.commoncommand,
	cmd_permission.admin,
	true,
	true,
	set_rule_code,
	[["set", "setting"]]
)

function set_rule_code(args: string[], player: Player, ply: Ply) {
	const form = new BFModalFormData();
		form.title("Rule Code")
		.toggle("§eRule Code", DB.db_map.ruleCode.isRuleCode)
		.toggle("Generate random code", DB.db_map.ruleCode.isAutoGen)
		.textField("§eCode", DB.db_map.ruleCode.code, DB.db_map.ruleCode.code)
		form.show(player).then(async res => {
			if (res.canceled || (
				res.formValues![0] == DB.db_map.ruleCode.isRuleCode && 
				res.formValues![1] == DB.db_map.ruleCode.isAutoGen && 
				res.formValues![2] == DB.db_map.ruleCode.code
				)) return;
				const display = DB.db_display.db_display_rule;
				if (res.formValues![0] && (display === null || !display.text.includes("<code>"))) {
					return tellraw(player.name, "§cYou need to add <code> in the rule display to use this function.");
				}
			await Server.runCommandAsync("scoreboard players reset \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database");
			DB.db_map.ruleCode.isRuleCode = res.formValues![0] as boolean;
			DB.db_map.ruleCode.isAutoGen = res.formValues![1] as boolean;
			DB.db_map.ruleCode.code = (res.formValues![2] as string).trim();
			await Server.runCommandAsync("scoreboard players set \"$db_map(" + textToHex(JSON.stringify(DB.db_map)) + ")\" database 1");
			tellraw(ply.name, "§eIs Rule Code: " + DB.db_map.ruleCode.isRuleCode.toString() + "\n §eis Auto Generate: " + DB.db_map.ruleCode.isAutoGen.toString() + "\n §eNew Code: '" + DB.db_map.ruleCode.code + "'");
		});
}


