import { Player, system, world } from "@minecraft/server";
import { Ply } from "../../../Object/player/Ply";
import { concatenateArgs, tellraw } from "../../../Object/tool/tools";
import { DB } from "../../../Object/database/database";
import { translate } from "../../../Object/tool/lang";
import { UI_find_player } from "../../../Object/tool/find_players_UI";
import { addSubCommand } from "../../CommandManager";
import { cmd_module, cmd_permission } from "../../../Object/database/db_map";
import { BFActionFormData, BFModalFormData } from "../../../Object/formQueue/formQueue";

addSubCommand(
	"pay",
	"Pay money to other player.",
	`${globalThis.prefix}pay <player> <amount>\n${globalThis.prefix}pay`,
	["pay"],
	cmd_module.money,
	cmd_permission.member,
	true,
	true,
	pay
)

function pay(args: string[], player: Player, ply: Ply) {
	if (args.length === 1) {
		Pui_pay(player, ply);
	} else {
		cmd_pay(args, player, ply);
	}
}

function Pui_pay(player: Player, ply: Ply) {
	tellraw(player, "§o§7you have 2 seconds to quit the chat and the form will appear.");

	if (DB.db_player.size <= 1) {
		tellraw(player, "§cnot enough players in the database");
		return;
	}

	const money = ply.money;
	if (money <= 0) {
		tellraw(player, translate(ply.lang)?.error_money ?? "no translation");
		return;
	}

	system.runTimeout(async () => {
		const res = await new BFActionFormData()
			.title("§r§6Select Pay Method§r")
			.button("§r§aOnline Player§r")
			.button("§r§aSearch Player§r")
			.button("§r§aEnter Player Name§r")
			.show(player);

		if (res.canceled === true) return;

		switch (res.selection) {
			case 0: onlinePlayerSel(player, ply); break;
			case 1: searchPlayerSel(player, ply); break;
			case 2: enterPlayerNameSel(player, ply); break;
		}
	}, 18);
}

async function onlinePlayerSel(player: Player, ply: Ply) {
	const onlinePlayers = [...world.getPlayers()].filter((p) => p.name !== ply.name).map((p) => p.name);
	if (onlinePlayers.length === 0) {
		tellraw(player, "§cNo player online");
		return;
	}

	const res = await new BFModalFormData()
		.title("§r§6Select Player§r")
		.dropdown("§r§aPlayer List§r", onlinePlayers)
		.textField(`§r§aMoney to transfer (limit: ${ply.money})§r`, "1")
		.show(player);

	if (res.canceled === true) return;

	const targetName = DB.db_player.get(onlinePlayers[res.formValues?.[0] as number ?? ""])?.name ?? "";
	const money = res.formValues?.[1] as string ?? "";

	pay(["pay", targetName, money.toString()], player, ply);
}

async function searchPlayerSel(player: Player, ply: Ply) {
	try {
		const target = await UI_find_player(player);
		if (target === undefined) return;

		const res = await new BFModalFormData()
			.title("§r§6Pay to " + target.name + "§r")
			.textField(`§r§aMoney to transfer (limit: ${ply.money})§r`, "1")
			.show(player);

		if (res.canceled === true) return;

		const money = res.formValues?.[0] as string ?? "";
		pay(["pay", target.name, money.toString()], player, ply);
	} catch (error) {
		console.error("An error occurred during handleSearchPlayerSelection:", error);
	}
}

function enterPlayerNameSel(player: Player, ply: Ply) {
	new BFModalFormData()
		.title("§r§6Pay§r")
		.textField(`§r§aPlayer Name§r`, "")
		.textField(`§r§aMoney to transfer (limit: ${ply.money})§r`, "1")
		.show(player)
		.then((res) => {
			if (res.canceled == true) return;

			const targetName = DB.db_player.get(res.formValues?.[0] as string ?? "")?.name ?? "";
			const money = res.formValues?.[1] as string ?? "";

			pay(["pay", targetName, money + ""], player, ply);
		});
}

function cmd_pay(args: string[], player: Player, ply: Ply) {
	//command style
	if (args[args.length - 1].match(/[0-9]/g)) {
		const name = concatenateArgs(args, 1, (s) => s.replace(/[@"]/g, ""));
		const money = parseInt(args[args.length - 1])
		if (money > 0) {
			const target = DB.db_player.get(name);
			if (target != undefined) {
				if (ply.money >= money) {
					target.remove_to_update_player();
					ply.remove_to_update_player();
					ply.money -= money;
					target.money += money;
					ply.add_to_update_player();
					target.add_to_update_player();
					tellraw(player, translate(ply.lang, money, target.name)?.pay ?? "no translation");
					tellraw(target.name, translate(ply.lang, money, ply.name)?.pay_get ?? "no translation");
				}
				else {
					tellraw(player, translate(ply.lang)?.error_money ?? "no translation");
				}
			}
			else {
				tellraw(player, translate(ply.lang)?.error_find_player ?? "no translation");
			}
		}
		else {
			tellraw(player, translate(ply.lang)?.error_number ?? "no translation");
		}
	}
	else {
		tellraw(player, translate(ply.lang)?.error_arg ?? "no translation");
	}
}