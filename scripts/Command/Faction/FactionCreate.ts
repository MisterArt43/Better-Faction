import { Player } from "@minecraft/server";
import { Ply } from "../../Object/player/Ply";
import { concatFacName, concatenateArgs, tellraw } from "../../Object/tool/tools";
import { translate } from "../../Object/tool/lang";
import { DB } from "../../Object/database/database";
import { Faction } from "../../Object/faction/Faction";
import { Vector_3 } from "../../Object/tool/object/Vector";
import { addSubCommand } from "../CommandManager";
import { cmd_module, cmd_permission } from "../../Object/database/db_map";
import { ModalFormData } from "@minecraft/server-ui";
import { haveNoFaction } from "./_UtilsFaction";

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
	[["faction", "f"]],
	haveNoFaction,
);

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
		if (ply.faction_name != null) return tellraw(player, translate(ply.lang)?.error_faction_create ?? "no translation");
		if (DB.db_faction.has(Fname)) return tellraw(player, translate(ply.lang)?.error_have_name ?? "no translation");
		let FacObject = new Faction(Fname, player.name);
		if (player.dimension.id === "minecraft:overworld") {
			FacObject.Fhome = new Vector_3(player.location).normalize();
		}
		Faction.add_faction(FacObject);
		ply.remove_to_update_player();
		ply.faction_name = FacObject.name;
		ply.add_to_update_player();
		tellraw(player, translate(ply.lang, Fname)?.faction_create ?? "no translation");
	}
	else {
		tellraw(player, translate(ply.lang)?.error_name ?? "no translation");
	}
}

function factionCreateUI(player: Player, ply: Ply) {
	const fac = DB.db_faction.get(ply.faction_name ?? "");
	if (fac !== undefined) return tellraw(player, "§cYou are already in a faction");
	new ModalFormData()
		.title("Faction Create")
		.textField("Faction Name", "faction name")
		.show(player).then(res => {
			if (res.canceled) return;
			if (typeof res.formValues![0] !== "string") return;
			factionCreateCmd(concatFacName(res.formValues![0].split(" "), 0), player, ply);
		})
}