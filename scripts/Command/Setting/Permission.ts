import { Player, world } from "@minecraft/server";
import { db_player, Ply } from "../../Object/player/Ply";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";
import { sleep, tellraw } from "../../Object/tool/tools";
import { BFActionFormData, BFModalFormData } from "../../Object/formQueue/formQueue";
import { DB } from "../../Object/database/database";
import { UI_find_player } from "../../Object/tool/find_players_UI";
import { addSubCommand } from "../CommandManager";

addSubCommand(
    "permission",
    "Edit player permission (give right to use Admin, helper, owner,... command)",
    `${globalThis.prefix}set permission`,
    ["permission", "perm"],
    cmd_module.commoncommand,
    cmd_permission.admin,
    true,
    true,
    managePermission,
    [["set", "setting"]]
)

async function managePermission(args: string[], player: Player, ply: Ply) {
    if (ply.permission > cmd_permission.admin)
        return tellraw(player, "§cYou don't have permission to use this command")

    if (args.length === 4) {
        return CmdSetPerm(args, player, ply);
    }

    new BFActionFormData().title("Select a method")
        .button("List all Admin")
        .button("Players with Permissions")
        .button("Find a player")
        .show(player).then(res => {
            if (res.canceled) return;

            if (res.selection === 0)
                return generateEditPermForm(player, ply, (pl: Ply) => { return pl.permission === cmd_permission.admin});
            else if (res.selection === 1)
                return generateEditPermForm(player, ply, (pl: Ply) => { return pl.permission !== cmd_permission.member});
            else
                manageplayerPerm(player, ply);
        }) 
}

const permissionText : string[] = Object.keys(cmd_permission)

async function CmdSetPerm(args: string[], player: Player, ply: Ply) {
    if (args[2].startsWith("@")) {
        switch (args[2]) {
            case "@a": {
                for (const [key, pl] of DB.db_player_online) {
                    CmdSetPerm(["set", "permission", pl.name, args[3]], player, ply);
                }
                return;
            }
            case "@s": {
                args[2] = player.name;
                break
            }
        }
    }
    const target = db_player.get(args[2].replace(/[\"\']/g, ""));

    if (target === undefined )
        return tellraw(player, "§cPlayer not found");

    if (ply.permission <= target.permission && ply.permission > cmd_permission.owner)
        return tellraw(player, "§cYou don't have permission to change this player permission");

    if (!permissionText.includes(args[3]))
        return tellraw(player, "§cPermission not found, please use one of these: \n" + permissionText.join("\n- "));

    if (target.permission === permissionText.indexOf(args[3]))
        return tellraw(player, "§c" + target.name + " already have this permission");

    if (target.permission <= cmd_permission.owner && permissionText.indexOf(args[3]) > cmd_permission.owner) {
        let i = 0;
        let nbOwner = 0;
        for (const [key, pl] of db_player) {
            if (pl.permission <= cmd_permission.owner) nbOwner++;
            if (++i % 500 === 0) {
                await sleep(1);
                tellraw(player, "§7please wait... " + i + "/" + db_player.size + " player permission loaded");
            }
        }
        if (nbOwner === 1)
            return tellraw(player, "§cYou need at least one owner in the server");
    }

    target.remove_to_update_player();
    target.permission = permissionText.indexOf(args[3]) as (typeof cmd_permission[keyof typeof cmd_permission]);
    target.add_to_update_player();

    tellraw(player, `§e${target.name} §ais now §e${args[3]}`);
}

async function manageplayerPerm(player: Player, ply: Ply) {
    const target = await UI_find_player(player);

    if (target === undefined || target.permission <= ply.permission) return;

    new BFModalFormData()
        .title("Edit " + target.name + " Permission")
        .dropdown(target.name, permissionText, target.permission)
        .show(player).then(res => {
            if (res.canceled || !res.formValues || res.formValues[0] === target.permission) return;

            target.remove_to_update_player();
            target.permission = res.formValues[0] as (typeof cmd_permission[keyof typeof cmd_permission]);
            target.add_to_update_player();
            tellraw(player, `§e${target.name} §ais now §e${Object.keys(cmd_permission)[target.permission]}`);
        })
}

type Condition = (ply: Ply) => boolean

async function generateEditPermForm(player: Player, ply: Ply, condition: Condition) {
    const FilteredList : Ply[] = new Array();
    
    const form = new BFModalFormData().title("Edit Permission");
    
    let i = 0;
    let nbOwner = 0;
    for (const [key, pl] of db_player) {
        if (pl.permission <= cmd_permission.owner) nbOwner++;
        if (condition(pl)) {
            if (ply.permission < pl.permission || ply.permission <= cmd_permission.owner) {
                form.dropdown(pl.name, permissionText, pl.permission)
                FilteredList.push(pl);
            }
        }
        if (++i % 500 === 0) {
            await sleep(1);
            tellraw(player, "§7please wait... " + i + "/" + db_player.size + " player permission loaded");
        }
    }

    form.show(player).then(async res => {
        if (res.canceled || res.formValues === undefined) return;
        for (let i = 0; i < FilteredList.length; i++) {
            if (res.formValues[i] as number !== FilteredList[i].permission) {
                let editPly = DB.db_player.get(FilteredList[i].name)!;
                if (editPly.permission <= cmd_permission.owner) {
                    if (res.formValues[i] as number >= cmd_permission.owner && nbOwner === 1) {
                            tellraw(player, "§cyou need at least one owner in the server, keeping " + editPly.name + " as owner");
                            continue;
                    }
                    nbOwner--;
                }
                if (editPly.permission > cmd_permission.owner && res.formValues[i] as number <= cmd_permission.owner) nbOwner++;
                editPly.remove_to_update_player();
                editPly.permission = res.formValues[i] as (typeof cmd_permission[keyof typeof cmd_permission]);
                editPly.add_to_update_player();
                tellraw(player, `§e${editPly.name} §ais now §e${Object.keys(cmd_permission)[editPly.permission]}`);
            }
            if (i % 50 === 0) await sleep(1);
        }
    })
}