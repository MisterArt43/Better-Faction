export class Home {
	private name : string;
	private x : number;
	private y : number;
	private z : number;
	private dim : string;

	constructor(name : string, x : number, y : number, z : number, dim : string) {
		this.name = name;
		this.x = x;
		this.y = y;
		this.z = z;
		this.dim = dim;
	}

	// --------------------------------------------
	// ------------------ GETTER ------------------
	// --------------------------------------------

	public getName() : string { return this.name; }
	public getX() : number { return this.x; }
	public getY() : number { return this.y; }
	public getZ() : number { return this.z; }
	public getDim() : string { return this.dim; }

	// --------------------------------------------
	// ------------------ SETTER ------------------
	// --------------------------------------------

	public setName(name : string) : void { this.name = name; }
	public setX(x : number) : void { this.x = x; }
	public setY(y : number) : void { this.y = y; }
	public setZ(z : number) : void { this.z = z; }
	public setDim(dim : string) : void { this.dim = dim; }
}