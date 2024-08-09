import { Player } from "@minecraft/server";
import { Ply } from "../player/Ply";
import { log, sleep, tellraw } from "./tools";
import { DB } from "../database/database";
import { BFModalFormData } from "../formQueue/formQueue";

export async function UI_find_player(pl: Player): Promise<Ply | undefined> {
    const searchOptions = await getSearchOptions(pl);

    if (!searchOptions) return undefined;

    const { searchInOnlinePlayers, searchKeyword } = searchOptions;

    const playerList = await getPlayerList(searchInOnlinePlayers, searchKeyword, pl);

    if (!playerList) return undefined;

    const selectedPlayer = await selectPlayer(pl, playerList);
    log(selectedPlayer + "");

    if (!selectedPlayer) {
        tellraw(pl, "§cPlayer not found");
    }

    return selectedPlayer;
}

async function getSearchOptions(pl: Player): Promise<{ searchInOnlinePlayers: boolean; searchKeyword: string } | undefined> {
    return await new BFModalFormData()
        .textField("Enter the start of the player name", "Player name")
        .toggle("Search in online player only", false)
        .show(pl)
        .then(async (res) => {
            if (res.canceled || !res.formValues || typeof res.formValues[0] !== "string") return undefined;

            return {
                searchInOnlinePlayers: !!res.formValues[1],
                searchKeyword: res.formValues[0].toLowerCase(),
            };
        });
}

async function getPlayerList(searchInOnlinePlayers: boolean, searchKeyword: string, pl: Player): Promise<string[] | undefined> {
    const playerDB = searchInOnlinePlayers ? DB.db_player_online : DB.db_player;

    const playerList: string[] = [];
    let i = 0;

    for (const player of playerDB.values()) {
        const playerName = player.name.toLowerCase();
        if (playerName.startsWith(searchKeyword)) {
            playerList.push(player.name);
            if (playerList.length === 100) {
                tellraw(pl, "§cToo many results, will only return the first 100");
                await sleep(10);
                break;
            }
        }

        if (i % 25 === 0) await sleep(1);
        i++;
    }

    playerList.sort();
    return playerList;
}


async function selectPlayer(pl: Player, playerList: string[]): Promise<Ply | undefined> {
    return await new BFModalFormData()
        .title("Player list")
        .dropdown("Select a player", playerList)
        .show(pl)
        .then(async (res) => {
            if (res.canceled || !res.formValues) return undefined;
            return DB.db_player.get(playerList[res.formValues[0] as unknown as number]);
        });
}
