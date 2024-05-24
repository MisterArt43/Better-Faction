import { Player } from "@minecraft/server";
import { Ply } from "../../../Object/player/Ply";
import { concatenateArgs, tellraw } from "../../../Object/tool/tools";
import { Home } from "../../../Object/player/Home";
import { addSubCommand, cmd_permission } from "../../CommandManager";
import { cmd_module } from "../../../Object/database/db_map";
import { translate } from "../../../Object/tool/lang";

addSubCommand(
	"sethome",
	"Set your home at your current position.",
	`${globalThis.prefix}sethome <name>`,
	["sethome", "sh"],
	cmd_module.home,
	cmd_permission.member,
	true,
	false,
	sethome
)

function sethome(args: string[], player: Player, ply: Ply) {
	if (args.length >= 2) {
		let name = concatenateArgs(args, 1, (s) => s.replace(/"/g, ""));
		if (ply.home.find((h) => h.getName() === name) != undefined) {
			tellraw(player, translate(ply.lang)?.error_have_home ?? "no translation");
			return;
		}
		if (ply.home.length >= ply.homeLimit) {
			tellraw(player, translate(ply.lang)?.error_limit_home ?? "no translation");
			return;
		}
		
		const homeObject = new Home(
			name, 
			Math.ceil(player.location.x + 0.0001) - 1, 
			Math.ceil(player.location.y - 0.4999), 
			Math.ceil(player.location.z + 0.0001) - 1, 
			player.dimension.id
		);

		ply.remove_to_update_player();
		ply.home.push(homeObject);
		ply.add_to_update_player();

		tellraw(player, translate(ply.lang, name)?.home_add ?? "no translation");
	}
	else {
		tellraw(player, translate(ply.lang)?.error_arg ?? "no translation");
	}
}