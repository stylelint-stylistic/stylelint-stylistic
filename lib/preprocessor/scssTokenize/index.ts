import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"

import type scssTokenizeModule from "postcss-scss/lib/scss-tokenize"

/** The `postcss-scss` tokenizer per place; `null` where the place has none. */
let scssTokenizers: Map<string, typeof scssTokenizeModule | null> = new Map()

/**
 * Loads `postcss-scss`'s tokenizer, an optional package, from the stylesheet's directory first and the plugin's second: Stylelint reads a syntax from the configuration that named it, and a module reads one from itself.
 * @param [from] - The stylesheet's file.
 * @returns The tokenizer, or nothing where neither place holds the package.
 */
export function scssTokenize (from?: string): typeof scssTokenizeModule | undefined {
	for (let place of from === undefined ? [import.meta.url] : [pathToFileURL(from).href, import.meta.url]) {
		let known = scssTokenizers.get(place)

		if (known === undefined) {
			try {
				known = createRequire(place)(`postcss-scss/lib/scss-tokenize`) as typeof scssTokenizeModule
			}
			catch {
				known = null
			}

			scssTokenizers.set(place, known)
		}

		if (known) return known
	}

	return undefined
}
