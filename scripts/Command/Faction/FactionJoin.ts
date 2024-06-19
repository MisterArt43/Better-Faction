import { Player } from "@minecraft/server";
import { concatFacName, concatenateArgs, sleep, tellraw } from "../../Object/tool/tools";
import { Ply } from "../../Object/player/Ply";
import { DB } from "../../Object/database/database";
import { translate } from "../../Object/tool/lang";
import { Faction, factionRank, faction_member } from "../../Object/faction/Faction";
import { ActionFormData } from "@minecraft/server-ui";
import { addSubCommand } from "../CommandManager";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";

addSubCommand(
    "join",
    "Join a faction.",
    `${globalThis.prefix}faction join <faction>`,
    ["join", "j"],
    cmd_module.faction,
    cmd_permission.member,
    true,
    true,
    Factionjoin,
    [["faction", "f"]]
);

async function Factionjoin(args: string[], player: Player, ply: Ply) {
    if (args.length >= 3) {
        cmdFactionJoin(args, player, ply);
    }
    else {
        factionJoinUI(player, ply);
    }
}

async function factionJoinUI(player: Player, ply: Ply) {
    if (DB.db_faction.has(ply.faction_name ?? "") === false) {
        const listJoinableFaction = new Array<string>();
        let i = 0;
        for (const fac of DB.db_faction.values()) {
            if (fac.isOpen === true) {
                listJoinableFaction.push(fac.name);
            }
            else if (fac.invitList.includes(player.name)) {
                listJoinableFaction.push(fac.name);
            }
            if (i++ % 20 === 0) sleep(1);
        }
        const form = new ActionFormData()
            .title("Join a faction")
        for (const fac of listJoinableFaction) {
            form.button(fac);
        }
        const res = await form.show(player);
        if (res.canceled) return;
        const facName = listJoinableFaction[res.selection!];
        cmdFactionJoin(["f", "j", facName], player, ply);
    }
    else {
        tellraw(player, translate(ply.lang)?.error_have_faction ?? "no translation");
    }
}

function cmdFactionJoin(args: string[], player: Player, ply: Ply) {
    const name = concatFacName(args, 2);

    if (DB.db_faction.has(ply.faction_name ?? "") === false) {
        const fac = DB.db_faction.get(name);

        if (fac !== undefined) {
            const newMember = new faction_member(player.name, factionRank.Visitor);
            const inviteIndex = fac.invitList.findIndex((p) => p === player.name);

            if (fac.isOpen) {
                updatePlayerJoinFaction(player, ply, fac, newMember);
            }
            else {
                if (inviteIndex !== -1) {
                    updatePlayerJoinFaction(player, ply, fac, newMember);
                }
                else {
                    tellraw(player, translate(ply.lang)?.error_faction_join_invit ?? "no translation");
                }
            }
        }
        else {
            tellraw(player, translate(ply.lang)?.error_find_faction ?? "no translation");
        }
    }
    else {
        tellraw(player, translate(ply.lang)?.error_have_faction2 ?? "no translation")
    }
}

function updatePlayerJoinFaction(player: Player, ply: Ply, fac: Faction, newMember: faction_member) {
    if (fac.playerList.length < fac.memberLimit) {
        broadcastRemoveInvite(player.name);
        fac.remove_to_update_faction();
        fac.playerList.push(newMember);
        fac.add_to_update_faction();
        ply.remove_to_update_player();
        ply.faction_name = fac.name;
        ply.add_to_update_player();
        for (const p of fac.playerList) {
            tellraw(p.name, translate(DB.db_player.get(p.name)!.lang, player.name)?.faction_join ?? "no translation");
        }
    }
    else {
        tellraw(player, translate(ply.lang)?.error_faction_join_full ?? "no translation")
    }
}

function broadcastRemoveInvite(playerName: string) {
    let i = 0;
    for (const fac of DB.db_faction.values()) {
        const inviteIndex = fac.invitList.findIndex((p) => p === playerName);
        if (inviteIndex !== -1) {
            fac.remove_to_update_faction();
            fac.invitList.splice(inviteIndex, 1);
            fac.add_to_update_faction();
        }
        if (i++ % 10 === 0) sleep(1);
    }
}