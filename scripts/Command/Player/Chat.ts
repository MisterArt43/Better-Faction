import { Player } from "@minecraft/server";
import { cmd_module } from "../../Object/database/db_map";
import { addSubCommand, cmd_permission } from "../CommandManager"
import { Ply } from "../../Object/player/Ply";
import { tellraw } from "../../Object/tool/tools";
import { translate } from "../../lang";

addSubCommand(
	"chat",
	"Chat control.",
	`${globalThis.prefix}chat <on/off>`,
	["chat"],
	cmd_module.chat,
	cmd_permission.member,
	true,
	false,
	chat
)

function chat(args: string[], player: Player, ply: Ply) {
	if (args.length >= 2) {
		if (args[1] == "reset") {
			if (ply.chat != "all") {
				ply.remove_to_update_player();
				ply.chat = "all";
				ply.add_to_update_player();
				tellraw(player.name, translate(ply.lang)?.private_chat_reset ?? "you are now back to the public chat");
			}
			else {
				tellraw(player.name, translate(ply.lang)?.error_have_private_chat ?? "you are already in the public chat");
			}
		}
		else if (args[1].replace(/[@"]/g, "").match(/[A-Za-z0-9]/g)) {
			ply.remove_to_update_player();
			if (args[1] == "f")
				ply.chat = "faction";
			else if (args[1] == "a")
				ply.chat = "ally";
			else
				ply.chat = args[1];
			ply.add_to_update_player();
			tellraw(player.name, translate(ply.lang, ply.chat)?.change_private_chat ?? `§achat changed to ${ply.chat} chat`);
		}
		else
			tellraw(player.name, translate(ply.lang)?.error_arg ?? "§cInvalid argument.");
	}
	else
	{
		ply.remove_to_update_player();
		ply.chat = "all";
		ply.add_to_update_player();
		tellraw(player.name, translate(ply.lang)?.private_chat_reset ?? "you are now back to the public chat");
	}
}