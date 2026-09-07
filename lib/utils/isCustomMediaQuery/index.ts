/**
 * Asks whether a media query is a custom one.
 * @param mediaQuery - The query text, asked whether it opens on `--`.
 * @returns True where it is.
 */
export function isCustomMediaQuery (mediaQuery: string): boolean {
	return mediaQuery.startsWith(`--`)
}
