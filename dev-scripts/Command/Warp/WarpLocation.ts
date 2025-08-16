import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { Warp, db_warp } from "../../Object/warp/Warp";
import { addSubCommand } from "../CommandManager";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";
import { DB } from "../../Object/database/database";
import { find_warp_UI } from "../../Object/tool/find_waps_UI";
import { WarpNotEmpty } from "./_UtilsWarp";
import { BFActionFormData, BFModalFormData } from "../../Object/formQueue/formQueue";
import { MinecraftDimensionTypes } from "../../Object/tool/tools";

addSubCommand(
	"location",
	"edit the location of the warp (x y z / dimension)",
	`${globalThis.prefix}warp edit`,
	["location", "l", "pos", "position"],
	cmd_module.warp,
	cmd_permission.admin,
	true,
	true,
	editWarpLocation,
	[["warp", "w"], ["edit", "e"]],
	WarpNotEmpty
)

function editWarpLocation(args: string[], player: Player, ply: Ply) {
	if (DB.db_warp.size > 0) {
		const form = new BFActionFormData()
		.body("select a warp")
		const list_w = Array.from(DB.db_warp.values())
		list_w.map(w => form.button(w.pos.getDimColor() + w.name))
		editWarpLocationUI(player, ply, list_w);
	}
	else {
		player.sendMessage("§cThere is no warp");
	}
}

async function editWarpLocationUI(player: Player, ply: Ply, list_w : Warp []) {
	const dimensionTab = [MinecraftDimensionTypes.Overworld, MinecraftDimensionTypes.Nether, MinecraftDimensionTypes.TheEnd] as string[];
	
	let currentWarp = await find_warp_UI(player, true);
	if (!currentWarp) return player.sendMessage("This warp doesn't exist");
	currentWarp.remove_to_update_warp();
	new BFModalFormData()
		.title("Edit Warp Location")
		.textField("Name", "warp name", {defaultValue: currentWarp!.name})
		.textField("X", "coordinate x", {defaultValue: currentWarp!.pos.x.toString()})
		.textField("Y", "coordinate y", {defaultValue: currentWarp!.pos.y.toString()})
		.textField("Z", "coordinate z", {defaultValue: currentWarp!.pos.z.toString()})
		.dropdown("Dimension", dimensionTab, {defaultValueIndex: dimensionTab.indexOf(currentWarp!.pos.dim)})
		.toggle("is Open", {defaultValue: currentWarp!.isOpen})
		.textField("delay before a new tp to this warp", '5', {defaultValue: currentWarp!.delay.toString()})
		.textField("message to display", 'message')
		.show(player).then(res => {
			if (res.canceled) return;
			if (db_warp.has(res.formValues![0] as string)) return player.sendMessage("This warp already exists");
			if (!isDigit(res.formValues![1] as string) || !isDigit(res.formValues![2] as string) || !isDigit(res.formValues![3] as string))
				return player.sendMessage("wrong coordinates inputs")

			currentWarp.pos.x = parseInt(res.formValues![1] as string)
			currentWarp.pos.y = parseInt(res.formValues![2] as string)
			currentWarp.pos.z = parseInt(res.formValues![3] as string)
			currentWarp.pos.dim = dimensionTab[res.formValues![4] as number]
			currentWarp.isOpen = res.formValues![5] as boolean
			currentWarp.delay = parseInt(res.formValues![6] as string)
			currentWarp.message = res.formValues![7] as string
			Warp.add_warp(currentWarp!);
			player.sendMessage("Warp added");
		})
	currentWarp.add_to_update_warp();
}

function isDigit(str : string) {
	if (str.match(/[0-9]/g))
		return true
	return false
}