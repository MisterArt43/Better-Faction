import { ChunkPermission } from "./ChunkPermission";

export class ChunkPlayerPermission {
	private name: string;
	private permission: ChunkPermission;

	constructor(name: string, permission: ChunkPermission) {
		this.name = name;
		this.permission = permission;
		return this;
	}
}