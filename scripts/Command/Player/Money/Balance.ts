import { Player } from "@minecraft/server";
import { cmd_module } from "../../../Object/database/db_map";
import { concatenateArgs, tellraw } from "../../../Object/tool/tools";
import { translate } from "../../../lang";
import { addSubCommand, cmd_permission } from "../../CommandManager";
import { Ply } from "../../../Object/player/Ply";
import { DB } from "../../../Object/database/database";


addSubCommand(
	"balance",
	"Check your balance.",
	`${globalThis.prefix}balance [player]`,
	["balance", "bank"],
	cmd_module.money,
	cmd_permission.member,
	true,
	false,
	balance
)

function balance(args: string[], player: Player, ply: Ply) {
	if (args.length == 1) {
		tellraw(player, `§e${DB.db_player.get(player.name)?.money ?? 0}`);
	}
	else {
		let name = concatenateArgs(args, 1, (s) => s.replace(/[@"]/g, ""));
		let pl = DB.db_player.get(name);
		if (pl !== undefined) {
			tellraw(player, `§e${pl.money}`);
		}
		else {
			tellraw(player, translate(ply.lang)?.error_find_player ?? "§cCan't find player.");
		}
	}

}
