import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { addSubCommand, Command, commands, getSubCommandPerAlias, SubCommand } from "../CommandManager";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";
import { BFActionFormData, BFModalFormData } from "../../Object/formQueue/formQueue";
import { CMDLinker } from "../../Object/link/CMDLinker";
import { DB } from "../../Object/database/database";
import { log, tellraw } from "../../Object/tool/tools";

addSubCommand(
    "add",
    "Link an item to a better faction command",
    `${globalThis.prefix}setting link add`,
    ["add", "a"],
    cmd_module.link,
    cmd_permission.admin,
    true,
    true,
    link_item_to_command,
    [["set", "setting"], ["link", "l"]]
)

async function link_item_to_command(args: string[], player: Player, ply: Ply) {
    try{
        const inventory = player.getComponent("inventory")!.container!;
    let item = inventory.getItem(player.selectedSlotIndex);

    let invItems = [];
    for (let i = 0; i < 36; i++) {
        if (inventory.getItem(i) !== undefined)
        invItems.push(inventory.getItem(i)!.typeId);
    }

    let selectedItem: string | undefined = undefined;

    if (item !== undefined) {
        const res = await new BFActionFormData()
        .title("Item Selection")
        .body("Selected Item Detected, Do you want to link this item to a command?")
        .button("Yes : " + item.typeId.match(/(?<=:).*/)![0])
        .button("No (Select another from inventory)")
        .show(player);

        if (res.canceled) return;

        if (res.selection === 0)
            selectedItem = item.typeId;
    }

    if (selectedItem === undefined) {
        const res = await new BFModalFormData()
        .title("Item Selection")
        .dropdown("Select an item", invItems)
        .show(player);

        if (res.canceled) return;

        log("slot : " + res.formValues![0]);

        selectedItem = invItems[res.formValues![0] as number];
        log("selectedItem : " + selectedItem);
    }

    if (DB.db_link.has(selectedItem)) return tellraw(player, "§cThis item is already linked to a command");

    const selectedCommand = await getCommand(ply, player);

    if (selectedCommand === undefined || selectedCommand.length === 0) return;

    const confirmForm = await new BFActionFormData()
    .title("Link Confirmation")
    .body("§eLinking §s" + selectedItem.match(/(?<=:).*/)![0] + "§e to §s" + selectedCommand + " §eCommand")
    .button("§aConfirm")
    .button("§cCancel")
    .show(player);

    if (confirmForm.canceled || confirmForm.selection === 1) return;

    CMDLinker.add_link(new CMDLinker(selectedCommand, selectedItem));} catch (error) { if (error instanceof Error) log(error.stack!); }
}


async function getCommand(ply:Ply, player:Player) {
    try {

        let cursor: SubCommand = commands;
        let cmdStrings: string[] = ["all"];
    
        let commandSelected = false;
    
        while (!commandSelected && cursor instanceof Map) {
            const form = new BFActionFormData()
            .title("Select a command")
            .body("Current command: " + cmdStrings.join(" "))
            .button("§aUse this command");
    
            let cmds = getSubCommandPerAlias(cursor, ply, player, false);
            for (const cmd of cmds.seenCommands) {
                form.button("§e" + cmd.command + " §o§7(Command)");
            }
            for (const cmd of cmds.seenSubCommands) {
                form.button("§e" + cmd.keys[0] + " §o§7(SubCommand)");
            }
    
            const dataForm = await form.show(player);
    
            if (dataForm.canceled || dataForm.selection === undefined) return;
    
            if (dataForm.selection === 0) {
                commandSelected = true;
                break;
            }

    
            if (dataForm.selection > cmds.seenCommands.length) {
                cursor = cursor.get(cmds.seenSubCommands[dataForm.selection - cmds.seenCommands.length - 1].keys[0]) as SubCommand;
                cmdStrings.push(cmds.seenSubCommands[dataForm.selection - cmds.seenCommands.length - 1].keys[0]);
            } else {
                cursor = cmds.seenCommands[dataForm.selection - 1];
                cmdStrings.push(cmds.seenCommands[dataForm.selection - 1].command);
                commandSelected = true;
            }
        }

        log(cmdStrings.join(" "));

        if (cmdStrings.length > 1) cmdStrings.shift();

        return cmdStrings.join(" ");
    }
    catch (error) {
        if (error instanceof Error) log(error.message + " \n§c" + error.stack!);
    }
}