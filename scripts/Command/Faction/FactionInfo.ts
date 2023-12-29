import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { DB } from "../../Object/database/database";
import { addDateZ, concatFacName, tellraw } from "../../Object/tool/tools";
import { translate } from "../../lang";
import { Faction, factionRank } from "../../Object/faction/Faction";
import { ActionFormData } from "@minecraft/server-ui";


function Finfo(args: string[], player: Player, ply: Ply) {
	if (args.length === 2) {
		const fac = DB.db_faction.get(ply.faction_name ?? "");
		if (fac === undefined) {
			tellraw(player.name, translate(ply.lang)?.error_faction_info ?? "no translation");
		}
		else {
			const date = new Date(fac.creationDate + ply.UTC * 3600000);
			tellraw(player.name, translate(ply.lang, fac.name, fac.description, date.getDay() + "/" + ((date.getMonth() + 1) + "/" + date.getFullYear() + " : " + addDateZ(date.getHours()) + "h" + addDateZ(date.getMinutes())), fac.playerList.length, fac.memberLimit, fac.bank, fac.power)?.faction_info ?? "no translation");
		}
	}
	else {
		const name = concatFacName(args, 2);
		const fac = DB.db_faction.get(name);
		if (fac === undefined) {
			tellraw(player.name, translate(ply.lang)?.error_faction_info ?? "no translation");
		}
		else {
			const date = new Date(fac.creationDate + ply.UTC * 3600000);
			tellraw(player.name, translate(ply.lang, fac.name, fac.description, date.getDay() + "/" + ((date.getMonth() + 1) + "/" + date.getFullYear() + " : " + addDateZ(date.getHours()) + "h" + addDateZ(date.getMinutes())), fac.playerList.length, fac.memberLimit, fac.bank, fac.power)?.faction_info ?? "no translation");
		}
	}
}

async function FactionInfoUI(player: Player, ply: Ply) {
	if (ply.faction_name !== null) {
		const form = new ActionFormData()
		.title("Choose Mode")
		.button("Your faction")
		.button("Other faction")

		const res = await form.show(player);
		if (res.canceled) return;
		switch (res.selection) {
			case 0: Finfo(["f", "info"], player, ply); break;
			case 1: Finfo(["f", "info"], player, ply); break;
		}
	}
}

async function PlayerFactionInfoUI(player: Player, ply: Ply) {
	const fac = DB.db_faction.get(ply.faction_name ?? "");
	if (!fac)
		return tellraw(player.name, translate(ply.lang)?.error_faction_info ?? "no translation");

	const date = new Date(fac.creationDate + ply.UTC * 3600000);
	let message = "§eFaction Info :§r";
	message += "\n -Name : " + fac.color + fac.name + "§r";
	message += "\n -Description : " + fac.description;
	message += "\n -Creation Date : " + date.getDay() + "/" + ((date.getMonth() + 1) + "/" + date.getFullYear() + " : " + addDateZ(date.getHours()) + "h" + addDateZ(date.getMinutes()));
	message += "\n -number of members : " + fac.playerList.length + "/" + fac.memberLimit;
	message += "\n -Bank : " + fac.bank;
	message += "\n -Power : " + fac.power;
	message += "\n -Claim : " + fac.claim.length;
	message += "\n\n§eMembers :§r";
	for (const p of fac.playerList) {
		message += "\n -" + p.name + " : " + Object.keys(factionRank)[p.permission];
	}
	message += "\n\n§eAlly :§r";
	for (const a of fac.ally) {
		message += "\n -" + a;
	}
	message += "\n\n§eEnemy :§r";
	for (const e of fac.enemy) {
		message += "\n -" + e;
	}
	

	const form = new ActionFormData()
		.title("Faction Info")
		.body()
}