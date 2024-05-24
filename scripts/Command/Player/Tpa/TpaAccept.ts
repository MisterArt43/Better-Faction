import { Player, world } from "@minecraft/server";
import { Ply, TpaType, db_player } from "../../../Object/player/Ply";
import { Server, log, tellraw, tpsound } from "../../../Object/tool/tools";
import { Delay, db_delay } from "../../../Object/player/Delay";
import { addSubCommand, cmd_permission } from "../../CommandManager";
import { cmd_module } from "../../../Object/database/db_map";
import { translate } from "../../../Object/tool/lang";

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
	if (db_delay.has(ply.name)) {
        const delay = db_delay.get(ply.name) as Delay;
        if (!delay.check_time()) 
            return tellraw(player, "§cYou have to wait " + (delay.time - new Date().getTime()) / 1000 + " seconds before using this command.");
    }
    if (args.length == 1) {
        if (Delay.isTpCanceled(player))
            return;
        if (ply.tpa !== null) {
            const other = db_player.get(ply.tpa.name);
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
            tellraw(player, translate(ply.lang)?.error_find_tpayes ?? "no translation");
        }
    }
    else {
        tellraw(player, translate(ply.lang)?.error_arg ?? "no translation");
    }
}