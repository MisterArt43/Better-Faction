import { ChunkPermission } from "./ChunkPermission";

export class ChunkPlayerPermission {
	public name: string;
	public permission: ChunkPermission;

	constructor(name: string, permission: ChunkPermission) {
		this.name = name;
		this.permission = permission;
		return this;
	}
}