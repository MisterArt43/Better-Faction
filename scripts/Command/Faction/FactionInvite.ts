import { Player, world } from "@minecraft/server";
import { DB } from "../../Object/database/database";
import { Ply } from "../../Object/player/Ply";
import { concatenateArgs, tellraw } from "../../Object/tool/tools";
import { translate } from "../../lang";
import { Faction, factionRank, faction_member } from "../../Object/faction/Faction";
import { addSubCommand, cmd_permission } from "../CommandManager";
import { cmd_module } from "../../Object/database/db_map";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

addSubCommand(
	"invite",
	"Invite a player to your faction.",
	`${globalThis.prefix}faction invite <player>`,
	["invite", "i"],
	cmd_module.faction,
	cmd_permission.member,
	true,
	true,
	Factioninvite,
	[["faction", "f"]]
);

// ---------------------------------- //
// ---------- FACTION INVITE -------- //
// ---------------------------------- //

function Factioninvite(args: string[], player: Player, ply: Ply) {
	const fac = DB.db_faction.get(ply.faction_name ?? "");
	if (!fac)
		return tellraw(player, translate(ply.lang)?.error_cant_do_that ?? "no translation");

	const factionMember = fac.playerList.find((p) => p.name === ply.name);
	if (!factionMember)
		return tellraw(player, translate(ply.lang)?.error_cant_do_that ?? "no translation"); //Change this to a more specific error message

	if (args.length === 2) {
		factionInviteUI(player, ply, fac, factionMember);
	}

	switch (args[2]) {
		case "clear": clearInvite(player, ply, fac, factionMember); break;
		case "list": listInvite(player, ply, fac, factionMember); break;
		default: invitePlayer(args, player, ply, fac, factionMember); break;
	}
}

// ---------------------------------- //
// -------- COMMAND FUNCTIONS ------- //
// ---------------------------------- //

function invitePlayer(args: string[], player: Player, ply: Ply, fac: Faction, factionMember: faction_member) {
	const name = concatenateArgs(args, 2, (s) => s.replace(/["@]/g, ""));
	if (fac.isAtLeastRank(factionMember, factionRank.Officer)) {
		if (DB.db_faction.get(DB.db_player.get(name)?.faction_name ?? "") === undefined) {
			if (fac.invitList.find((p) => p === name) === undefined) {
				fac.remove_to_update_faction();
				fac.invitList.push(name);
				fac.add_to_update_faction();
				tellraw(player, translate(ply.lang, name)?.faction_invit ?? "no translation");
				const target = DB.db_player.get(name);
				if (target !== undefined) {
					tellraw(target.name, translate(ply.lang, fac.name)?.faction_invit_get ?? "no translation");
				}
			}
			else {
				tellraw(player, translate(ply.lang)?.error_have_invit ?? "no translation");
			}
		}
		else {
			tellraw(player, translate(ply.lang)?.error_have_faction ?? "no translation");
		}
	}
	else {
		tellraw(player, translate(ply.lang)?.error_cant_do_that ?? "no translation");
	}
}

function clearInvite(player: Player, ply: Ply, fac: Faction, factionMember: faction_member) {
	if (fac.isAtLeastRank(factionMember, factionRank.Officer)) {
		fac.remove_to_update_faction();
		fac.invitList.splice(0, fac.invitList.length);
		fac.add_to_update_faction();
		tellraw(player, translate(ply.lang)?.faction_invit_clear ?? "no translation");
	}
	else {
		tellraw(player, translate(ply.lang)?.error_cant_do_that ?? "no translation");
	}
}

function listInvite(player: Player, ply: Ply, fac: Faction, factionMember: faction_member) {
	if (fac.isAtLeastRank(factionMember, factionRank.Officer)) {
		let message = "§eInvited players :§r";
		for (const p of fac.invitList) {
			message += "\n -" + p;
		}
		if (message === "§eInvited players :§r") {
			tellraw(player, translate(ply.lang)?.error_list_invit ?? "no translation"); return;
		}
		tellraw(player, message);
	}
	else {
		tellraw(player, translate(ply.lang)?.error_cant_do_that ?? "no translation");
	}
}

// ---------------------------------- //
// ----------- UI FUNCTIONS --------- //
// ---------------------------------- //

async function factionInviteUI(player: Player, ply: Ply, fac: Faction, factionMember: faction_member) {
	const form = new ActionFormData()
		.title("Faction Invite")
		.button("Invite a player")
	if (fac.invitList.length > 0) {
		form.button("Clear invites")
			.button("List invites")
	}


	const res = await form.show(player);
	if (res.canceled) return;

	switch (res.selection) {
		case 0: invitePlayerUI(player, ply, fac, factionMember); break;
		case 1: clearInviteUI(player, ply, fac, factionMember); break;
		case 2: listInvite(player, ply, fac, factionMember); break;
	}
}

async function clearInviteUI(player: Player, ply: Ply, fac: Faction, factionMember: faction_member) {
	const form = new ModalFormData()
		.title("Faction Invite - Clear invites")
	for (const p of fac.invitList) {
		form.toggle(p, false);
	}
	form.toggle("Clear all invites", false);

	const res = await form.show(player);
	if (res.canceled) return;

	const values = res.formValues! as boolean[];
	if (values.every(v => v === false)) return;
	if (values[values.length - 1]) {
		clearInvite(player, ply, fac, factionMember);
		return;
	}

	for (let i = 0; i < values.length - 1; i++) {
		if (values[i]) {
			fac.remove_to_update_faction();
			fac.invitList.splice(i, 1);
			fac.add_to_update_faction();
		}
	}
}

async function invitePlayerUI(player: Player, ply: Ply, fac: Faction, factionMember: faction_member) {
	const form = new ModalFormData()
		.title("Faction Invite - Invite a player")
		.textField("Player name", "player name")

	const res = await form.show(player);
	if (res.canceled) return;

	const name = res.formValues![0] as string;
	invitePlayer(name.split(" "), player, ply, fac, factionMember);
}