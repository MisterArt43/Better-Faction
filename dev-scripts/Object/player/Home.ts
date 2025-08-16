export class Home {
	public name : string;
	public x : number;
	public y : number;
	public z : number;
	public dim : string;

	constructor(name : string, x : number, y : number, z : number, dim : string) {
		this.name = name;
		this.x = x;
		this.y = y;
		this.z = z;
		this.dim = dim;
	}
}