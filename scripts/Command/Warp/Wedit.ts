import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { canBeParseInt, concatenateArgs, log, tellraw } from "../../Object/tool/tools";
import { DB } from "../../Object/database/database";
import { translate } from "../../Object/tool/lang";
import { BFActionFormData, BFModalFormData } from "../../Object/formQueue/formQueue";
import { find_warp_UI } from "../../Object/tool/find_waps_UI";
import { Warp } from "../../Object/warp/Warp";
import { addSubCommand } from "../CommandManager";
import { cmd_module, cmd_permission, db_map } from "../../Object/database/db_map";
import { WarpNotEmpty } from "./_UtilsWarp";
import { formatCreationDate, formatCreationFullDate } from "../../Object/tool/dateTools";

addSubCommand(
    "setting",
    "close or open a warp, (player without admin permission can't use a closed warp)",
    `${globalThis.prefix}warp setting close [name] | ${globalThis.prefix}warp setting open [name]`,
    ["setting", "set"],
    cmd_module.warp,
    cmd_permission.admin,
    true,
    true,
    Wsetting,
    [["warp", "w"], ["edit", "e"]],
    WarpNotEmpty
)

function Wsetting(args: string[], player: Player, ply: Ply) {
	if (args.length === 3)
        WManageCloseUI(player, ply);
    else
        WsettingCommand(args, player, ply)
}

function WManageCloseUI(player: Player, ply: Ply) {
    new BFActionFormData()
    .title("WarpClose")
    .button("List All Warp")
    .button("Find A Warp")
    .show(player).then(async res => {
        if (res.canceled || res.selection === undefined) return

        if (res.selection === 0) {
            const form = new BFActionFormData()
                .title("List Warp")
            const lstW = Array.from(DB.db_warp.values())
            for (const w of lstW) {
                form.button(w.pos.getDimColor() + w.name + " " + w.isOpen ? "§aOpen" : "§cClose" + "\n§b" + w.pos.toString());
            }
            form.show(player).then(async res => {
                if (res.canceled || res.selection === undefined) return Wsetting(["w", "e", "c"], player, ply);
                const warp = DB.db_warp.get(lstW[res.selection].name)
                if (!warp) return log("§cError Cannot find Warp [WsettingUI]")
                WsettingUI(warp, player, ply);
            })
        }
        else {
            const warp = await find_warp_UI(player, true);
            if (!warp) return Wsetting(["w", "e", "c"], player, ply);
            WsettingUI(warp, player, ply);
        }
    })
}

function WsettingUI(warp: Warp, player: Player, ply: Ply) {
    new BFModalFormData()
        .title(`Warp settingor\nWarp Created by ${warp.creator} the ${formatCreationFullDate(warp.creationDate, db_map.UTC)}\nLast setting : ${formatCreationFullDate(warp.editionDate, db_map.UTC)}`)
        .textField("Warp Name", "enter a warp name", warp.name)
        .toggle("Warp location : \n " + warp.pos.getDimColor() + warp.pos.dim + "\n §b" + warp.pos.toString() + "\nChange location to your current location", false)
        .textField("delay before re-using (in seconds)", DB.db_map.warpDelay.toString(), warp.delay.toString())
        .toggle("Display Message On Tp", warp.displayMessageOnTp)
        .textField("displayed message", `Hello World !`, warp.message)
        .toggle("isOpen", warp.isOpen)
        .show(player).then(res => {
            if (res.canceled || !res.formValues) return Wsetting(["w", "e", "c"], player, ply)

            if (res.formValues[0] !== warp.name)
                if (DB.db_warp.has(res.formValues[0] as string))
                    return tellraw(player.name, "§cYou can't name 2 warp with the same name")
            
            if (res.formValues[0] === warp.name &&
                res.formValues[1] === false &&
                res.formValues[2] === warp.delay.toString() &&
                res.formValues[3] === warp.displayMessageOnTp &&
                res.formValues[4] === warp.message &&
                res.formValues[5] === warp.isOpen)
                return;

            const isNewName = res.formValues[0] !== warp.name; // warp.name is the key
            isNewName ? Warp.remove_warp(warp) : warp.remove_to_update_warp();

            warp.name = res.formValues[0] as string;
            if (res.formValues[1]) warp.pos.updatePos(player.location).updateDim(player.dimension).normalize();
            if (canBeParseInt(res.formValues[2] as string)) warp.delay = parseInt(res.formValues[2] as string);
            else tellraw(player.name, "§cInvalid delay format");
            warp.displayMessageOnTp = res.formValues[3] as boolean;
            warp.message = res.formValues[4] as string;
            warp.isOpen = res.formValues[5] as boolean;

            warp.editionDate = Date.now();

            isNewName ? Warp.add_warp(warp) : warp.add_to_update_warp();

            tellraw(player.name, "§aWarp '" + warp.name +"' has been edited.");
        })
}

function WsettingCommand(args: string[], player: Player, ply: Ply) {
    const name = concatenateArgs(args, 2, (s) => s.replace(/"/g, ""));
	let warp = DB.db_warp.get(name);
	if (warp != undefined) {
		warp.remove_to_update_warp();
		if (warp.isOpen) {
			warp.isOpen = false;
			tellraw(player.name, translate(ply.lang, warp.name).warp_close);
		}
		else {
			warp.isOpen = true;
			tellraw(player.name, translate(ply.lang, warp.name).warp_open);
		}
		warp.add_to_update_warp();
	}
	else {
		tellraw(player.name, translate(ply.lang).error_find_warp);
	}
}