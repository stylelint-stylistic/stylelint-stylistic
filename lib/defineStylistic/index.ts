import type { ConfigRuleSettings, RuleMessage, Severity } from "stylelint"

import rules from "../rules/index.ts"
import { namespaces } from "../syntaxes/index.ts"
import { addNamespace } from "../utils/addNamespace/index.ts"
import { configurationError } from "../utils/configurationError/index.ts"
import type { RuleFactory } from "../utils/defineRule/index.ts"

/** The registry, whose type carries every rule's name and options. */
type Registry = typeof rules

/** A rule's short name, the key a configuration hands over. */
export type RuleName = keyof Registry

/** The segment of a syntax registered beside the core, spelled here since `namespaces` keeps no literal; a test holds the two in step. */
export type Namespace = `less` | `scss` | `styled`

/** A namespace, or `css` for the core, which naming none means too. */
export type SyntaxName = Namespace | `css`

/** The keys Stylelint reads out of any rule's secondary options. */
export type CommonSecondary = {
	severity?: Severity,
	message?: RuleMessage,
	url?: string,
	reportDisables?: boolean,
	disableFix?: boolean,
}

/** The primary option the rule takes. */
type PrimaryOf<F> = F extends RuleFactory<infer P, infer _S, infer _M> ? P : never

/** The secondary options the rule reads: `{}` for a rule taking none, and a defaulted parameter's `undefined` stripped. */
type SecondaryOf<F> = F extends RuleFactory<infer _P, infer S, infer _M> ? NonNullable<S> : never

/** What a configuration may hand the rule: its own secondary options and the common keys. */
type SecondaryOfRule<K extends RuleName> = SecondaryOf<Registry[K]> & CommonSecondary

/** A setting as Stylelint's `rules` takes it, the tuples read-only too, as an `as const` object holds them. */
type Setting<P, S extends object> = ConfigRuleSettings<P, S> | readonly [P] | readonly [P, S]

/** The settings by short name. */
export type RulesInput = {
	[K in RuleName]?: Setting<PrimaryOf<Registry[K]>, SecondaryOfRule<K>>
}

/** The setting as given, a key the rule's secondary options do not spell refused; Stylelint passes such a key over in silence. */
type ExactSetting<K extends RuleName, Given> = Given extends readonly [infer P, infer S extends object]
	? readonly [P, S & Record<Exclude<keyof S, keyof SecondaryOfRule<K>>, never>]
	: Given

/** The rules as given, each checked against the rule it names. */
type Exact<R> = { [K in keyof R]: K extends RuleName ? ExactSetting<K, R[K]> : never }

/** The name an entry comes back under. */
type Prefixed<S extends SyntaxName | undefined, K extends string> = S extends Namespace ? `@stylistic/${S}/${K}` : `@stylistic/${K}`

/** The setting as `Config` spells it: `null`, or a mutable pair of the primary and the secondary options, an empty object where none were given. The `const` inference reads a tuple as read-only, which `rules` refuses. */
type Normalized<Given> = Given extends null | undefined
	? Given
	: Given extends readonly [infer P, infer S]
		? [P, S]
		: Given extends readonly [infer P]
			? [P, Record<never, never>]
			: [Given, Record<never, never>]

/** The entries returned, under the names Stylelint reads. */
export type StylisticRules<S extends SyntaxName | undefined, R> = {
	[K in keyof R & string as Prefixed<S, K>]: Normalized<R[K]>
}

/**
 * Writes a setting as a pair of the primary and the secondary options.
 * @param setting - The setting as given.
 * @returns The pair; `null` as given.
 */
function normalized (setting: unknown): unknown {
	if (setting === null || setting === undefined) return setting

	let [primary, secondary = {}] = Array.isArray(setting) ? setting as [unknown, object?] : [setting]

	return [primary, secondary]
}

/**
 * Reads the segment the rules of a syntax are named under.
 * @param syntax - What the configuration named, if anything.
 * @returns The segment, or nothing for the core.
 */
function namespaceOf (syntax: SyntaxName | undefined): string | undefined {
	if (syntax === undefined || syntax === `css`) return undefined

	let known = namespaces.map((namespace) => namespace.namespace)

	if (!known.includes(syntax)) throw configurationError(`"${syntax}" is not a syntax of "@stylistic/stylelint-plugin": name one of ${known.map((name) => `"${name}"`).join(`, `)}, or "css" for plain CSS.`)

	return syntax
}

/**
 * Names the rules for a JavaScript configuration: `{ "@stylistic/scss/color-hex-case": "lower" }` for `{ syntax: "scss", rules: { "color-hex-case": "lower" } }`, typed off the rules themselves ([#624](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/624)). A name or a syntax the plugin does not know stops the run with a configuration error; what an option holds is the rule's to check at its turn.
 * @param options - The syntax and the rules.
 * @param options.syntax - `scss`, `less` or `styled`; `css`, or nothing, for the core.
 * @param options.rules - The settings by short name, as `rules` takes them.
 * @returns The settings under the prefixed names, for `rules`.
 */
export function defineStylistic<const S extends SyntaxName | undefined = undefined, const R extends RulesInput = Record<never, never>> (options: { syntax?: S, rules: R & Exact<NoInfer<R>> }): StylisticRules<S, R> {
	let namespace = namespaceOf(options.syntax)

	let entries = Object.entries(options.rules).map(([name, setting]) => {
		if (!Object.hasOwn(rules, name)) throw configurationError(`"${name}" is not a rule of "@stylistic/stylelint-plugin": the rules are named by their short names, "color-hex-case" for "@stylistic/color-hex-case".`)

		return [addNamespace(name, namespace), normalized(setting)]
	})

	return Object.fromEntries(entries) as StylisticRules<S, R>
}
