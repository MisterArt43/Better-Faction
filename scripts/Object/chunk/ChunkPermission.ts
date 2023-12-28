export class ChunkPermission {
	private canBreak: boolean;
	private canPlace: boolean;
	private canInteract: boolean;

	constructor(canBreak: boolean, canPlace: boolean, canInteract: boolean) {
		this.canBreak = canBreak;
		this.canPlace = canPlace;
		this.canInteract = canInteract;
	}

	// --------------------------------------------- //
	// ----------------- GETTERS ------------------- //
	// --------------------------------------------- //
	
	public getCanBreak(): boolean { return this.canBreak; }
	public getCanPlace(): boolean { return this.canPlace; }
	public getCanInteract(): boolean { return this.canInteract; }

	
	// --------------------------------------------- //
	// ----------------- SETTERS ------------------- //
	// --------------------------------------------- //

	public setCanBreak(canBreak: boolean): void { this.canBreak = canBreak; }
	public setCanPlace(canPlace: boolean): void { this.canPlace = canPlace; }
	public setCanInteract(canInteract: boolean): void { this.canInteract = canInteract; }
}