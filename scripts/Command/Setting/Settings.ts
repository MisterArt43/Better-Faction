import { Player, system } from "@minecraft/server";
import { DB } from "../../Object/database/database";
import { BFModalFormData } from "../../Object/formQueue/formQueue";
import { Ply } from "../../Object/player/Ply";
import { log, Server, sleep, tellraw, textToHex } from "../../Object/tool/tools";
import { addSubCommand } from "../CommandManager";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";

addSubCommand(
	"prefix",
	"Set the command prefix. Default is +",
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
	"Set the chat prefix. Default is §r•>, exemple: UserName §r•> Hello",
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
	"Set the faction separator. Default is §r••, exemple: §6•FactionName•§r UserName §r•> Hello",
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
	"Set the custom name. Default is true",
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
	"Set the delay after a player take a damage (can be used for pvp, pve, tpa). Default is " + DB.db_map.tpaDelay + " for tpa, " + DB.db_map.playerHurtDelay + " for pvp, " + DB.db_map.randomHurtDelay + " for pve",
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
	"Set the refresh tick. Default is " + DB.db_map.refreshTick,
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
	"Set the home limit. Default is " + DB.db_map.homeLimit,
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