import { Player } from "@minecraft/server";
import { addSubCommand } from "../CommandManager";
import { Ply, db_player, db_player_online } from "../../Object/player/Ply";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";
import { log, sleep } from "../../Object/tool/tools";
import { DB } from "../../Object/database/database";

const isDebug = false;

addSubCommand(
    "player",
    "test if db player can handle a lot of players loaded in db",
    "+manage ut player",
    ["player", "p"],
    cmd_module.dev,
    cmd_permission.admin,
    isDebug,
    false,
    UT_DB_Player,
    [["manage"], ["ut", "UT", "unittest", "unitTEST"]]
)

function UT_DB_Player(args: string[], player: Player, ply: Ply) {
    const nb_test = 10000;
    const batchSize = 25;
    for (let i = 1; i < nb_test; i++) {
        let newPl = new Ply({
            name: "player" + i,
            nameTag: "player" + i,
            id: i.toString(),
            location: { x: 0, y: 0, z: 0 },
            dimension: { id: "overworld" }
        })

        Ply.add_player(newPl)
        if (i % batchSize === 0) {
            log("§g" + batchSize + " Player added, now at " + i)
            sleep(1);
        }
    
        if (i < nb_test / 100)
            db_player_online.set(newPl.name, newPl)
    }
}