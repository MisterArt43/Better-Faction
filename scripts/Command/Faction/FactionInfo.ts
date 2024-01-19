import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { DB } from "../../Object/database/database";
import { concatFacName, tellraw } from "../../Object/tool/tools";
import { translate } from "../../lang";
import { Faction, factionRank } from "../../Object/faction/Faction";
import { ActionFormData } from "@minecraft/server-ui";
import { addDateZ, formatCreationFullDate } from "../../Object/tool/dateTools";
import { UI_find_faction } from "../../Object/tool/find_factions_UI";
import { addSubCommand, cmd_permission } from "../CommandManager";
import { cmd_module } from "../../Object/database/db_map";

addSubCommand(
	"info",
	"give info about a faction",
	`${globalThis.prefix}faction info <faction>`,
	["info", "i"],
	cmd_module.faction,
	cmd_permission.member,
	true,
	true,
	FactionInfo,
	[["faction", "f"]]
)

// ---------------------------------- //
//           FACTION INFO             //
// ---------------------------------- //

function FactionInfo(args: string[], player: Player, ply: Ply) {
	if (args.length === 2) {
		FactionInfoUI(player, ply);
	}
	else {
		FactioninfoCmd(args, player, ply);
	}
}

// ---------------------------------- //
// -------- COMMAND FUNCTIONS ------- //
// ---------------------------------- //

function FactioninfoCmd(args: string[], player: Player, ply: Ply) {
	const MILLISECONDS_IN_AN_HOUR = 3600000;
	const name = concatFacName(args, 2);
	const fac = DB.db_faction.get(name);

	if (fac === undefined) {
		tellraw(player, translate(ply.lang)?.error_faction_info ?? "no translation");
	}
	else {
		const date = new Date(fac.creationDate + ply.UTC * MILLISECONDS_IN_AN_HOUR);
		tellraw(player, translate(ply.lang, fac.name, fac.description, date.getDay() + "/" + ((date.getMonth() + 1) + "/" + date.getFullYear() + " : " + addDateZ(date.getHours()) + "h" + addDateZ(date.getMinutes())), fac.playerList.length, fac.memberLimit, fac.bank, fac.power)?.faction_info ?? "no translation");
	}
}

// ---------------------------------- //
// -------------- UI ---------------- //
// ---------------------------------- //

async function FactionInfoUI(player: Player, ply: Ply) {
	if (ply.faction_name !== null) {
		const form = new ActionFormData()
		.title("Choose Mode")
		.button("Your faction")
		.button("Other faction")

		const res = await form.show(player);
		if (res.canceled) return;
		switch (res.selection) {
			case 0: PlayerFactionInfoUI(player, ply); break;
			case 1: ChooseFactionUI(player, ply); break;
		}
	}
}

async function ChooseFactionUI(player: Player, ply: Ply) {
	const faction = await UI_find_faction(player);
	if (!faction) return;
	PlayerFactionInfoUI(player, ply, faction);
}

async function PlayerFactionInfoUI(player: Player, ply: Ply, faction?: Faction) {
	const fac = faction ? faction : DB.db_faction.get(ply.faction_name ?? "");
	if (!fac)
		return tellraw(player, translate(ply.lang)?.error_faction_info ?? "no translation");
	
	const form = new ActionFormData()
		.title("Faction Info")
		.body(buildFactionInfoMessage(ply, fac))
		.button("Quit");
	form.show(player); // don't care about the result
}

function buildFactionInfoMessage(ply: Ply, fac: Faction): string {
	let message = `
§eFaction Info :§r
- Name            : ${fac.color}${fac.name}§r
- Description     : ${fac.description}§r
- Creation Date   : ${formatCreationFullDate(fac.creationDate, ply.UTC)}§r
- Members         : ${fac.playerList.length}/${fac.memberLimit}§r
- Bank            : ${fac.bank}§r
- Power           : ${fac.power}/${DB.db_map.powerLimit.max * fac.playerList.length}§r
- Claim           : ${fac.claim.length}\n\n§eMembers :§r
`;
	if (fac.playerList.find(p => p.name === ply.name)) {
		message += `
- faction home    : ${fac.Fhome?.x} ${fac.Fhome?.y} ${fac.Fhome?.z}`
	}

	for (const p of fac.playerList) {
		message += "\n - " + p.name + " : " + Object.keys(factionRank)[p.permission];
	}
	message += "\n\n§eAlly :§r";
	for (const a of fac.ally) {
		message += "\n - " + a;
	}
	message += "\n\n§eEnemy :§r";
	for (const e of fac.enemy) {
		message += "\n - " + e;
	}

	return message;
}