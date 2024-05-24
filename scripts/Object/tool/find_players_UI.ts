import { Player } from "@minecraft/server";
import { Ply, db_player, db_player_online } from "../player/Ply";
import { ModalFormData } from "@minecraft/server-ui";
import { sleep, tellraw } from "./tools";

export async function UI_find_player(pl: Player): Promise<Ply | undefined> {
    const searchOptions = await getSearchOptions(pl);

    if (!searchOptions) return undefined;

    const { searchInOnlinePlayers, searchKeyword } = searchOptions;

    const playerList = await getPlayerList(searchInOnlinePlayers, searchKeyword, pl);

    if (!playerList) return undefined;

    const selectedPlayer = await selectPlayer(pl, playerList);

    if (!selectedPlayer) {
        tellraw(pl, "§cPlayer not found");
    }

    return selectedPlayer;
}

async function getSearchOptions(pl: Player): Promise<{ searchInOnlinePlayers: boolean; searchKeyword: string } | undefined> {
    return await new ModalFormData()
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
    const playerDB = searchInOnlinePlayers ? db_player_online : db_player;

    const playerList: string[] = [];
    let i = 0;

    for (const player of playerDB.values()) {
        const playerName = player.name.toLowerCase();
        if (playerName.startsWith(searchKeyword)) {
            playerList.push(playerName);
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
    return await new ModalFormData()
        .title("Player list")
        .dropdown("Select a player", playerList)
        .show(pl)
        .then(async (res) => {
            if (res.canceled || !res.formValues || typeof res.formValues[0] !== "string") return undefined;
            return db_player.get(playerList[res.formValues[0] as unknown as number]);
        });
}
