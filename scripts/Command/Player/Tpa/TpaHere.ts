import { Player } from "@minecraft/server";
import { Ply, Tpa, TpaType, db_player } from "../../../Object/player/Ply";
import { concatenateArgs, tellraw } from "../../../Object/tool/tools";
import { addSubCommand, cmd_permission } from "../../CommandManager";
import { cmd_module, db_map } from "../../../Object/database/db_map";
import { translate } from "../../../Object/tool/lang";

addSubCommand(
	"tpahere",
	"Send a teleportation request to a player. to go to your location.",
	`${globalThis.prefix}tpahere <player>`,
	["tpahere", "tpah"],
	cmd_module.tpa,
	cmd_permission.member,
	true,
	false,
	tpahere
)

function tpahere(args: string[], player: Player, ply: Ply) {
	if (args.length >= 2) {
		let name = concatenateArgs(args, 1, (s) => s.replace(/[@"]/g, ""));
		let target = db_player.get(name);
		if (target != undefined) {
			if (target.tpa != null && target.tpa.name === ply.name && target.tpa.type === TpaType.tpahere) {
				target.remove_to_update_player();
				target.tpa = new Tpa(ply.name, TpaType.tpahere, db_map.tpaDelay);
				target.add_to_update_player();
				tellraw(player, translate(ply.lang, target.name)?.tpa_send ?? "no translation");
				tellraw(target.name, translate(ply.lang, ply.name, prefix)?.tpahere_get ?? "no translation")
			}
			else {
				tellraw(player, translate(ply.lang)?.error_tpa ?? "no translation");
			}
		}
		else {
			tellraw(player, translate(ply.lang)?.error_find_player ?? "no translation");
		}
	}
	else {
		tellraw(player, translate(ply.lang)?.error_arg ?? "no translation");
	}
}