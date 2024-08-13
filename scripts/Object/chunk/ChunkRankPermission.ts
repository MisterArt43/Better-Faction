import { factionRank } from "../faction/Faction";
import { ChunkPermission } from "./ChunkPermission";

export class ChunkRankPermission {
	public rank: (typeof factionRank[keyof typeof factionRank]);
	public permission: ChunkPermission;

	constructor(rank: (typeof factionRank[keyof typeof factionRank]), permission: ChunkPermission) {
		this.rank = rank;
		this.permission = permission;
		return this;
	}
}