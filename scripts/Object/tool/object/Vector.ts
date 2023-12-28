import { Dimension, DimensionLocation, Vector2, Vector3 } from "@minecraft/server";

export class Vector_2 {
	public x: number;
	public y: number;

	constructor(location: Vector2)
	constructor(x: number, y: number)
	constructor(x: number | Vector2, y?: number) {
		if (typeof x === "number") {
			this.x = x;
			this.y = y!;
		}
		else {
			this.x = x.x;
			this.y = x.y;
		}
		return this;
	}
}

export class Vector_3 extends Vector_2 {
	public z: number;
	constructor(location: Vector3)
	constructor(x: number, y: number, z: number)

	constructor(x: number | Vector3, y?: number, z?: number) {
		if (typeof x === "number") {
			super(x, y!);
			this.z = z!;
		}
		else {
			super(x.x, x.y);
			this.z = x.z;
		}
		return this;
	}
}

export class Vector_3_Dim extends Vector_3 {
	public dim : string;

	constructor(location : DimensionLocation)
	constructor(x : number, y : number, z : number, dim : Dimension['id'])

	constructor(x : number | DimensionLocation, y? : number, z? : number, dim? : Dimension['id']) {
		if (typeof x === "number") {
			super(x, y!, z!);
			this.dim = dim!;
		}
		else {
			super(x.x, x.y, x.z);
			this.dim = x.dimension.id;
		}
		return this;
	}
}