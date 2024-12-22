import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { BFActionFormData } from "../../Object/formQueue/formQueue";
import { DB } from "../../Object/database/database";
import { CMDLinker } from "../../Object/link/CMDLinker";
import { addSubCommand } from "../CommandManager";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";
import { hasAtLeastOneLink } from "./_UtilsSettings";

addSubCommand(
    "remove",
    "Remove a link",
    `${globalThis.prefix}setting link remove`,
    ["remove", "r"],
    cmd_module.link,
    cmd_permission.admin,
    true,
    true,
    remove_link_to_item,
    [["set", "setting"], ["link", "l"]],
    hasAtLeastOneLink
)

function remove_link_to_item(args: string[], player: Player, ply: Ply) {
    let listLink: CMDLinker[] = [];
    Array.from(DB.db_link.values()).forEach((link) => {
        listLink.push(link);
    });
    
    const form = new BFActionFormData()
        .title("Remove Link")
        .body("Select a link to remove")
        
    listLink.forEach(link => {
        form.button(link.item_id.match(/(?<=:).*/)![0] + " -> " + link.cmd);
    });

    form.show(player).then(async (res) => {
        if (res.canceled) return;
        const selectedLink = listLink[res.selection!];
        CMDLinker.remove_link(DB.db_link.get(selectedLink.item_id));
        player.sendMessage("§aLink removed");
    });
}
    