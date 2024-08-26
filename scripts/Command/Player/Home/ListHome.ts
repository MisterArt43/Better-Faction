import { Player } from "@minecraft/server";
import { Ply } from "../../../Object/player/Ply";
import { DB } from "../../../Object/database/database";
import { concatenateArgs, tellraw } from "../../../Object/tool/tools";
import { translate } from "../../../Object/tool/lang";
import { addSubCommand } from "../../CommandManager";
import { cmd_module, cmd_permission } from "../../../Object/database/db_map";

addSubCommand(
	"listhome",
	"List your home.",
	`${globalThis.prefix}listhome`,
	["listhome", "lh"],
	cmd_module.home,
	cmd_permission.member,
	true,
	false,
	listhome,
	[[]],
	undefined,
	3
)

function listhome(args: string[], player: Player, ply: Ply) {
	const handleError = (errorMessage: string) => tellraw(player, errorMessage);
	const adminTag = globalThis.adminTag;

	if (args.length === 1) {
		const homes = ply.home;
		const message = homes.map(h => `\n§e  -"§a${h.name}§e" ${h.x}, ${h.y}, ${h.z} | ${h.dim}`).join("");
		const translation = translate(ply.lang, message)?.home_list ?? "no translation";
		handleError(message !== "" ? translation : translate(ply.lang)?.error_home_list ?? "no translation");
	} else if (args.length >= 2) {
		if (player.hasTag(adminTag)) {
			const name = concatenateArgs(args, 1, (s) => s.replace(/[@"]/g, ""));
			const target = DB.db_player.get(name);
			if (target !== undefined) {
				const message = target.home.map(h => `\n§e  -"§a${h.name}§e" ${h.x}, ${h.y}, ${h.z} | ${h.dim}`).join("");
				const translation = translate(ply.lang, message)?.home_list ?? "no translation";
				handleError(message !== "" ? translation : translate(ply.lang)?.error_home_list ?? "no translation");
			} else {
				handleError(translate(ply.lang)?.error_find_player ?? "no translation");
			}
		} else {
			handleError(translate(ply.lang)?.error_not_allow_command ?? "no translation");
		}
	} else {
		handleError(translate(ply.lang)?.error_arg ?? "no translation");
	}
}
