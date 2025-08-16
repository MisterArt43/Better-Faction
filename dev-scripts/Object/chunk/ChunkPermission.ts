export class ChunkPermission {
	public canBreak: boolean;
	public canPlace: boolean;
	public canInteract: boolean;

	constructor(canBreak: boolean, canPlace: boolean, canInteract: boolean) {
		this.canBreak = canBreak;
		this.canPlace = canPlace;
		this.canInteract = canInteract;
	}
}