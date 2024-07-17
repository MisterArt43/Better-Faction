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
    db
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
    switch (args[1]) {
        case "map" : {
            log(colorizeJSON(JSON.stringify(DB.db_map, null, 8)));
        }
    }
}