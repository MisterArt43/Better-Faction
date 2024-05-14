import { MinecraftDimensionTypes, Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { Warp, db_warp } from "../../Object/warp/Warp";
import { addSubCommand, cmd_permission } from "../CommandManager";
import { cmd_module } from "../../Object/database/db_map";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { concatenateArgs } from "../../Object/tool/tools";
import { translate } from "../../lang";
import { DB } from "../../Object/database/database";

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
	[["warp", "w"], ["edit", "e"]]
)

function editWarpLocation(args: string[], player: Player, ply: Ply) {
	if (DB.db_warp.size > 0) {
		const form = new ActionFormData()
		.body("select a warp")
		const list_w = Array.from(DB.db_warp.values())
		list_w.map(w => form.button(w[0]))
		editWarpLocationUI(player, ply, list_w);
	}
	else {
		player.sendMessage("§cThere is no warp");
	}
}

async function editWarpLocationUI(player: Player, ply: Ply, list_w : Warp []) {
	const dimensionTab = [MinecraftDimensionTypes.overworld, MinecraftDimensionTypes.nether, MinecraftDimensionTypes.theEnd]
	let page: Warp[][] = [];
	const batchNumber = Math.ceil(list_w.length / 100)
	for (let i = 0; i < batchNumber; i++) {
		const batchStart = i * 100;
		const batchEnd = batchStart + 100;
		const batch = batchEnd < list_w.length ? list_w.slice(batchStart, batchEnd) : list_w.slice(batchStart);
		page.push(batch);
	}
	let current_page = 0;
	let currentWarp : Warp;
	while (1)
	{
		let form = new ActionFormData()
		.body("Select a warp")
		page[current_page].forEach(w => form.button(w.pos.getDimColor() + w.name + "\n§r" + w.pos.toString()));
		if (page.length !== current_page + 1)
			form.button("next page");
		if (current_page !== 0)
			form.button("previous page");
		const res = await form.show(player);
		if (res.canceled)
			return;
		if (res.selection === page.length)
			current_page === batchNumber ? current_page++ : current_page--;
		else if (res.selection === page.length + 1)
			current_page--;
		else {
			currentWarp = list_w[res.selection! + current_page * 100];
			break;
		}
	}
	new ModalFormData()
		.title("Edit Warp Location")
		.textField("Name", "warp name", currentWarp!.name)
		.textField("X", "coordinate x", currentWarp!.pos.x.toString())
		.textField("Y", "coordinate y", currentWarp!.pos.y.toString())
		.textField("Z", "coordinate z", currentWarp!.pos.z.toString())
		.dropdown("Dimension", dimensionTab, dimensionTab.indexOf(currentWarp!.pos.dim))
		.toggle("is Open", currentWarp!.isOpen)
		.textField("delay before a new tp to this warp", '5', currentWarp!.delay.toString())
		.show(player).then(res => {
			if (res.canceled) return;
			if (db_warp.has(res.formValues![0] as string)) return player.sendMessage("This warp already exists");
			if (!isDigit(res.formValues![1] as string) || !isDigit(res.formValues![2] as string) || !isDigit(res.formValues![3] as string))
				return player.sendMessage("wrong coordinates inputs")
			const newWarp = new Warp(res.formValues![0] as string, player);
			newWarp.pos.x = parseInt(res.formValues![1] as string)
			newWarp.pos.y = parseInt(res.formValues![2] as string)
			newWarp.pos.z = parseInt(res.formValues![3] as string)
			newWarp.pos.dim = dimensionTab[res.formValues![4] as string]
			Warp.add_warp(newWarp);
			player.sendMessage("Warp added");
		})
}

function isDigit(str : string) {
	if (str.match(/[0-9]/g))
		return true
	return false
}