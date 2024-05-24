import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { tellraw } from "../../Object/tool/tools";
import { Faction, db_faction, factionRank } from "../../Object/faction/Faction";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { addSubCommand, cmd_permission } from "../CommandManager";
import { cmd_module } from "../../Object/database/db_map";
import { translate } from "../../Object/tool/lang";

addSubCommand(
	"bank",
	"add or remove money from the faction bank\n §7You need to be at least officer to remove money",
	`${globalThis.prefix}faction bank [<add/remove> <amount>]`,
	["bank", "b"],
	cmd_module.faction,
	cmd_permission.member,
	true,
	true,
	FactionBank,
	[["faction", "f"]]
)

function FactionBank(args: string[], player: Player, ply: Ply) {
    const fac = db_faction.get(ply.faction_name ?? "");

    if (!fac) return tellraw(player, translate(ply.lang)?.error_no_faction ?? "no translation");
    if (args.length === 2) return FactionBankUI(player, ply, fac);
    if (args.length !== 4) return tellraw(player, translate(ply.lang)?.error_arg ?? "no translation");
    if (!args[3].match(/[0-9]/g) || (parseInt(args[3]) <= 0)) return tellraw(player, translate(ply.lang)?.error_number ?? "no translation");

    const money = parseInt(args[3]);

    if (args[2] === "add") return addBankMoney(fac, money, ply, player);
    if (args[2] === "remove" && fac.playerList.some(p => p.name === player.name && fac?.isAtLeastRank(p, factionRank.Officer))) return removeBankMoney(fac, money, ply, player);

    return tellraw(player, translate(ply.lang)?.error_arg_add_remove ?? "no translation");
}

function addBankMoney(fac: Faction, money: number, ply: Ply, player: Player) {
	if (ply.money >= money) {
		fac.remove_to_update_faction();
		ply.remove_to_update_player();
		ply.money -= money;
		fac.bank += money;
		fac.add_to_update_faction();
		ply.add_to_update_player();
		tellraw(player, translate(ply.lang, money)?.faction_bank_add ?? "no translation");
	}
	else {
		tellraw(player, translate(ply.lang)?.error_money ?? "no translation");
	}
}

function removeBankMoney(fac: Faction, money: number, ply: Ply, player: Player) {
	if (fac.bank >= money) {
		fac.remove_to_update_faction();
		ply.remove_to_update_player();
		ply.money += money;
		fac.bank -= money;
		fac.remove_to_update_faction();
		ply.add_to_update_player();
		tellraw(player, translate(ply.lang, money)?.faction_bank_remove ?? "no translation");
	}
	else {
		tellraw(player, translate(ply.lang)?.error_bank_money ?? "no translation");
	}
}

async function FactionBankUI(player: Player, ply: Ply, fac: Faction) {
	const form = new ActionFormData()
	.title("select action")
	.body("§eCurrent bank Money: " + fac.bank)
	.button("add")
	.button("remove")

	const res = await form.show(player);
	if (res.canceled) return;

	if (res.selection === 0) return FactionBankAddUI(player, ply, fac);
	if (!fac.playerList.some(p => p.name === player.name && fac?.isAtLeastRank(p, factionRank.Officer))) return tellraw(player, translate(ply.lang)?.error_cant_do_that ?? "no translation");
	
	return FactionBankRemoveUI(player, ply, fac);
}

async function FactionBankAddUI(player: Player, ply: Ply, fac: Faction) {
	const form = new ModalFormData()
	.title("add money")
	.textField(`§ahow much money do you want to deposit?\n§eCurrent money: ${ply.money}`, "0", "0")

	const res = await form.show(player);
	if (res.canceled) return;
	const rawValue = res!.formValues![0] as string;
	if (!rawValue.match(/[0-9]/g) || (parseInt(rawValue) <= 0)) return tellraw(player, translate(ply.lang)?.error_number ?? "no translation");
	const money = parseInt(rawValue);

	//check if data are still valid
	if (!(db_faction.has(fac.name) && fac.playerList.some(p => p.name === player.name))) return tellraw(player, translate(ply.lang)?.error_find_faction ?? "no translation");

	if (ply.money >= money) {
		fac.remove_to_update_faction();
		ply.remove_to_update_player();
		ply.money -= money;
		fac.bank += money;
		fac.add_to_update_faction();
		ply.add_to_update_player();
		tellraw(player, translate(ply.lang, money)?.faction_bank_add ?? "no translation");
	}
	else {
		tellraw(player, translate(ply.lang)?.error_money ?? "no translation");
	}
}

async function FactionBankRemoveUI(player: Player, ply: Ply, fac: Faction) {
	const form = new ModalFormData()
	.title("remove money")
	.textField(`§ahow much money do you want to withdraw?\n§eCurrent bank money: ${fac.bank}`, "0", "0")

	const res = await form.show(player);
	if (res.canceled) return;
	const rawValue = res!.formValues![0] as string;
	if (!rawValue.match(/[0-9]/g) || (parseInt(rawValue) <= 0)) return tellraw(player, translate(ply.lang)?.error_number ?? "no translation");
	const money = parseInt(rawValue);

	//check if data are still valid
	if (!(db_faction.has(fac.name) && fac.playerList.some(p => p.name === player.name))) return tellraw(player, translate(ply.lang)?.error_find_faction ?? "no translation");

	if (fac.bank >= money) {
		fac.remove_to_update_faction();
		ply.remove_to_update_player();
		ply.money += money;
		fac.bank -= money;
		fac.remove_to_update_faction();
		ply.add_to_update_player();
		tellraw(player, translate(ply.lang, money)?.faction_bank_remove ?? "no translation");
	}
	else {
		tellraw(player, translate(ply.lang)?.error_bank_money ?? "no translation");
	}
}