import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { concatenateArgs, log, tellraw } from "../../Object/tool/tools";
import { DB } from "../../Object/database/database";
import { translate } from "../../Object/tool/lang";
import { BFActionFormData, BFModalFormData } from "../../Object/formQueue/formQueue";
import { find_warp_UI } from "../../Object/tool/find_waps_UI";
import { Warp } from "../../Object/warp/Warp";
import { addSubCommand } from "../CommandManager";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";
import { WarpNotEmpty } from "./_UtilsWarp";

addSubCommand(
    "close",
    "close or open a warp, (player without admin permission can't use a closed warp)",
    `${globalThis.prefix}warp edit close [name] | ${globalThis.prefix}warp edit open [name]`,
    ["close", "open", "c", "o"],
    cmd_module.warp,
    cmd_permission.admin,
    true,
    true,
    Wclose,
    [["warp", "w"], ["edit", "e"]],
    WarpNotEmpty
)

function Wclose(args: string[], player: Player, ply: Ply) {
	if (args.length === 3)
        WManageCloseUI(player, ply);
    else
        WcloseCommand(args, player, ply)
}

function WManageCloseUI(player: Player, ply: Ply) {
    new BFActionFormData()
    .title("WarpClose")
    .button("List All Warp")
    .button("Find A Warp")
    .show(player).then(async res => {
        if (res.canceled || !res.selection) return

        if (res.selection === 0) {
            const form = new BFActionFormData()
                .title("List Warp")
            const lstW = Array.from(DB.db_warp.values())
            for (const w of lstW) {
                form.button(w.isOpen ? "§a" : "§c" + w.name)
            }
            form.show(player).then(async res => {
                if (res.canceled || !res.selection) return Wclose(["w", "e", "c"], player, ply);
                const warp = DB.db_warp.get(lstW[res.selection].name)
                if (!warp) return log("§cError Cannot find Warp [WcloseUI]")
                WcloseUI(warp, player, ply);
            })
        }
        else {
            const warp = await find_warp_UI(player, true);
            if (!warp) return Wclose(["w", "e", "c"], player, ply);
            WcloseUI(warp, player, ply);
        }
    })
}

function WcloseUI(warp: Warp, player: Player, ply: Ply) {
    new BFModalFormData()
        .title("Close/Open Warp")
        .toggle("isOpen", warp.isOpen)
        .show(player).then(res => {
            if (res.canceled || !res.formValues) return Wclose(["w", "e", "c"], player, ply)

            if (res.formValues[0] !== warp.isOpen) {
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
        })
}

function WcloseCommand(args: string[], player: Player, ply: Ply) {
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