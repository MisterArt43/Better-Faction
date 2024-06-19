import { Player } from "@minecraft/server";
import { Warp, db_warp } from "../warp/Warp";
import { ActionFormData } from "@minecraft/server-ui";
import { sleep } from "./tools";

export async function find_warp_UI(player: Player, showCoords: boolean = false) : Promise<Warp | undefined> {
	const list_w = await getWarpList();
	const batchSize = 20;
	const batchNumber = Math.ceil(list_w.length / batchSize)
	let page: Warp[][] = [];
	for (let i = 0; i < batchNumber; i++) {
		const batchStart = i * batchSize;
		const batchEnd = batchStart + batchSize;
		const batch = batchEnd < list_w.length ? list_w.slice(batchStart, batchEnd) : list_w.slice(batchStart);
		page.push(batch);
	}
	let current_page = 0;
	let currentWarp : Warp;
	while (1)
	{
		let form = new ActionFormData()
		.body("Select a warp")
		page[current_page].forEach(w => form.button(w.pos.getDimColor() + w.name + showCoords ? ("\n§r" + w.pos.toString()) : ""));
		if (page.length !== current_page + 1)
			form.button("next page");
		if (current_page !== 0)
			form.button("previous page");
		const res = await form.show(player);
		if (res.canceled)
			return undefined;
		if (res.selection === page.length)
			current_page === batchNumber ? current_page++ : current_page--;
		else if (res.selection === page.length + 1)
			current_page--;
		else {
			currentWarp = list_w[res.selection! + current_page * batchSize];
			break;
		}
	}
	currentWarp = db_warp.get(currentWarp!.name) as Warp;
	if (!currentWarp) {
		player.sendMessage("§cWarp not found");
		return undefined;
	}
	return currentWarp;
}

export async function getWarpList() : Promise<Warp[]> {
	let list_w : Warp[] = [];
	let i = 0;
	for (const [key, w] of db_warp) {
		list_w.push(w);
		if (++i % 30 === 0) await sleep(1);
	}
	return list_w;
}