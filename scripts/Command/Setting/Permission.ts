import { Player } from "@minecraft/server";
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
    `${globalThis.prefix}`,
    ["permission", "perm", "p"],
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

    new BFActionFormData().title("Select a method")
        .button("List all Admin")
        .button("Players with Permissions")
        .button("Find a player")
        .show(player).then(res => {
            if (res.canceled) return;

            if (res.selection === 0)
                return generateEditPermForm(player, ply, (player: Player, ply: Ply) => { return ply.permission === cmd_permission.admin});
            else if (res.selection === 1)
                return generateEditPermForm(player, ply, (player: Player, ply: Ply) => { return ply.permission !== cmd_permission.member});
            else
                manageplayerPerm(player, ply);
        }) 
}

const permissionText : string[] = Object.keys(cmd_permission)

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

type Condition = (player : Player, ply: Ply) => boolean

async function generateEditPermForm(player: Player, ply: Ply, condition: Condition) {
    const PlayerList = Array.from(db_player.values());
    const FilteredList : Ply[] = new Array();
    
    const form = new BFModalFormData().title("Edit Permission");
    
    let i = 0;
    for (const pl of PlayerList) {
        if (condition(player, pl)) {
            if (ply.permission < pl.permission || ply.permission >= cmd_permission.owner) {
                form.dropdown(pl.name, permissionText, pl.permission)
                FilteredList.push(pl);
            }
        }
        if (++i % 25 === 0) await sleep(1);
    }

    form.show(player).then(async res => {
        if (res.canceled || res.formValues === undefined) return;
        for (let i = 0; i < FilteredList.length; i++) {
            if (res.formValues[i] as number !== FilteredList[i].permission) {
                let editPly = DB.db_player.get(FilteredList[i].name)!;
                editPly.remove_to_update_player();
                editPly.permission = res.formValues[i] as (typeof cmd_permission[keyof typeof cmd_permission]);
                editPly.add_to_update_player();
                tellraw(player, `§e${editPly.name} §ais now §e${Object.keys(cmd_permission)[editPly.permission]}`);
            }
            if (i % 50 === 0) await sleep(1);
        }
    })
}