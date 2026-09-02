import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

import { describe, expect, it } from "vitest"

/** The directories of the core: what every syntax is built on, and what no syntax may be built into. */
const CORE = [`rules`, `utils`]

/** What a module of the core may import out of `lib/syntaxes/`: the contract, and the core's own syntax. */
const ALLOWED = new Set([`syntaxes/index.ts`, `syntaxes/css/index.ts`])

/** A line that opens a comment, or carries one on from the line above. */
const OPENS_A_COMMENT = /^\s*(?:\/\/|\/\*|\*)/u

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
	it(`names a syntax package the plugin does not depend on in a type import or an export of types, inside a block, or in a comment, and nowhere else — what such a package really costs to load is what \`make packages-check\` runs for`, async () => {
		let optional = Object.keys(JSON.parse(await readFile(path.join(lib, `..`, `package.json`), `utf8`)).devDependencies).filter((name) => name.startsWith(`postcss-`))
		let offending: string[] = []

		for (let [file, text] of await modulesOf(`.`)) {
			if (file.endsWith(`.test.ts`)) continue

			for (let line of text.split(`\n`)) {
				// A name reached inside a block is reached when a stylesheet of that syntax is read, and a project that lints none never loads it; a type import and an export of types are erased by the build and load nothing at all; a comment loads nothing either. Everything else runs as the module is loaded, which is where a package a project has no use for keeps the whole plugin from starting. What the plugin really loads is checked by `make packages-check`, which puts the built package in a project holding none of them; this is the cheaper half, and it fails before the build does
				if (line.startsWith(`\t`) || line.startsWith(`import type `) || line.startsWith(`export type `) || OPENS_A_COMMENT.test(line)) continue

				if (optional.some((name) => line.includes(`"${name}`) || line.includes(`\`${name}`))) offending.push(`${file} → ${line.trim()}`)
			}
		}

		expect(offending).toEqual([])
	})

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
