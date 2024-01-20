import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { concatenateArgs, tellraw } from "../../Object/tool/tools";
import { DB } from "../../Object/database/database";
import { translate } from "../../lang";
import { Faction, factionRank, faction_member } from "../../Object/faction/Faction";
import { ActionFormData } from "@minecraft/server-ui";
import { addSubCommand, cmd_permission } from "../CommandManager";
import { cmd_module } from "../../Object/database/db_map";

addSubCommand(
	"kick",
	"Kick a player from your faction.",
	`${globalThis.prefix}faction kick <player>`,
	["kick", "k"],
	cmd_module.faction,
	cmd_permission.member,
	true,
	true,
	FactionKick,
	[["faction", "f"]]
)

function FactionKick(args: string[], player: Player, ply: Ply) {
	const fac = DB.db_faction.get(ply.faction_name ?? "");
	
	if (fac === undefined) return tellraw(player, translate(ply.lang)?.error_no_faction ?? "no translation");
	if (!fac.isAtLeastRank(ply.name, factionRank.Officer)) return tellraw(player, translate(ply.lang)?.error_not_allow_command ?? "no translation");

	if (args.length >= 3) {
		FactionKickCMD(args, player, ply, fac);
	}
	else {
		FactionKickUI(player, ply, fac);
	}
}

function FactionKickCMD(args: string[], player: Player, ply: Ply, fac: Faction) {
	const name = concatenateArgs(args, 2, (s) => s.replace(/["@]/g, ""));

	const targetMember = fac.playerList.find((p) => p.name.toLowerCase() === name.toLowerCase() && p.permission !== factionRank.Leader);
	if (targetMember !== undefined) {
		fac.remove_to_update_faction();
		fac.playerList.splice(fac.playerList.indexOf(targetMember), 1);
		fac.add_to_update_faction();

		const target = DB.db_player.get(targetMember.name);
		if (target === undefined) return tellraw(player, translate(ply.lang)?.error_find_player ?? "no translation");
		target.remove_to_update_player();

		target.faction_name = null;
		target.add_to_update_player();
		tellraw(player, translate(ply.lang, name)?.faction_kick ?? "no translation");
		tellraw(target.name, translate(ply.lang, fac.name)?.faction_kick_get ?? "no translation");
	}
	else {
		tellraw(player, translate(ply.lang)?.error_faction_kick ?? "no translation")
	}
}

async function FactionKickUI(player: Player, ply: Ply, fac: Faction) {
	const form = new ActionFormData()
	.title("Select a player to kick")
	const playerListCopy = [...fac.playerList];
	for (const p of playerListCopy) {
		if (p.permission !== factionRank.Leader) {
			form.button(p.name);
		}
	}
	const res = await form.show(player);
	if (res.canceled) return;

	if (!DB.db_faction.has(fac.name)) return tellraw(player, translate(ply.lang)?.error_find_faction ?? "no translation");

	const targetMember = fac.playerList.find((p) => p === playerListCopy[res.selection!]);
	if (targetMember === undefined) return tellraw(player, translate(ply.lang)?.error_find_player ?? "no translation");
	fac.remove_to_update_faction();
	fac.playerList.splice(fac.playerList.indexOf(targetMember), 1);
	fac.add_to_update_faction();

	tellraw(player, translate(ply.lang, targetMember.name)?.faction_kick ?? "no translation");
	tellraw(targetMember.name, translate(ply.lang, fac.name)?.faction_kick_get ?? "no translation");
}