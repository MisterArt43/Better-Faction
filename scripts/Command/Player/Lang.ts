import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { list_lang, translate } from "../../lang";
import { tellraw } from "../../Object/tool/tools";
import { addSubCommand, cmd_permission } from "../CommandManager";
import { cmd_module } from "../../Object/database/db_map";

addSubCommand(
    "lang",
    "Change the Language of the plugin.",
    `${globalThis.prefix}lang [lang]`,
    ["lang", "language", "lgg"],
    cmd_module.lang,
    cmd_permission.member,
    true,
    false,
    lang
);

function lang(args: string[], player: Player, ply: Ply) {
    if (args.length === 2) {
        if (list_lang().includes(args[1])) {
            ply.remove_to_update_player();
            ply.lang = args[1];
            ply.add_to_update_player();
            tellraw(ply.name, translate(ply.lang)?.lang ?? "no translation");
        }
        else {
            tellraw(ply.name, translate(ply.lang)?.error_lang ?? "no translation");
        }
    }
}