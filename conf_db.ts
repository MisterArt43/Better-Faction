import { ExtendedMap, initDB } from './db';

// ------------------------- //
// import your classes below //
// ------------------------- //

//import { myExample } from './myExample'; ...
// class myExample {}
// class myPlayerClass {}

export const database = {
	// db_player: { keyName: 'name', map: new ExtendedMap<string, myPlayerClass>('db_player') },
	// db_example:{keyName:'name' ,'map': new ExtendedMap<string, myExample>('db_example')},
}


// ------------------ //
// Do not touch below //
// ------------------ //


// call this function to load all databases
export function loadAllDatabases() {
	Object.keys(database).map(async (dbName) => {
		initDB(dbName, database[dbName].keyName, database[dbName].map);
	});
}

// call this function to load a specific database
export function loadDatabase(dbName: string) {
	initDB(dbName, database[dbName].keyName, database[dbName].map);
}

type DatabaseKey = keyof typeof database;

// loadDatabaseStrings is used to store the progress of loading databases
export let loadDatabaseStrings: { [key in DatabaseKey]: string; };