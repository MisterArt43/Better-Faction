import { Player } from "@minecraft/server";
import { DB_Map, cmd_module, cmd_permission, db_map, update_db_map } from "../../Object/database/db_map";
import { addSubCommand } from "../CommandManager";
import { db_player, db_player_online, Ply } from "../../Object/player/Ply";
import { DB } from "../../Object/database/database";
import { db_warp, Warp } from "../../Object/warp/Warp";
import { db_delay, Delay } from "../../Object/player/Delay";
import { db_display, Display } from "../../Object/display/Display";
import { db_faction, Faction } from "../../Object/faction/Faction";
import { colorizeJSON, log, Server } from "../../Object/tool/tools";
import { BFActionFormData } from "../../Object/formQueue/formQueue";
import { Chunk, db_chunk } from "../../Object/chunk/Chunk";

addSubCommand(
    "db",
    "debug database",
    "+db <db_name> [nu page]",
    ["db"],
    cmd_module.dev,
    cmd_permission.dev,
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
        case "online" : {
            let i = 0;
            if (args.length == 4 && args[3].match(/[0-9]/g)) {
                i = parseInt(args[3]);
            }
            if (DB.db_player_online.size - 1 >= i) {
                log(colorizeJSON(JSON.stringify(Array.from(DB.db_player_online.values())[i], null, 8)));
                i++;
            }
            log("§6 Length : " + DB.db_player_online.size);
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

addSubCommand(
    "resetALL",
    "reset database",
    "+resetALL",
    ["resetALL"],
    cmd_module.dev,
    cmd_permission.dev,
    true,
    true,
    resetDB,
    [["manage"]]
)

function resetDB(args: string[], player: Player, ply: Ply) {
    new BFActionFormData()
    .title("Reset Database")
    .body("Are you sure you want to reset the database ?, you will lose all data without backup")
    .button("Yes", "§aYes")
    .button("No", "§cNo")
    .show(player)
    .then(async res => {
        if (res.canceled || res.selection === 1) return;

        isLoaded = false;
        log("§7§l[DB] §r§aResetting databases...");
        Server.runCommandAsync("scoreboard objectives remove database")
        Server.runCommandAsync("scoreboard objectives remove db_player")
        Server.runCommandAsync("scoreboard objectives remove db_faction")
        Server.runCommandAsync("scoreboard objectives remove db_display")
        Server.runCommandAsync("scoreboard objectives remove db_delay")
        Server.runCommandAsync("scoreboard objectives remove db_admin")
        Server.runCommandAsync("scoreboard objectives remove db_warp")
        Server.runCommandAsync("scoreboard objectives remove db_chunk")

        update_db_map(new DB_Map());
        db_player.clear();
        db_player_online.clear();
        db_faction.clear();
        db_chunk.clear();
        db_warp.clear();
        db_display.db_display_actionbar.clear();
        db_display.db_display_title.clear();
        db_display.db_display_rule = null
        db_delay.clear();
    
        await DB.initialize();
        isLoaded = true;
    })
}