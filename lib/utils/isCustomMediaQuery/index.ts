/**
 * Checks whether a media query is a custom one.
 * @param mediaQuery - The media query string.
 * @returns True if the media query is custom, false otherwise.
 */
export function isCustomMediaQuery (mediaQuery: string): boolean {
	return mediaQuery.startsWith(`--`)
}
