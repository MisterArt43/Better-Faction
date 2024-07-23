import { Dimension, DimensionLocation, DimensionType, MinecraftDimensionTypes, Vector2, Vector3 } from "@minecraft/server";

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

	toString() : string {
		return `${this.x}, ${this.y}`
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

	updatePos(location: Vector3) {
		this.x = location.x;
		this.y = location.y;
		this.z = location.z;
		return this;
	}

	normalize() {
		this.x = Math.ceil(this.x + 0.0001) - 1;
        this.y = Math.floor(this.y + 0.4999);
        this.z = Math.ceil(this.z + 0.0001) - 1;
		return this;
	}

	/**
	 * 
	 * @returns {string} '0, 0, 0'
	 */
	toString() : string {
		return `${this.x}, ${this.y}, ${this.z}`
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

	updateDim(dimension: Dimension) {
		this.dim = dimension.id;
		return this;
	}

	/**
	 * 
	 * @returns {string} return the dimension corresponding color (green, red, black)
	 */
	getDimColor() : '§a' | '§c' | '§0' {
		return this.dim === MinecraftDimensionTypes.overworld ? "§a" : this.dim === MinecraftDimensionTypes.nether ? "§c" : "§0"
	}
}