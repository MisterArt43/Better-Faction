import { Player } from "@minecraft/server";
import { addSubCommand, Command, commands, SubCommand, subCommandExecuter } from "../CommandManager";
import { Ply, db_player, db_player_online } from "../../Object/player/Ply";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";
import { canBeParseInt, colorizeJSON, log, sleep } from "../../Object/tool/tools";
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
    const nb_test = canBeParseInt(args[3]) ? parseInt(args[3], 10) : 1;
    const batchSize = 10;
    
    const nb_player_multiplier = canBeParseInt(args[4]) ? parseInt(args[4], 10) : 7;
    const nb_player = nb_test * nb_player_multiplier;

    const cleanDB = args[5] === "false" ? false : true;

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
            await sleep(1);
        }
        
        for (let j = 1; j < nb_player_multiplier; j++) {
                ((commands.get("faction") as Map<string, SubCommand>).get("invite") as Command).func(
                ["faction", "invite", "player" + (i * nb_player_multiplier + j)],
                player,
                playerList.slice(i * nb_player_multiplier, (i + 1) * nb_player_multiplier)[0]
            );
            if (j % batchSize === 0) {
                await sleep(1);
            }
        }
    }

    log("result of the first faction (inviteList) : " + colorizeJSON(JSON.stringify(db_faction.get("Faction0")?.invitList)))

    await sleep(10);
    for (let i = 0; i < nb_test; i++) {
        for (let j = 1; j < nb_player_multiplier; j++) {
            ((commands.get("faction") as Map<string, SubCommand>).get("join") as Command).func(
                ["faction", "join", "Faction" + i],
                player,
                playerList.slice(i * nb_player_multiplier, (i + 1) * nb_player_multiplier)[j]
            );
            if (j % batchSize === 0) {
                await sleep(1);
            }
        }
        if (i % batchSize === 0) {
            await sleep(1);
        }
    }

    log("result of the first faction (playerList) : " + colorizeJSON(JSON.stringify(db_faction.get("Faction0")?.playerList)))

    if (cleanDB === false) {
        log("§gFaction not removed, cleanDB is false")
        return;
    }
    await sleep(10);
    for (let i = 0; i < nb_test; i++) {
        ((commands.get("faction") as Map<string, SubCommand>).get("quit") as Command).func(
            ["faction", "quit"],
            player,
            playerList.slice(i * nb_player_multiplier, (i + 1) * nb_player_multiplier)[0])
        if (i % batchSize === 0)
            await sleep(1);
    }

    log(`§afaction still exist (should be §cfalse§a) : ${(db_faction.has("Faction0")) ? "§atrue" : "§cfalse"}`)

    if (db_faction.has("Faction0")) {
        for (let i = 0; i < nb_test; i++) {
            Faction.remove_faction(db_faction.get("Faction" + i)!)
            log("§gFaction" + i + " force removed")
            if (i % batchSize === 0)
                await sleep(1);
        }
    }

    await sleep(10);
    log("§gdeleting all player")
    for (let i = 0; i < nb_player; i++) {
        const pl = db_player.get("player" + i)
        Ply.remove_player(pl!)
    }

    log("§gall player as been deleted");
}