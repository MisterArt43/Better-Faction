import { Player, system } from "@minecraft/server";
import { cmd_module, cmd_permission } from "../../../Object/database/db_map";
import { addSubCommand } from "../../CommandManager";
import { Ply } from "../../../Object/player/Ply";
import { DB } from "../../../Object/database/database";
import { concatenateArgs, tellraw } from "../../../Object/tool/tools";
import { translate } from "../../../Object/tool/lang";
import { ModalFormData } from "@minecraft/server-ui";
import { UI_find_player } from "../../../Object/tool/find_players_UI";
import { Home } from "../../../Object/player/Home";

addSubCommand(
	"delhome",
	"Delete a home.",
	`${globalThis.prefix}delhome [name]`,
	["delhome", "dh"],
	cmd_module.home,
	cmd_permission.member,
	true,
	false,
	delhome,
    [[]],
    2
);

function removeHomeFromPly(ply: Ply, home: Home): void {
    ply.remove_to_update_player();
    ply.home.splice(ply.home.indexOf(home), 1);
    ply.add_to_update_player();
}

function handleHomeRemoval(ply: Ply, home: Home): void {
    removeHomeFromPly(ply, home);
    tellraw(ply.name, translate(ply.lang, home.getName())?.home_remove ?? `§e•> "§a${arguments[1]}§e" removed.`);
}

function removeHomeForPlayer(player: Player, target: Ply, homeName: string): void {
    if (player.hasTag(adminTag)) {
        let home = target.home.find((h) => h.getName() === homeName);
        if (home !== undefined) {
            removeHomeFromPly(target, home);
            tellraw(player, translate(target.lang, home.getName(), target.name)?.admin_home_remove ?? `§e•> "§a${home.getName()}§e" removed for ${target.name}.`);
        } else {
            tellraw(player, translate(target.lang)?.error_find_home ?? "no translation");
        }
    } else {
        tellraw(player, translate(target.lang)?.error_find_home ?? "no translation");
    }
}

function deleteHomeModal(player: Player, target: Ply | undefined): void {
	tellraw(player, "§7You have 1 second to quit chat, a form will appear.");
    system.runTimeout(async () => {
		if (target === undefined) return;
        let copyHome = [...target.home];
        let form = new ModalFormData().title("§cDelete home \n§7(check the home you want to delete)");

        copyHome.forEach((h) => {
            form.toggle(h.getName() + " §b" + h.getX() + ", " + h.getY() + ", " + h.getZ() + " §e" + h.getDim(), false);
        });

        form.show(player).then((res) => {
            target = DB.db_player.get(target?.name ?? "");
            if (res.canceled || !target || !res.formValues || (res.formValues.every((v) => v === false) ?? true)) return;

            target.remove_to_update_player();
            for (let i = 0; i < res.formValues.length; i++) {
                if (res.formValues[i] === true) {
                    target.home.splice(target.home.indexOf(copyHome[i]), 1);
                    tellraw(player, "§aHome §b" + copyHome[i].getName() + " §aof §b" + target.name + " §ahas been deleted.");
                }
            }
            target.add_to_update_player();
        });
    }, 25);
}

async function delhome(args: string[], player: Player, ply: Ply) {
    if (args.length >= 2) {
        let name = concatenateArgs(args, 1);
        let home = ply.home.find((h) => h.getName() === name)
        if (home !== undefined) {
            handleHomeRemoval(ply, home);
        } else {
            if (args.length === 3) {
                if (player.hasTag(adminTag)) {
                    let target = DB.db_player.get(args[1].replace(/[@"]/g, ""));
                    if (target !== undefined && target instanceof Ply) {
                        removeHomeForPlayer(player, target, args[2].replace(/"/g, ""));
                    } else {
                        tellraw(player, translate(ply.lang)?.error_find_player ?? "no translation");
                    }
                } else {
                    tellraw(player, translate(ply.lang)?.error_find_home ?? "no translation");
                }
            } else {
                tellraw(player, translate(ply.lang)?.error_find_home ?? "no translation");
            }
        }
    } else {
        if (!player.hasTag(adminTag)) return tellraw(player, translate(ply.lang)?.error_arg ?? "§cWrong Arguments");
        deleteHomeModal(player, await UI_find_player(player));
    }
}