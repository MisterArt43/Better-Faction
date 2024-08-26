import { MinecraftDimensionTypes, Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { Warp, db_warp } from "../../Object/warp/Warp";
import { addSubCommand } from "../CommandManager";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";
import { concatenateArgs } from "../../Object/tool/tools";
import { translate } from "../../Object/tool/lang";
import { BFModalFormData } from "../../Object/formQueue/formQueue";

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
	const dimensionTab = [MinecraftDimensionTypes.overworld, MinecraftDimensionTypes.nether, MinecraftDimensionTypes.theEnd]
	new BFModalFormData()
		.title("Add Warp")
		.textField("Name", "warp name")
		.textField("X", "coordinate x", player.location.x.toString())
		.textField("Y", "coordinate y", player.location.y.toString())
		.textField("Z", "coordinate z", player.location.z.toString())
		.dropdown("Dimension", dimensionTab, dimensionTab.indexOf(player.dimension.id))
		.toggle("is Open", true)
		.textField("delay before a new tp to this warp", '5', '5')
		.textField("message to display", 'message')
		.show(player).then(res => {
			if (res.canceled) return;
			if (db_warp.has(res.formValues![0] as string)) return player.sendMessage("This warp already exists");
			if (!isDigit(res.formValues![1] as string) || !isDigit(res.formValues![2] as string) || !isDigit(res.formValues![3] as string) && !isDigit(res.formValues![6] as string))
				return player.sendMessage("wrong coordinates or delay inputs")
			const newWarp = new Warp(res.formValues![0] as string, player);
			newWarp.pos.x = parseInt(res.formValues![1] as string)
			newWarp.pos.y = parseInt(res.formValues![2] as string)
			newWarp.pos.z = parseInt(res.formValues![3] as string)
			newWarp.pos.dim = dimensionTab[res.formValues![4] as number]
			newWarp.isOpen = res.formValues![5] as boolean
			newWarp.delay = parseInt(res.formValues![6] as string)
			newWarp.message = res.formValues![7] as string
			Warp.add_warp(newWarp);
			player.sendMessage("Warp added");
		})
}

function isDigit(str : string) {
	if (str.match(/[0-9]/g))
		return true
	return false
}