import { Player } from "@minecraft/server";
import { Ply } from "../../../Object/player/Ply";
import { cmd_module, cmd_permission } from "../../../Object/database/db_map";
import { DB } from "../../../Object/database/database";
import { concatenateArgs, runCommandDim, tellraw, tpsound } from "../../../Object/tool/tools";
import { translate } from "../../../Object/tool/lang";
import { addSubCommand } from "../../CommandManager";
import { Delay } from "../../../Object/player/Delay";

addSubCommand(
	"home",
	"Tp to your home.",
	`${globalThis.prefix}home <home>`,
	["home", "h"],
	cmd_permission.member,
	cmd_permission.member,
	true,
	false,
	home,
	[[]],
	3
);

function home(args: string[], player: Player, ply: Ply) {
	if (DB.db_delay.has(ply.name)) if (!DB.db_delay.get(ply.name)?.check_time()) return tellraw(player, "§cYou have to wait " + ((DB.db_delay.get(ply.name)?.time ?? 0 - new Date().getTime()) / 1000) + " seconds before using this command.");
	if (Delay.isTpCanceled(player)) return;
	if (args.length >= 2) {
		const name = concatenateArgs(args, 1)
		const ahome = DB.db_player.get(player.name)?.home.find((h) => h.getName() === name);
		if (ahome != undefined) {
                ply.remove_to_update_player();
				ply.back.updatePos(player.location).normalize().updateDim(player.dimension);
                ply.add_to_update_player();
			runCommandDim(`tp \"${player.name}\" ${ahome.getX()} ${ahome.getY()} ${ahome.getZ()}`, ahome.getDim());
			tpsound(player);
		}
		else {
			tellraw(player, translate(ply.lang)?.error_find_home ?? "no translation");
		}
	}
	else {
		tellraw(player, translate(ply.lang)?.error_arg ?? "no translation");
	}
}