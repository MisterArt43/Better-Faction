import { Player } from "@minecraft/server";
import { addSubCommand, subCommandExecuter } from "../CommandManager";
import { Ply, db_player, db_player_online } from "../../Object/player/Ply";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";
import { colorizeJSON, log, sleep } from "../../Object/tool/tools";
import { DB } from "../../Object/database/database";
import { db_faction, Faction } from "../../Object/faction/Faction";

let isDebug = (ply: Ply, player: Player) => {
    return true;
}

addSubCommand(
    "player",
    "test if db player can handle a lot of players loaded in db",
    "+manage ut player",
    ["player", "p"],
    cmd_module.dev,
    cmd_permission.dev,
    true,
    false,
    UT_DB_Player,
    [["manage"], ["ut", "UT", "unittest", "unitTEST"]],
    isDebug
)

async function UT_DB_Player(args: string[], player: Player, ply: Ply) {
    const nb_test = 10000;
    const batchSize = 100;
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
            await sleep(1);
        }
    
        if (i < nb_test / 100)
            db_player_online.set(newPl.name, newPl)
    }
}

addSubCommand(
    "faction",
    "test if db faction can handle a lot of faction loaded in db",
    "+manage ut faction",
    ["faction", "f"],
    cmd_module.dev,
    cmd_permission.dev,
    true,
    false,
    UT_DB_Faction,
    [["manage"], ["ut", "UT", "unittest", "unitTEST"]],
    isDebug
)

async function UT_DB_Faction(args: string[], player: Player, ply: Ply) {
    const nb_test = 3;
    const batchSize = 1;
    
    const nb_player_multiplier = 7;
    const nb_player = nb_test * nb_player_multiplier;

    const playerList = new Array<Ply>();

    for (let i = 0; i < nb_player; i++) {
        let newPl = new Ply({
            name: "player" + i,
            nameTag: "player" + i,
            id: i.toString(),
            location: { x: 0, y: 0, z: 0 },
            dimension: { id: "overworld" }
        })

        Ply.add_player(newPl)
        playerList.push(newPl)
        if (i % batchSize * nb_player_multiplier === 0) {
            log("§g" + batchSize + " Player added, now at " + i)
            await sleep(1);
        }
    
        if (i < nb_test / 100)
            db_player_online.set(newPl.name, newPl)
    }

    for (let i = 0; i < nb_test; i++) {
        await subCommandExecuter(["faction", "create", "faction" + i], { message: "", sender: player, cancel: false }, undefined, undefined, player, playerList.slice(i * nb_player_multiplier, (i + 1) * nb_player_multiplier)[0])

        if (i % batchSize === 0) {
            log("§g" + batchSize + " Faction added, now at §a" + i + 1 + "§g created by §e" + playerList.slice(i * nb_player_multiplier, (i + 1) * nb_player_multiplier)[0].name)
            await sleep(2);
        }


        for (let j = 0; j < nb_player_multiplier; j++) {
            await subCommandExecuter(["faction", "invite", db_player.get("player"+(i * nb_player_multiplier + j))!.name], { message: "", sender: player, cancel: false }, undefined, undefined, player, playerList.slice(i * nb_player_multiplier, (i + 1) * nb_player_multiplier)[0])
            log("§g" + db_player.get("player"+(i * nb_player_multiplier + j))!.name + " invited to faction" + i)
        }
    }

    log("result of the first faction : " + colorizeJSON(JSON.stringify(db_faction.get("faction0"), null, 8)))

    await sleep(10);
    for (let i = 0; i < nb_test; i++) {
        for (let j = 0; j < nb_player_multiplier; j++) {
            await subCommandExecuter(["faction", "join", "faction" + i], { message: "", sender: player, cancel: false }, undefined, undefined, player, playerList.slice(i * nb_player_multiplier, (i + 1) * nb_player_multiplier)[0])
            log("§g" + db_player.get("player"+(i * nb_player_multiplier + j))!.name + " joined faction" + i)
        }
    }

    log("result of the first faction : " + colorizeJSON(JSON.stringify(db_faction.get("faction0"), null, 8)))

    await sleep(10);
    for (let i = 0; i < nb_test; i++) {
        await subCommandExecuter(["faction", "quit"], { message: "", sender: player, cancel: false }, undefined, undefined, player, playerList.slice(i * nb_player_multiplier, (i + 1) * nb_player_multiplier)[0])
        log("§g" + db_player.get("player"+(i * nb_player_multiplier))!.name + " quit faction" + i)
    }

    log("faction still exist : " + db_faction.has("faction0"))

    await sleep(10);
    log("deleting all player")
    for (let i = 0; i < nb_player; i++) {
        const pl = db_player.get("player" + i)
        Ply.remove_player(pl!)
    }

    log("all player as been deleted");
}