import type { Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { namespaces, type Syntax } from "../../syntaxes/index.ts"
import { addNamespace } from "../addNamespace/index.ts"

/** The name of the copy reading each rule over a root under a configuration, by the rule's short name; `undefined` where no configured copy reads it. */
let copiesByRoot: WeakMap<Root, WeakMap<object, Map<string, string | undefined>>> = new WeakMap()

/**
 * Asks whether a configured value turns the rule on.
 * @param setting - The value: `null`, or a primary with its secondaries.
 * @returns True where the rule runs.
 */
function enables (setting: unknown): boolean {
	return setting !== undefined && setting !== null && !(Array.isArray(setting) && setting[0] === null)
}

/**
 * Names the one copy of a rule that reads a root: the copy of the root's own family where it is configured, otherwise the first configured copy, in the configuration's order, whose syntax accepts the root. A root's family is the core for plain CSS and the one namespace whose syntax the root was parsed with otherwise, since every namespace accepts plain CSS and refuses another namespace's syntax.
 *
 * The rules of the plugin are registered once per syntax, so a configuration naming two families over one file lists one rule twice; under this answer the other copies yield, without a word, and the file is read once. A yielding copy runs nothing over that root, its option validation included, as a copy refusing a root runs nothing either: a typo in the option of a `scss/` rule is reported over an SCSS file and not over a plain CSS one the core's copy reads.
 * @param shortName - The rule's short name.
 * @param root - The root.
 * @param result - The PostCSS result carrying the configuration.
 * @returns The configured name of the reading copy, or nothing.
 */
export function copyReadingTheRoot (shortName: string, root: Root, result: PostcssResult): string | undefined {
	let config = result.stylelint?.config

	if (!config) return undefined

	let byConfig = copiesByRoot.get(root) ?? new WeakMap<object, Map<string, string | undefined>>()
	let copies = byConfig.get(config) ?? new Map<string, string | undefined>()

	copiesByRoot.set(root, byConfig)
	byConfig.set(config, copies)

	if (copies.has(shortName)) return copies.get(shortName)

	let settings: Record<string, unknown> = config.rules ?? {}
	let accepting = [css, ...namespaces].filter((syntax) => syntax.accepts(root, result))
	let configured = accepting.map((syntax): [Syntax, string] => [syntax, addNamespace(shortName, syntax.namespace)]).filter(([, name]) => enables(settings[name]))
	let family = configured.find(([syntax]) => syntax === css || accepting.length === 1)
	let reading = family?.[1] ?? Object.keys(settings).find((name) => configured.some(([, configuredName]) => configuredName === name))

	copies.set(shortName, reading)

	return reading
}
