import { Player } from "@minecraft/server";
import { DB_Map, cmd_module, cmd_permission } from "../../Object/database/db_map";
import { addSubCommand } from "../CommandManager";
import { Ply } from "../../Object/player/Ply";
import { DB } from "../../Object/database/database";
import { Warp } from "../../Object/warp/Warp";
import { Delay } from "../../Object/player/Delay";
import { Display } from "../../Object/display/Display";
import { Admin } from "../../Object/player/Admin";
import { Faction } from "../../Object/faction/Faction";
import { colorizeJSON, log } from "../../Object/tool/tools";

addSubCommand(
    "db",
    "debug database",
    "+db <db_name> [nu page]",
    ["db"],
    cmd_module.dev,
    cmd_permission.admin,
    true,
    false,
    db,
    [["manage"]]
)

function db(args: string[], player: Player, ply: Ply) {
    DB_Map.initDB_map();
    Ply.initDB_player();
    Warp.initDB_warp();
    Delay.initDB_delay();
    Display.initDB_display();
    Admin.initDB_admin();
    Faction.initDB_faction();

    if (args.length < 2)
        return;
    switch (args[2]) {
        case "map" : {
            log(colorizeJSON(JSON.stringify(DB.db_map, null, 8)));
        }
        case "player" : {
            let i = 0;
            if (args.length == 4 && args[3].match(/[0-9]/g)) {
                i = parseInt(args[3]);
            }
            log("i : " + i + " args3 : " + args[3]);
            if (DB.db_player.size - 1 >= i) {
                log(colorizeJSON(JSON.stringify(Array.from(DB.db_player.values())[i], null, 8)));
                i++;
            }
            log("§6 Length : " + DB.db_player.size);
            break;
        }
        case "warp" : {
            let i = 0;
            if (args.length == 4 && args[3].match(/[0-9]/g)) {
                i = parseInt(args[3]);
            }
            if (DB.db_warp.size - 1 >= i) {
                log(colorizeJSON(JSON.stringify(Array.from(DB.db_warp.values())[i], null, 8)));
                i++;
            }
            log("§6 Length : " + DB.db_warp.size);
            break;
        }
        case "delay" : {
            let i = 0;
            if (args.length == 4 && args[3].match(/[0-9]/g)) {
                i = parseInt(args[3]);
            }
            if (DB.db_delay.size - 1 >= i) {
                log(colorizeJSON(JSON.stringify(Array.from(DB.db_delay.values())[i], null, 8)));
                i++;
            }
            log("§6 Length : " + DB.db_delay.size);
            break;
        }
        case "display" : {
            let i = 0;
            if (args.length == 4 && args[3].match(/[0-9]/g)) {
                i = parseInt(args[3]);
            }
            if (DB.db_display.size() - 1 >= i) {
                log(colorizeJSON(JSON.stringify(Array.from(DB.db_display.values())[i], null, 8)));
                i++;
            }
            log("§6 Length : " + DB.db_display.size);
            break;
        }
        case "faction" : {
            let i = 0;
            if (args.length == 4 && args[3].match(/[0-9]/g)) {
                i = parseInt(args[3]);
            }
            if (DB.db_faction.size - 1 >= i) {
                log(colorizeJSON(JSON.stringify(Array.from(DB.db_faction.values())[i], null, 8)));
                i++;
            }
            log("§6 Length : " + DB.db_faction.size);
            break;
        }
    }
}