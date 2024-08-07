import { Player } from "@minecraft/server";
import { Ply, db_player } from "../../Object/player/Ply";
import { Faction, db_faction, factionRank, faction_member } from "../../Object/faction/Faction";
import { concatenateArgs, getTypedKeys, tellraw } from "../../Object/tool/tools";
import { ModalFormData } from "@minecraft/server-ui";
import { addSubCommand, cmd_permission } from "../CommandManager";
import { cmd_module } from "../../Object/database/db_map";
import { translate } from "../../Object/tool/lang";

addSubCommand(
	"promote",
	"promote a player",
	`${globalThis.prefix}faction promote <player>`,
	["promote", "p"],
	cmd_module.faction,
	cmd_permission.member,
	true,
	true,
	Factionpromote,
	[["faction", "f"]]
)

function Factionpromote(args: string[], player: Player, ply: Ply) {
	const fac = db_faction.get(ply.faction_name ?? "");
	if (fac === undefined || (fac?.playerList.find((p) => p.name === player.name && fac.isAtLeastRank(p, factionRank.Officer)) === undefined ?? true))
		return tellraw(player, translate(ply.lang)?.error_cant_do_that ?? "no translation");
	if (args.length >= 3) {
		factionPromoteCmd(args, player, ply, fac);
	}
	else {
		FactionrankUI(player, ply, fac);
	}
}

function factionPromoteCmd(args: string[], player: Player, ply: Ply, fac: Faction) {
	const name = concatenateArgs(args, 2, (s) => s.replace(/["@]/g, ""));
	const target = fac.playerList.find((p) => p.name.toLowerCase() === name.toLowerCase());
	const promoter = fac.playerList.find((p) => p.name === player.name);

	if (target !== undefined && promoter !== undefined) {
		updateFactionPromote(player, ply, target, promoter, fac);
	}
	else {
		tellraw(player, translate(ply.lang)?.error_find_player ?? "no translation");
	}
}

function updateFactionPromote(player: Player, ply: Ply, target: faction_member, promoter: faction_member, fac: Faction) {
	// switch permission between leader and officer
	if (target.permission === factionRank.Officer && promoter.permission === factionRank.Leader) {

		fac.remove_to_update_faction();
		fac.owner = target.name;
		target.permission = factionRank.Leader;
		promoter.permission = factionRank.Officer;
		fac.add_to_update_faction();

		fac.playerList.forEach((p) => {
			tellraw(db_player.get(p.name)!.name, translate(ply.lang, target.name)?.faction_new_leader ?? "no translation");
		})
		tellraw(player, translate(ply.lang)?.faction_new_leader_get ?? "no translation");
	}
	// promote to a member to officer
	else if (target.permission === factionRank.Member && promoter.permission === factionRank.Leader) {

		fac.remove_to_update_faction();
		target.permission = factionRank.Officer;
		fac.add_to_update_faction();

		tellraw(player, translate(ply.lang, target.name)?.faction_promote_co_leader ?? "no translation");
		tellraw(target.name, translate(ply.lang)?.faction_promote_co_leader_get ?? "no translation");
	}
	// promote to a visitor to member
	else if (target.permission === factionRank.Visitor) {

		fac.remove_to_update_faction();
		target.permission = factionRank.Member;
		fac.add_to_update_faction();

		tellraw(player, translate(ply.lang, target.name)?.faction_promote_member ?? "no translation");
		tellraw(target.name, translate(ply.lang)?.faction_promote_member_get ?? "no translation");
	}
	else {
		tellraw(player, translate(ply.lang)?.error_cant_do_that ?? "no translation");
	}
}

// ---------------------------------- //
// -------- UI FUNCTIONS ------------ //
// ---------------------------------- //

async function FactionrankUI(player: Player, ply: Ply, fac: Faction) {
    const form = new ModalFormData().title("Faction Promote - Select a player to promote");

    const plList = [...fac.playerList];
    const playerPerm = plList.find((p) => p.name === player.name)!.permission;
    const strFacRank = getTypedKeys(factionRank);
    const rank = playerPerm < factionRank.Leader ? strFacRank.filter((r) => factionRank[r] < playerPerm - 1) : strFacRank;

    for (const p of plList) {
        form.dropdown(p.name, p.permission < playerPerm ? rank : [p.getRankName()]);
    }

    const res = await form.show(player);
    if (res.canceled || !res.formValues)
		return;

    if (!db_faction.has(fac.name))
        return tellraw(player, "Error: faction was deleted while you were doing this");

    fac.remove_to_update_faction();

    let haveLeader = false;

    for (let [playerIndex, rankValue] of res.formValues.entries() as IterableIterator<[number, keyof typeof factionRank]>) {
        const target = fac.playerList.find((p) => p.name === plList[playerIndex].name);

        if (!target || target.getRankName() === res.formValues[playerIndex])
			continue;

        tellraw(player, `§eFaction §a${fac.name} §e${plList[playerIndex].name} rank changed to §a${rankValue}`);

        if (rankValue === strFacRank[factionRank.Leader] && !haveLeader) {
            haveLeader = true;
        } else if (rankValue === strFacRank[factionRank.Leader] && haveLeader) {
            tellraw(player, "§cFaction already has a leader, rank changed to Officer");
            rankValue = strFacRank[factionRank.Officer];
        }

        target.permission = factionRank[rankValue];
    }

	if (!haveLeader) {
		const perm = fac.playerList.reduce((highestPermPlayer, currentPlayer) => {
			return currentPlayer.permission > highestPermPlayer.permission ? currentPlayer : highestPermPlayer;
		}, fac.playerList[0]);		
		perm.permission = factionRank.Leader;
		tellraw(player, `§cDue to no leader, ${perm.name} is now the leader`);
	}

    fac.add_to_update_faction();
}