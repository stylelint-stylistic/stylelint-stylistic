import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

import { describe, expect, it } from "vitest"

/** The directories of the core: what every syntax is built on, and what no syntax may be built into. */
const CORE = [`rules`, `utils`]

/** What a module of the core may import out of `lib/syntaxes/`: the contract, and the core's own syntax. */
const ALLOWED = new Set([`syntaxes/index.ts`, `syntaxes/css/index.ts`])

/** Every import specifier of a module, relative or not. */
const EVERY_IMPORT_PATH = /^import\b[^"\n]*"([^"]+)"/gmu

let lib = new URL(`..`, import.meta.url).pathname

/**
 * Reads every TypeScript module under a directory of `lib/`.
 * @param directory - The directory's name.
 * @returns Each module's path relative to `lib/`, with its text.
 */
async function modulesOf (directory: string): Promise<[string, string][]> {
	let entries = await readdir(path.join(lib, directory), { recursive: true, withFileTypes: true })
	let files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(`.ts`)).map((entry) => path.join(entry.parentPath, entry.name))

	return await Promise.all(files.map(async (file): Promise<[string, string]> => [path.relative(lib, file), await readFile(file, `utf8`)]))
}

describe(`the core`, () => {
	it(`imports nothing of a syntax but the contract and its own, and nothing of the preprocessors`, async () => {
		let offending: string[] = []
		let modules = (await Promise.all(CORE.map((directory) => modulesOf(directory)))).flat()

		for (let [file, text] of modules) {
			for (let [, specifier] of text.matchAll(EVERY_IMPORT_PATH)) {
				if (!specifier?.startsWith(`.`)) continue

				let target = path.relative(lib, path.resolve(lib, path.dirname(file), specifier))

				if (target.startsWith(`preprocessor/`) || (target.startsWith(`syntaxes/`) && !ALLOWED.has(target))) offending.push(`${file} → ${target}`)
			}
		}

		expect(offending).toEqual([])
	})
})
