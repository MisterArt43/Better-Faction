import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { Warp, db_warp } from "../../Object/warp/Warp";
import { addSubCommand, cmd_permission } from "../CommandManager";
import { cmd_module } from "../../Object/database/db_map";
import { ModalFormData } from "@minecraft/server-ui";
import { concatenateArgs } from "../../Object/tool/tools";
import { translate } from "../../lang";

addSubCommand(
	"add",
	"add a warp",
	`${globalThis.prefix}warp add <name>`,
	["add"],
	cmd_module.warp,
	cmd_permission.admin,
	true,
	true,
	addWarp,
	[["warp", "w"]]
)

function addWarp(args: string[], player: Player, ply: Ply) {
	if (args.length > 2) {
		addWarpCommand(args, player, ply);
	}
	else {
		addWarpUI(player, ply);
	}
}

function addWarpCommand(args: string[], player: Player, ply: Ply) {
	const name = concatenateArgs(args, 2);
		if (name.match(/^([0-9a-zA-Z ]){1,20}$/)) {
			if (!db_warp.has(name)) {
				const warp = new Warp(name, player);
                Warp.add_warp(warp);
				player.sendMessage(translate(ply.lang, name, warp.pos.x, warp.pos.y, warp.pos.z)?.warp_add ?? "no translation");
			}
			else {
				player.sendMessage(translate(ply.lang)?.error_have_name ?? "no translation");
			}
		}
		else {
			player.sendMessage(translate(ply.lang)?.error_name ?? "no translation")
		}
}
function addWarpUI(player: Player, ply: Ply) {
	new ModalFormData()
		.title("Add Warp")
		.textField("Name", "warp name")
		.show(player).then(res => {
			if (res.canceled) return;
			if (db_warp.has(res.formValues![0] as string)) return player.sendMessage("This warp already exists");
			Warp.add_warp(new Warp(res.formValues![0] as string, player));
			player.sendMessage("Warp added");
		})
}