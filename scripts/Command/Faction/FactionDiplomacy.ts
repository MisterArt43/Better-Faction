import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { DB } from "../../Object/database/database";
import { Faction, factionRank } from "../../Object/faction/Faction";
import { translate } from "../../lang";
import { sleep, tellraw } from "../../Object/tool/tools";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { UI_find_faction } from "../../Object/tool/find_factions_UI";
import { addSubCommand, cmd_permission } from "../CommandManager";
import { cmd_module } from "../../Object/database/db_map";

addSubCommand(
	"diplomacy",
	"set your relation with other faction (ally, enemy)\n §7You can't have more than 10 relation",
	`${globalThis.prefix}faction diplomacy`,
	["ally", "enemy", "diplomacy"],
	cmd_module.faction,
	cmd_permission.member,
	true,
	true,
	FactionAlly,
	[["f", "faction"]]
)

function FactionAlly(args: string[], player: Player, ply: Ply) {
	const fac = DB.db_faction.get(ply.faction_name ?? "");

	if (!fac) return tellraw(player, translate(ply.lang)?.error_no_faction ?? "no translation");
	if (fac.playerList.some((p) => p.name === player.name && p.permission == factionRank.Leader)) return tellraw(player, translate(ply.lang)?.error_faction_leader_permission ?? "no translation");
	
	FactionDiplomacyUI(player, ply, fac);
}

async function FactionDiplomacyUI(player: Player, ply: Ply, fac: Faction) {
	new ActionFormData()
		.title("Diplomacy")
		.button("Ally")
		.button("Enemy")
		.button("Quit")
		.show(player).then(res => {
			if (res.canceled) return;
			if (res.selection === 0) return FActionDiplomacyMode(player, ply, fac, "ally");
			if (res.selection === 1) return FActionDiplomacyMode(player, ply, fac, "enemy");
		})
}

async function FActionDiplomacyMode(player: Player, ply: Ply, fac: Faction, type: "ally" | "enemy") {
	const res = await new ActionFormData()
		.title("Diplomacy " + type)
		.button("add")
		.button("list")
		.show(player);
	
	if (res.canceled) return FactionDiplomacyUI(player, ply, fac);
	if (!DB.db_faction.has(fac.name)) return tellraw(player, translate(ply.lang)?.error_find_faction ?? "no translation");
	
	if (res.selection === 0) {
		FactionDiplomacyAddUI(player, ply, fac, type);
	}
	if (res.selection === 1) {
		FactionDiplomacyListUI(player, ply, fac, [...fac.ally], type);
	}
}

async function FactionDiplomacyAddUI(player: Player, ply: Ply, fac: Faction, type: "ally" | "enemy") {
	const targetFac = await UI_find_faction(player);

	if (!targetFac) return FActionDiplomacyMode(player, ply, fac, type);
	if (!DB.db_faction.has(fac.name)) return tellraw(player, translate(ply.lang)?.error_find_faction ?? "no translation");
	
	if (fac.ally.length >= 10) return tellraw(player.name, "You can't have more than 10 ally");
	fac.remove_to_update_faction();
	if (type === "ally") fac.ally.push(targetFac.name);
	else fac.enemy.push(targetFac.name);
	fac.add_to_update_faction();
	FactionDiplomacyUI(player, ply, fac);
}

async function FactionDiplomacyListUI(player: Player, ply: Ply, fac: Faction, list: string[], type: "ally" | "enemy") {
	let form = new ModalFormData()
		.title("Diplomacy " + type)
	let i = 0;
	for (let ally of list) {
		form.toggle(ally, true);
		if (i++ % 50 === 0) await sleep(1);
	}

	const res2 = await form.show(player)
	if (res2.canceled) return FActionDiplomacyMode(player, ply, fac, type);
	if (!DB.db_faction.has(fac.name)) return tellraw(player, translate(ply.lang)?.error_find_faction ?? "no translation");

	if (res2.formValues!.every((v) => v === true)) return FActionDiplomacyMode(player, ply, fac, type);

	fac.remove_to_update_faction();
	i = 0;
	if (type === "ally") {
		for (let ally of list) {
			if (!res2.formValues![i++]) fac.ally.splice(fac.ally.indexOf(ally), 1);
			if (i++ % 50 === 0) await sleep(1);
		}
	}
	else {
		for (let enemy of list) {
			if (!res2.formValues![i++]) fac.enemy.splice(fac.enemy.indexOf(enemy), 1);
			if (i++ % 50 === 0) await sleep(1);
		}
	}
	fac.add_to_update_faction();

	tellraw(player.name, "§e" + type + " updated");
	FactionDiplomacyUI(player, ply, fac);
}