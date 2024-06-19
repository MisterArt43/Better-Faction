import { Player } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { sleep, tellraw } from "./tools";
import { DB } from "../database/database";
import { Faction } from "../faction/Faction";

export async function UI_find_faction(pl: Player): Promise<Faction | undefined> {
    const searchOptions = await getSearchOptions(pl);

    if (!searchOptions) return undefined;

    const { searchAllFaction, searchKeyword } = searchOptions;

    const factionList = await getFactionList(searchAllFaction, searchKeyword, pl);

    if (!factionList) return undefined;

    const selectedFaction = await selectFaction(pl, factionList);

    if (!selectedFaction) {
        tellraw(pl, "§cFaction not found");
    }

    return selectedFaction;
}

async function getSearchOptions(pl: Player): Promise<{ searchAllFaction: boolean; searchKeyword: string } | undefined> {
    const form = new ModalFormData()
        .textField("Enter the start of the faction name", "Faction name")
    if (DB.db_faction.size < 100) form.toggle("show all faction", false)
    return await form.show(pl)
        .then(async (res) => {
            if (res.canceled || !res.formValues || typeof res.formValues[0] !== "string") return undefined;

            return {
                searchAllFaction: !!res.formValues?.[1],
                searchKeyword: res.formValues[0].toLowerCase(),
            };
        });
}

async function getFactionList(searchInOnlineFactions: boolean, searchKeyword: string, pl: Player): Promise<string[] | undefined> {
    let listFaction: string[] = [];

    if (searchInOnlineFactions) {
        listFaction = Array.from(DB.db_faction.keys())
    }
    else {
        let i = 0;
        for (const faction of DB.db_faction.keys()) {
            const factionName = faction.toLowerCase();
            if (factionName.startsWith(searchKeyword)) {
                listFaction.push(factionName);
                if (listFaction.length === 100) {
                    tellraw(pl, "§cToo many results, will only return the first 100");
                    await sleep(10);
                    break;
                }
            }

            if (i++ % 25 === 0) await sleep(1);
        }
    }

    listFaction.sort();
    return listFaction;
}


async function selectFaction(pl: Player, FactionList: string[]): Promise<Faction | undefined> {
    return await new ModalFormData()
        .title("Faction list")
        .dropdown("Select a faction", FactionList)
        .show(pl)
        .then(async (res) => {
            if (res.canceled || !res.formValues || typeof res.formValues[0] !== "string") return undefined;
            return DB.db_faction.get(FactionList[res.formValues[0] as unknown as number]);
        });
}
