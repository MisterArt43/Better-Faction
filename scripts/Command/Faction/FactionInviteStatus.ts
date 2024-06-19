import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { DB } from "../../Object/database/database";
import { tellraw } from "../../Object/tool/tools";
import { translate } from "../../Object/tool/lang";
import { factionRank } from "../../Object/faction/Faction";
import { addSubCommand } from "../CommandManager";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";

addSubCommand(
	"InviteStatus",
	"Open or close the faction to invite. (if open, everyone can join)",
	`${globalThis.prefix}faction open`,
	["InviteStatus", "invitestatus", "is", "open", "close"],
	cmd_module.faction,
	cmd_permission.member,
	true,
	false,
	FactionInviteStatus,
	[["faction", "f"]]
);

function FactionInviteStatus(args: string[], player: Player, ply: Ply) {
	if (args.length === 2) {
		const fac = DB.db_faction.get(ply.faction_name ?? "");
		if (fac === undefined) return tellraw(player, translate(ply.lang)?.error_no_faction ?? "no translation");
		if (fac.isAtLeastRank(player.name, factionRank.Leader)) return tellraw(player, translate(ply.lang)?.error_cant_do_that ?? "no translation");
		
		fac.remove_to_update_faction();
		if (fac.isOpen === true)
			fac.isOpen = false;
		else if (fac.isOpen === false)
			fac.isOpen = true;
		fac.add_to_update_faction();
		
		tellraw(player, fac.isOpen ? translate(ply.lang)?.Fopen_on ?? "no translation" : translate(ply.lang)?.Fopen_off ?? "no translation");
	}
	else {
		tellraw(player, translate(ply.lang)?.error_arg ?? "no translation");
	}
}