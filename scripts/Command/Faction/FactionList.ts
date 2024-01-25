import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { ActionFormData } from "@minecraft/server-ui";
import { tellraw } from "../../Object/tool/tools";
import { factionRank } from "../../Object/faction/Faction";
import { UI_find_faction } from "../../Object/tool/find_factions_UI";

async function FactionInfo(args: string[], player: Player, ply: Ply) {
    const faction = await UI_find_faction(player);

    if (!faction) {
        return tellraw(player, "§cFaction has been deleted");
    }

    const ally = faction.ally.length === 0 ? "§cNone\n" : "§a - " + faction.ally.join("\n§a - ") + "\n";
    const enemy = faction.enemy.length === 0 ? "§cNone\n" : "§c - " + faction.enemy.join("\n§c - ") + "\n";

    const memberLines: string[] = [];
    memberLines.push("§b - " + faction.getMembersFromRank(factionRank.Leader)[0].name + " Leader");

    faction.playerList.forEach((f) => {
        let rankPrefix = "§s";
        if (f.permission === factionRank.Officer) rankPrefix = "§3";
        else if (f.permission === factionRank.Member) rankPrefix = "§t";

        memberLines.push(rankPrefix + " - " + f.name + " " + f.getRankName());
    });

    const formData = new ActionFormData()
        .title("Faction Info")
        .body(
            "§eName: " + faction.color + faction.name +
            "\n§eDescription: \n" + faction.description +
            "§eMember: " + faction.playerList.length + "/" + faction.memberLimit + "\n" + memberLines.join("\n") +
            "§eBank: " + faction.bank +
            "\nPower: " + faction.power +
            "\nDiplomacy:\n§aAlly: \n" + ally + "§cEnemy: \n" + enemy
        )
        .button("OK");

    formData.show(player);
}
