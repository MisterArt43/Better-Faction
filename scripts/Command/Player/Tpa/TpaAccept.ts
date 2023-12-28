import { Player, world } from "@minecraft/server";
import { Ply, TpaType } from "../../../Object/player/Ply";
import { DB } from "../../../Object/database/database";
import { Server, log, tellraw, tpsound } from "../../../Object/tool/tools";
import { Delay } from "../../../Object/player/Delay";
import { translate } from "../../../lang";
import { addSubCommand, cmd_permission } from "../../CommandManager";
import { cmd_module } from "../../../Object/database/db_map";

addSubCommand(
    "tpaccept",
    "Accept a teleportation request.",
    `${globalThis.prefix}tpaccept`,
    ["tpaccept", "tpyes", "tpaaccept", "tpayes"],
    cmd_module.tpa,
    cmd_permission.member,
    true,
    false,
    tpaAccept
);

function tpaAccept(args: string[], player: Player, ply: Ply) {
	if (DB.db_delay.has(ply.name)) {
        const delay = DB.db_delay.get(ply.name) as Delay;
        if (!delay.check_time()) 
            return tellraw(ply.name, "§cYou have to wait " + (delay.time - new Date().getTime()) / 1000 + " seconds before using this command.");
    }
    if (args.length == 1) {
        if (player.hasTag("tpCanceled") && !player.hasTag(adminTag))
            return tellraw(player.name, "§cYou can't accept a teleportation request in this area.");
        if (ply.tpa !== null) {
            const other = DB.db_player.get(ply.tpa.name);
            const otherPlayer = [...world.getPlayers()].find((p) => p.name === other?.name);
            if (other !== undefined && otherPlayer !== undefined) {
                ply.remove_to_update_player();
                ply
                if (ply.tpa.type === TpaType.tpa) {
                    Server.runCommandAsync(`tp "${other.name}" "${ply.name}"`);
                    tpsound(otherPlayer);
                    ply.tpa = null;
                }
                else if (ply.tpa.type === TpaType.tpahere) {
                    Server.runCommandAsync(`tp "${ply.name}" "${other.name}"`);
                    tpsound(player);
                    ply.tpa = null;
                }
                else {
                    log("§cError tpa");
                }
                ply.add_to_update_player();
            }
        }
        else {
            tellraw(ply.name, translate(ply.lang)?.error_find_tpayes ?? "no translation");
        }
    }
    else {
        tellraw(ply.name, translate(ply.lang)?.error_arg ?? "no translation");
    }
}