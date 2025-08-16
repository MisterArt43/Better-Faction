import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { UI_find_player } from "../../Object/tool/find_players_UI";
import { canBeParseInt, concatenateArgs, log, tellraw } from "../../Object/tool/tools";
import { DB } from "../../Object/database/database";
import { BFActionFormData, BFModalFormData } from "../../Object/formQueue/formQueue";
import { formatCreationFullDate } from "../../Object/tool/dateTools";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";
import { Faction, faction_member, factionRank } from "../../Object/faction/Faction";
import { Chunk } from "../../Object/chunk/Chunk";
import { addSubCommand } from "../CommandManager";

addSubCommand(
    "player",
    "manage a player",
    `${globalThis.prefix}admin manage player [player]`,
    ["player", "p"],
    cmd_module.commoncommand,
    cmd_permission.admin,
    true,
    true,
    ManagePlayer,
    [["admin", "adm"], ["manage", "m"]],
    undefined,
    -1
)


async function ManagePlayer(args: string[], player: Player, ply: Ply) {
    let targetPly: Ply | undefined;
    // log(args.join("/"));
    // if (args.length === 3) {
        targetPly = await UI_find_player(player);
    // } else {
    //     targetPly = DB.db_player.get(concatenateArgs(args, 3, (s) => s.replace(/["@]/g, "")));
    // }

    if (!targetPly) return tellraw(player, "§cPlayer not found");

    new BFActionFormData()
    .title("Player info")
    .body("Player:§7 " + targetPly.name + "\n" +
    "§eUUID:§7 " + targetPly.id + "\n" +
    "§eFirst connection:§7 " + formatCreationFullDate(targetPly.dateJoin, DB.db_map.UTC) + "\n" +
    "§eLast connection:§7 " + formatCreationFullDate(targetPly.lastConnect, DB.db_map.UTC) + "\n" +
    "§ePlaytime:§7 " + targetPly.timePlayed + " minutes" + "\n" +
    "§eDeaths:§7 " + targetPly.deathCount + "\n" +
    "§eKills:§7 " + targetPly.killCount + "\n" +
    "§eis Muted:§7 " + targetPly.isMute + "\n" +
    "§ewarns:§7 " + targetPly.warn + "\n" +
    "§eMoney:§7 " + targetPly.money + "\n" +
    ("§eFaction:§7 " + targetPly.faction_name === null ? "None" : "Faction :§7 " + targetPly.faction_name + "\n") +
    "§epower:§7 " + targetPly.power + "\n" +
    "§eHome limit:§7 " + targetPly.homeLimit + "\n" +
    targetPly.home.map((home, index) => " - Home " + index + ":§7 " + home.name + " at " + home.x + " " + home.y + " " + home.z + " in " + home.dim + "\n").join("") +
    "§eLast message:§7 " + targetPly.lastMessage + "\n" +
    "§eBack location:§7 " + targetPly.back.x + " " + targetPly.back.y + " " + targetPly.back.z + " in " + targetPly.back.dim + "\n" +
    "§eChat:§7 " + targetPly.chat + "\n" +
    "§epermission:§7 " + Object.keys(cmd_permission).find((key) => cmd_permission[key as keyof typeof cmd_permission] === targetPly.permission) + "\n" +
    "§emodules:§7 " + targetPly.cmd_module.map((module) => Object.keys(cmd_module).find((key) => cmd_module[key as keyof typeof cmd_module] === module)).join(", ")
    + ( targetPly.isBanned ? "\n\n§cPlayer is banned\nReason:§7 " + targetPly.banReason + "\nDate: " + formatCreationFullDate(targetPly.banDate, DB.db_map.UTC) : "")
    )
    .button("§cban")
    .button("§cunban")

    .button("§cwarn")

    .button("§cmute")
    .button("§cunmute")

    .button("§csetmoney")

    .button("§cforce join faction")
    .button("§cpower")
    .button("§cforce quit faction")

    .button("§chome limit")
    .button("§cdelhome")
    
    .button("§cchat")
    
    .button("§cpermission")
    .button("§cmodule")
    
    .button("§cdelete player")

    .show(player).then(res => {
        if (!res.selection || res.canceled) return;

        switch (res.selection) {
            case 0: banPlayer(targetPly, player, ply); break;
            case 1: unbanPlayer(targetPly, player, ply); break;

            case 2: warnPlayer(targetPly, player, ply); break;

            case 3: mutePlayer(targetPly, player, ply); break;
            case 4: unmutePlayer(targetPly, player, ply); break;

            case 5: setMoney(targetPly, player, ply); break;

            case 6: setFaction(targetPly, player, ply); break;
            case 7: setPower(targetPly, player, ply); break;
            case 8: forceQuitFaction(targetPly, player, ply); break;

            case 9: setHomeLimit(targetPly, player, ply); break;
            case 10: deleteHome(targetPly, player, ply); break;

            case 11: setChat(targetPly, player, ply); break;

            case 12: setPermission(targetPly, player, ply); break;
            case 13: setModule(targetPly, player, ply); break;

            case 14: deletePlayer(targetPly, player, ply); break;
        }
    })
}

function banPlayer(targetPly: Ply, player: Player, ply: Ply) {
    if (targetPly.isBanned) return tellraw(player, "§cPlayer is already banned");

    if (targetPly.permission <= cmd_permission.admin) return tellraw(player, "§cYou can't ban an admin");

    new BFModalFormData()
    .title("Ban player")
    .textField("Reason", "No reason")
    .submitButton("§cBan")
    .show(player).then(res => {
    
        if (!res.formValues || res.canceled) return;
    
        targetPly.remove_to_update_player();
        targetPly.isBanned = true;
        targetPly.banReason = res.formValues[0] as string;
        targetPly.banDate = Date.now();
        targetPly.add_to_update_player();
        tellraw(player, "§aPlayer banned");
        log(targetPly.name + " has been banned by " + ply.name + " for " + targetPly.banReason);
    })
}

function unbanPlayer(targetPly: Ply, player: Player, ply: Ply) {
    if (!targetPly.isBanned) return tellraw(player, "§cPlayer is not banned");

    targetPly.remove_to_update_player();
    targetPly.isBanned = false;
    targetPly.banReason = "";
    targetPly.banDate = 0;
    targetPly.add_to_update_player();
    tellraw(player, "§aPlayer unbanned");
    log(targetPly.name + " has been unbanned by " + ply.name);
}

function warnPlayer(targetPly: Ply, player: Player, ply: Ply) {
    targetPly.remove_to_update_player();
    targetPly.warn++;
    targetPly.add_to_update_player();
    tellraw(player, "§aPlayer warned");
    tellraw(targetPly.name, "§cYou have been warned");
    log(targetPly.name + " has been warned by " + ply.name);
}

function mutePlayer(targetPly: Ply, player: Player, ply: Ply) {
    targetPly.remove_to_update_player();
    targetPly.isMute = true;
    targetPly.add_to_update_player();
    tellraw(player, "§aPlayer muted");
    tellraw(targetPly.name, "§cYou have been muted");
    log(targetPly.name + " has been muted by " + ply.name);
}

function unmutePlayer(targetPly: Ply, player: Player, ply: Ply) {
    targetPly.remove_to_update_player();
    targetPly.isMute = false;
    targetPly.add_to_update_player();
    tellraw(player, "§aPlayer unmuted");
    tellraw(targetPly.name, "§aYou have been unmuted");
    log(targetPly.name + " has been unmuted by " + ply.name);
}

function setMoney(targetPly: Ply, player: Player, ply: Ply) {
    new BFModalFormData()
    .title("Set money")
    .textField("Amount", "0")
    .submitButton("§cSet")
    .show(player).then(res => {
    
        if (!res.formValues || res.canceled) return;
    
        if (!canBeParseInt(res.formValues[0] as string)) return tellraw(player, "§cInvalid amount");

        targetPly.remove_to_update_player();
        targetPly.money = parseInt(res.formValues[0] as string);
        targetPly.add_to_update_player();
        tellraw(player, "§aPlayer money set to " + targetPly.money);
        tellraw(targetPly.name, "§aYour money has been set to " + targetPly.money);
        log(targetPly.name + " money set to " + targetPly.money + " by " + ply.name);
    })
}

function setFaction(targetPly: Ply, player: Player, ply: Ply) {

    if (targetPly.faction_name !== null) return tellraw(player, "§cPlayer is already in a faction");

    const factionList = Array.from(DB.db_faction.keys()).sort();
    const rank = Object.keys(factionRank) as [keyof typeof factionRank];

    new BFModalFormData()
    .title("Set faction")
    .dropdown("Faction", factionList)
    .dropdown("Rank", rank)
    .submitButton("§cSet")
    .show(player).then(res => {
    
        if (!res.formValues || res.canceled) return;
    
        const faction = DB.db_faction.get(res.formValues[0] as string);
        if (!faction) return tellraw(player, "§cInvalid faction");

        targetPly.remove_to_update_player();
        targetPly.faction_name = faction.name;
        targetPly.add_to_update_player();

        faction.remove_to_update_faction();
        faction.playerList.push(new faction_member(targetPly.name, res.formValues[1] as typeof factionRank[keyof typeof factionRank]));
        faction.add_to_update_faction();

        if (res.formValues[1] === factionRank.Leader) {
            faction.getMembersFromRank(factionRank.Leader).forEach(member => {
                if (member.name !== targetPly.name) {
                    member.permission = factionRank.Officer;
                    tellraw(member.name, "§cYou have been demoted to officer because a new leader has been set");
                }
            });
        }

        tellraw(player, "§aPlayer faction set to " + faction.name);
        tellraw(targetPly.name, "§aYou have been set to " + faction.name);
        log(targetPly.name + " has been set to " + faction.name + " by " + ply.name);
    })
}

function setPower(targetPly: Ply, player: Player, ply: Ply) {
    new BFModalFormData()
    .title("Set power")
    .textField("Power", "0", {defaultValue: targetPly.power.toString()})
    .submitButton("§cSet")
    .show(player).then(res => {
    
        if (!res.formValues || res.canceled) return;
    
        if (!canBeParseInt(res.formValues[0] as string)) return tellraw(player, "§cInvalid power");

        targetPly.remove_to_update_player();
        targetPly.setPower(parseInt(res.formValues[0] as string));
        targetPly.add_to_update_player();

        tellraw(player, "§aPlayer power set to " + targetPly.power);
        tellraw(targetPly.name, "§aYour power has been set to " + targetPly.power);
        log(targetPly.name + " power set to " + targetPly.power + " by " + ply.name);
    })
}

async function forceQuitFaction(targetPly: Ply, player: Player, ply: Ply) {
    if (targetPly.faction_name === null) return tellraw(player, "§cPlayer is not in a faction");

    const faction = DB.db_faction.get(targetPly.faction_name);
    if (!faction) return tellraw(player, "§cInvalid faction, this should not happen please contact a developer");

    if (faction.getRankFromName(targetPly.name) === undefined) return tellraw(player, "§cFatal error, the player is not in the faction, please contact a developer");
    if (faction.getRankFromName(targetPly.name) === factionRank.Leader) {
        const res = await new BFActionFormData().title("Are you sure ?").body("You are about to force quit a leader, this will delete the faction").button("§cYes").button("§cNo").show(player);
        if (!res.selection || res.canceled) return;
        if (res.selection === 1) return;

        faction.playerList.forEach(member => {
            const ply = DB.db_player.get(member.name);
            if (!ply) return;
            ply.remove_to_update_player();
            ply.faction_name = null;
            ply.add_to_update_player();
            tellraw(ply.name, "§cThe faction has been deleted, you have been removed from it");
        });
        faction.claim.forEach(claim => {
            Chunk.remove_chunk(claim);
        });

        Faction.remove_faction(faction);
        tellraw(player, "§aFaction deleted");
        log(faction.name + " has been deleted by " + ply.name + " by force quit");
        return;
    }

    targetPly.remove_to_update_player();
    targetPly.faction_name = null;
    targetPly.add_to_update_player();

    faction.remove_to_update_faction();
    faction.playerList = faction.playerList.filter(member => member.name !== targetPly.name);
    faction.add_to_update_faction();

    tellraw(player, "§aPlayer has been removed from his faction");
    tellraw(targetPly.name, "§aYou have been removed from your faction");
    log(targetPly.name + " has been removed from his faction by " + ply.name);
}

function setHomeLimit(targetPly: Ply, player: Player, ply: Ply) {
    new BFModalFormData()
    .title("Set home limit")
    .textField("Limit", "0", {defaultValue: targetPly.homeLimit.toString()})
    .submitButton("§cSet")
    .show(player).then(res => {
    
        if (!res.formValues || res.canceled) return;
    
        if (!canBeParseInt(res.formValues[0] as string)) return tellraw(player, "§cInvalid limit");
        if (parseInt(res.formValues[0] as string) < 0) return tellraw(player, "§cLimit must be positive");

        targetPly.remove_to_update_player();
        targetPly.homeLimit = parseInt(res.formValues[0] as string);
        targetPly.add_to_update_player();

        tellraw(player, "§aPlayer home limit set to " + targetPly.homeLimit);
        tellraw(targetPly.name, "§aYour home limit has been set to " + targetPly.homeLimit);
        log(targetPly.name + " home limit set to " + targetPly.homeLimit + " by " + ply.name);
    })
}

function deleteHome(targetPly: Ply, player: Player, ply: Ply) {
    new BFModalFormData()
    .title("Delete home")
    .dropdown("Home", targetPly.home.map(home => home.name + " at " + home.x + " " + home.y + " " + home.z + " in " + home.dim))
    .submitButton("§cDelete")
    .show(player).then(res => {
    
        if (!res.formValues || res.canceled) return;
    
        const homeIndex = parseInt(res.formValues![0] as string);
        const home = targetPly.home[homeIndex];
        if (!home) return tellraw(player, "§cInvalid home");

        targetPly.remove_to_update_player();
        targetPly.home = targetPly.home.filter(h => h.name !== home.name);
        targetPly.add_to_update_player();

        tellraw(player, "§aHome deleted");
        tellraw(targetPly.name, "§aYour home " + home.name + " has been deleted");
        log(targetPly.name + " home " + home.name + " has been deleted by " + ply.name);
    })
}

function setChat(targetPly: Ply, player: Player, ply: Ply) {
    new BFModalFormData()
    .title("Set chat")
    .dropdown("Chat", ["all", "faction", "ally"], {defaultValueIndex: targetPly.chat === "all" ? 0 : 1})
    .submitButton("§cSet")
    .show(player).then(res => {
    
        if (!res.formValues || res.canceled) return;
    
        targetPly.remove_to_update_player();
        targetPly.chat = res.formValues[0] as string;
        targetPly.add_to_update_player();

        tellraw(player, "§aPlayer chat set to " + targetPly.chat);
        tellraw(targetPly.name, "§aYour chat has been set to " + targetPly.chat);
        log(targetPly.name + " chat set to " + targetPly.chat + " by " + ply.name);
    })
}

function setPermission(targetPly: Ply, player: Player, ply: Ply) {
    const permission = Object.keys(cmd_permission) as [keyof typeof cmd_permission];

    new BFModalFormData()
    .title("Set permission")
    .dropdown("Permission", permission, {defaultValueIndex: permission.indexOf(Object.keys(cmd_permission).find((key) => cmd_permission[key as keyof typeof cmd_permission] === targetPly.permission) as keyof typeof cmd_permission)})
    .submitButton("§cSet")
    .show(player).then(res => {
    
        if (!res.formValues || res.canceled) return;

        targetPly.remove_to_update_player();
        targetPly.permission = cmd_permission[permission[res.formValues[0] as number]];
        targetPly.add_to_update_player();

        tellraw(player, "§aPlayer permission set to " + permission[res.formValues[0] as number]);
        tellraw(targetPly.name, "§aYour permission has been set to " + permission[res.formValues[0] as number]);
        log(targetPly.name + " permission set to " + permission[res.formValues[0] as number] + " by " + ply.name);
    })
}

function setModule(targetPly: Ply, player: Player, ply: Ply) {
    const module = Object.keys(cmd_module) as [keyof typeof cmd_module];

    const form = new BFModalFormData()
    .title("Set module")
    
    for (const mod of module) {
        form.toggle(mod, {defaultValue: targetPly.cmd_module.includes(cmd_module[mod]) || targetPly.cmd_module.includes(cmd_module.all)})
    }

    form.submitButton("§cSet")
    .show(player).then(res => {
    
        if (!res.formValues || res.canceled) return;

        targetPly.remove_to_update_player();
        targetPly.cmd_module = [];
        
        if (res.formValues.every((value) => value === true) || res.formValues[0] === true) {
            targetPly.cmd_module.push(cmd_module.all);
        } else {
            for (let i = 0; i < module.length; i++) {
                if (res.formValues[i]) {
                    targetPly.cmd_module.push(cmd_module[module[i]]);
                }
            }
        }
    })

    tellraw(player, "§aPlayer module edited");
    tellraw(targetPly.name, "§aYour module has been edited");
    log(targetPly.name + " module edited by " + ply.name);
}

async function deletePlayer(targetPly: Ply, player: Player, ply: Ply) {
    if (targetPly.permission <= cmd_permission.admin) return tellraw(player, "§cYou can't delete an admin");
    const res = await new BFActionFormData().title("Are you sure ?").body("You are about to delete a player, all his data will be definitively lost").button("§cYes").button("§cNo").show(player);
        if (!res.selection || res.canceled) return;
        if (res.selection === 1) return;

        if (targetPly.faction_name !== null) {
            const faction = DB.db_faction.get(targetPly.faction_name);
            if (faction && faction.getRankFromName(targetPly.name) === factionRank.Leader) {
                const facRes = await new BFActionFormData().title("Are you sure ?").body("You are about to delete a leader, this will delete the faction").button("§cYes").button("§cNo").show(player)

                if (!facRes.selection || facRes.canceled) return;
                if (facRes.selection === 1) return;

                Faction.remove_faction(faction);
            }
            else if (faction) {
                faction.remove_to_update_faction();
                faction.playerList = faction.playerList.filter(member => member.name !== targetPly.name);
                faction.add_to_update_faction();
            }
        }

        Ply.remove_player(targetPly);
        tellraw(player, "§aPlayer deleted");
        log("§l" + targetPly.name + " has been deleted by " + ply.name);
}