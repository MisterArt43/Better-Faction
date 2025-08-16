const MILLISECONDS_IN_AN_HOUR = 3600000;

/**
 * @description format : "hh:mm"
 */
export function formatCreationDayTime(creationDate: number, utcOffset?: number): string {
	const creationDateWithOffset = creationDate + (utcOffset ?? 0) * MILLISECONDS_IN_AN_HOUR;
	const date = new Date(creationDateWithOffset);

	return `${addDateZ(date.getHours())}h:${addDateZ(date.getMinutes())}m`;
}

/**
 * @description format : "dd/mm/yyyy"
 */
export function formatCreationDate(creationDate: number, utcOffset?: number): string {
	const creationDateWithOffset = creationDate + (utcOffset ?? 0) * MILLISECONDS_IN_AN_HOUR;
	const date = new Date(creationDateWithOffset);

	return `${date.getDay()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

/**
 * @description format : "dd/mm/yyyy : hh/mm"
 */
export function formatCreationFullDate(creationDate: number, utcOffset?: number): string {
    const creationDateWithOffset = creationDate + (utcOffset ?? 0) * MILLISECONDS_IN_AN_HOUR;
    const date = new Date(creationDateWithOffset);

    return `${date.getDay()}/${date.getMonth() + 1}/${date.getFullYear()} : ${addDateZ(date.getHours())}h/${addDateZ(date.getMinutes())}m`;
}

/**
 * @description add a 0 before a number if it's less than 10
 */
export function addDateZ(n: number) {
	return n <= 9 ? "0" + n : n.toString();
}