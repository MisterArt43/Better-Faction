import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { getWarpList } from "../../Object/tool/find_waps_UI";
import { Warp, db_warp } from "../../Object/warp/Warp";
import { log, runCommandDim, sleep, tpsound } from "../../Object/tool/tools";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";
import { addSubCommand } from "../CommandManager";
import { WarpNotEmpty } from "./_UtilsWarp";
import { BFActionFormData } from "../../Object/formQueue/formQueue";

addSubCommand(
	"teleport",
	"Teleport the player to a warp",
	`${globalThis.prefix}warp`,
	["teleport", "t", "warp", "w"],
	cmd_module.warp,
	cmd_permission.member,
	true,
	true,
	warpUI,
	[['warp', 'w']],
	WarpNotEmpty
)

async function getAccessWarpList(player: Player, ply: Ply) {
	const list_tag = player.getTags();
	const list_w = await getWarpList();
	const batchSize = 20;
	const batchNumber = Math.ceil(list_w.length / batchSize)
	let page: Warp[][] = [];
	for (let i = 0; i < batchNumber; i++) {
		const batchStart = i * batchSize;
		const batchEnd = batchStart + batchSize;
		const batch = batchEnd < list_w.length ? list_w.slice(batchStart, batchEnd) : list_w.slice(batchStart);
		if (ply.permission <= cmd_permission.admin) // if admin or more : can see all warps
			page.push(batch);
		else if (batch.some(w => (w.allow.some(t => list_tag.includes(t)) && !w.deny.some(t => list_tag.includes(t))) || w.allow.length === 0))
			page.push(batch);
		if (i % 30 === 0) await sleep(1);
	}
	return { page: page, batchNumber: batchNumber, batchSize: batchSize, list_w: list_w };
}

async function warpUI(args: string[], player: Player, ply: Ply) {
	try {
		const warpBook = await getAccessWarpList(player, ply);
		let current_page = 0;
		let currentWarp: Warp;
		while (1) {
			let form = new BFActionFormData()
				.body("Select a warp")
			warpBook.page[current_page].forEach(w => form.button(w.pos.getDimColor() + w.name));
			if (warpBook.page.length !== current_page + 1)
				form.button("next page");
			if (current_page !== 0)
				form.button("previous page");
			const res = await form.show(player);
			if (res.canceled)
				return;
			if (res.selection === warpBook.page[current_page].length)
				current_page === (warpBook.batchNumber - 1) ? current_page-- : current_page++;
			else if (res.selection === warpBook.page[current_page].length + 1)
				current_page--;
			else {
				currentWarp = warpBook.list_w[res.selection! + current_page * warpBook.batchSize];
				break;
			}
		}
	
		currentWarp = db_warp.get(currentWarp!.name) as Warp;
		if (!currentWarp || (currentWarp.isOpen === false && ply.permission > cmd_permission.admin)) {
			player.sendMessage("§cWarp not found");
			return;
		}
	
		ply.remove_to_update_player();
		ply.update_back_position({ x: player.location.x, y: player.location.y, z: player.location.z, dimension: player.dimension });
		ply.add_to_update_player();
	
		runCommandDim(`tp "${player.name}" ${currentWarp.pos.x} ${currentWarp.pos.y} ${currentWarp.pos.z}`, currentWarp.pos.dim);
		tpsound(player);
	} catch (error) {
		if (error instanceof Error) {
			log("Error: " + error.message);
			log("Error: " + error.stack);
		}
	}
}