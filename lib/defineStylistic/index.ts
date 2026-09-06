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

/** A key several rules take alike, set once for all of them. */
type SharedKey = `ignoreFunctions` | `ignoreProperties`

/** The rules whose secondary options spell the key. */
type RuleTaking<K extends string> = { [N in RuleName]: K extends keyof SecondaryOf<Registry[N]> ? N : never }[RuleName]

/** What the rules taking the key take it as. */
type SharedOptionOf<K extends SharedKey> = { [N in RuleTaking<K>]: SecondaryOf<Registry[N]> extends infer O ? (K extends keyof O ? O[K] : never) : never }[RuleTaking<K>]

/** What is set once for every rule taking it: the shared keys, a severity for this plugin's rules alone, which `defaultSeverity` cannot give, and whether they may write. */
export type GlobalOptions = { [K in SharedKey]?: SharedOptionOf<K> } & Pick<CommonSecondary, `severity` | `disableFix`>

/** The rule's own secondary options over the global ones it takes. */
type Merged<K extends RuleName, Own, G> = { [Key in keyof Own | (keyof G & keyof SecondaryOfRule<K>)]: Key extends keyof Own ? Own[Key] : Key extends keyof G ? G[Key] : never }

/** The setting as `Config` spells it: `null`, or a mutable pair of the primary and the secondary options, the global ones written in. The `const` inference reads a tuple as read-only, which `rules` refuses. */
type Normalized<K extends RuleName, Given, G> = Given extends null | undefined
	? Given
	: Given extends readonly [infer P, infer S extends object]
		? [P, Merged<K, S, G>]
		: Given extends readonly [infer P]
			? [P, Merged<K, Record<never, never>, G>]
			: [Given, Merged<K, Record<never, never>, G>]

/** The entries returned, under the names Stylelint reads. */
export type StylisticRules<S extends SyntaxName | undefined, R, G = Record<never, never>> = {
	[K in keyof R & string as Prefixed<S, K>]: K extends RuleName ? Normalized<K, R[K], G> : never
}

/** The package a syntax is parsed with, the `customSyntax` of its `overrides` entry; none for the core. An exported type on one line, since the structural test of the syntaxes reads a package named elsewhere at the top of a module as loaded with it. */
export type CustomSyntaxOf<S extends SyntaxName | undefined> = S extends `scss` ? `postcss-scss` : S extends `less` ? `postcss-less` : S extends `styled` ? `postcss-styled-syntax` : never

/** The globs as `Config` takes them, a list written mutable again after the `const` inference. */
type Files<F> = F extends readonly (infer Glob)[] ? Glob[] : F

/** An `overrides` entry: the files, the package they are parsed with where the syntax has one, and the rules. */
export type StylisticOverride<S extends SyntaxName | undefined, R, G, F> = [CustomSyntaxOf<S>] extends [never]
	? { files: Files<F>, rules: StylisticRules<S, R, G> }
	: { files: Files<F>, customSyntax: CustomSyntaxOf<S>, rules: StylisticRules<S, R, G> }

/** The rules each shared key reaches, for the run; a test holds the list and `RuleTaking` in step. */
const RULES_TAKING = {
	ignoreFunctions: [
		`function-comma-newline-after`,
		`function-comma-newline-before`,
		`function-comma-space-after`,
		`function-comma-space-before`,
		`value-slash-newline-after`,
		`value-slash-newline-before`,
		`value-slash-space-after`,
		`value-slash-space-before`,
	],
	ignoreProperties: [
		`value-slash-newline-after`,
		`value-slash-newline-before`,
		`value-slash-space-after`,
		`value-slash-space-before`,
	],
} as const satisfies { [K in SharedKey]: readonly RuleTaking<K>[] }

export { RULES_TAKING }

/**
 * Asks whether a rule takes a global option.
 * @param name - The rule's short name.
 * @param key - The option's key.
 * @returns True for `severity` and `disableFix`, and for a shared key the rule is listed under.
 */
function takes (name: string, key: string): boolean {
	if (key === `severity` || key === `disableFix`) return true

	let taking: readonly string[] | undefined = RULES_TAKING[key as SharedKey]

	return taking !== undefined && taking.includes(name)
}

/**
 * Writes a setting as a pair of the primary and the secondary options, the global ones the rule takes written in under its own.
 * @param name - The rule's short name.
 * @param setting - The setting as given.
 * @param globals - The global options.
 * @returns The pair; `null` as given.
 */
function normalized (name: string, setting: unknown, globals: GlobalOptions): unknown {
	if (setting === null || setting === undefined) return setting

	let [primary, secondary] = Array.isArray(setting) ? setting as [unknown, object?] : [setting]
	let taken = Object.entries(globals).filter(([key]) => takes(name, key))

	return [primary, { ...Object.fromEntries(taken), ...secondary }]
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
 * @param [globals] - `ignoreFunctions`, `ignoreProperties`, `severity`, `disableFix`, each written into every rule taking the key, the rule's own option winning.
 * @returns The settings under the prefixed names, for `rules`.
 */
export function defineStylistic<const S extends SyntaxName | undefined = undefined, const R extends RulesInput = Record<never, never>, const G extends GlobalOptions = Record<never, never>> (options: { syntax?: S, rules: R & Exact<NoInfer<R>> }, globals?: G & { [K in Exclude<keyof NoInfer<G>, keyof GlobalOptions>]: never }): StylisticRules<S, R, G> {
	let namespace = namespaceOf(options.syntax)

	let entries = Object.entries(options.rules).map(([name, setting]) => {
		if (!Object.hasOwn(rules, name)) throw configurationError(`"${name}" is not a rule of "@stylistic/stylelint-plugin": the rules are named by their short names, "color-hex-case" for "@stylistic/color-hex-case".`)

		return [addNamespace(name, namespace), normalized(name, setting, globals ?? {})]
	})

	return Object.fromEntries(entries) as StylisticRules<S, R, G>
}

/**
 * Names the package a syntax is parsed with. The names stand inside a function for the structural test of the syntaxes; nothing is loaded, Stylelint resolves the name from the project.
 * @param namespace - The segment, or nothing for the core.
 * @returns The package's name, or nothing for the core.
 */
function customSyntaxOf (namespace: string | undefined): string | undefined {
	switch (namespace) {
		case `scss`: return `postcss-scss`
		case `less`: return `postcss-less`
		case `styled`: return `postcss-styled-syntax`
		default: return undefined
	}
}

/**
 * Names the rules for an `overrides` entry and returns the entry whole: the files, the `customSyntax` the syntax is parsed with, `postcss-scss`, `postcss-less` or `postcss-styled-syntax`, and the rules as `defineStylistic` names them ([#624](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/624)). The package stays a dependency of the project.
 * @param options - The syntax, the files and the rules.
 * @param options.syntax - `scss`, `less` or `styled`; `css`, or nothing, for the core.
 * @param options.files - The globs the entry covers, one or a list.
 * @param options.rules - The settings by short name, as `rules` takes them.
 * @param [globals] - As `defineStylistic` takes them.
 * @returns The entry, for `overrides`.
 */
export function defineStylisticOverride<const S extends SyntaxName | undefined = undefined, const R extends RulesInput = Record<never, never>, const G extends GlobalOptions = Record<never, never>, const F extends string | readonly string[] = string> (options: { syntax?: S, files: F, rules: R & Exact<NoInfer<R>> }, globals?: G & { [K in Exclude<keyof NoInfer<G>, keyof GlobalOptions>]: never }): StylisticOverride<S, R, G, F> {
	let { files, ...named } = options
	let customSyntax = customSyntaxOf(namespaceOf(options.syntax))

	return { files, ...(customSyntax !== undefined && { customSyntax }), rules: defineStylistic(named, globals) } as StylisticOverride<S, R, G, F>
}
