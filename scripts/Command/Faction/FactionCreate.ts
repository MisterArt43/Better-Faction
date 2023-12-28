import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { concatenateArgs, tellraw } from "../../Object/tool/tools";
import { translate } from "../../lang";
import { DB } from "../../Object/database/database";
import { Faction } from "../../Object/faction/Faction";
import { Vector_3 } from "../../Object/tool/object/Vector";
import { addSubCommand, cmd_permission } from "../CommandManager";
import { cmd_module } from "../../Object/database/db_map";
import { ModalFormData } from "@minecraft/server-ui";

addSubCommand(
	"create",
	"Create a faction.",
	`${globalThis.prefix}faction create <name>`,
	["create", "c"],
	cmd_module.faction,
	cmd_permission.member,
	true,
	true,
	factionCreate,
	[["faction", "f"]]
);

function concatFacName(args: string[], start: number) {
	return concatenateArgs(args, start, (s) => s.replace(/"/g, "").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()));
}

function factionCreate(args: string[], player: Player, ply: Ply) {
	if (args.length >= 3) {
		const Fname = concatFacName(args, 2);
		factionCreateCmd(Fname, player, ply);
	}
	else {
		factionCreateUI(player, ply);
	}
}

function factionCreateCmd(Fname: string, player: Player, ply: Ply) {
	if (Fname.match(/^([0-9a-zA-Z ]){1,40}$/) && Fname != "Admin") {//nom des claims Admin
		if (ply.faction_name != null) return tellraw(player.name, translate(ply.lang)?.error_faction_create ?? "no translation");
		if (DB.db_faction.has(Fname)) return tellraw(player.name, translate(ply.lang)?.error_have_name ?? "no translation");
		let FacObject = new Faction(Fname, player.name);
		if (player.dimension.id === "minecraft:overworld") {
			FacObject.Fhome = new Vector_3(
				Math.ceil(player.location.x + 0.0001) - 1,
				Math.ceil(player.location.y - 0.4999),
				Math.ceil(player.location.z + 0.0001) - 1);
		}
		Faction.add_faction(FacObject);
		ply.remove_to_update_player();
		ply.faction_name = FacObject.name;
		ply.add_to_update_player();
		tellraw(player.name, translate(ply.lang, Fname)?.faction_create ?? "no translation");
	}
	else {
		tellraw(player.name, translate(ply.lang)?.error_name ?? "no translation");
	}
}

function factionCreateUI(player: Player, ply: Ply) {
	const fac = DB.db_faction.get(ply.faction_name ?? "");
	if (fac !== undefined) return tellraw(player.name, "§cYou are already in a faction");
	new ModalFormData()
		.title("Faction Create")
		.textField("Faction Name", "faction name")
		.show(player).then(res => {
			if (res.canceled) return;
			if (typeof res.formValues![0] !== "string") return;
			factionCreateCmd(concatFacName(res.formValues![0].split(" "), 0), player, ply);
		})
}