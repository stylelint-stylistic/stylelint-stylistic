import path from "node:path"
import { env } from "node:process"

import type { Config } from "../harness/lint.ts"

import { FIXTURES, INLINE_FIXTURES } from "./fixtures.ts"
import { RULE_OPTIONS } from "./options.ts"

/** The plugin is loaded by its place on disk, so that an oracle runs the same from any directory — and from another checkout's `lib/` where `HARNESS_LIB` names one, which is how a base is measured with the branch's oracles without moving the working tree. */
const PLUGIN = path.join(env.HARNESS_LIB || new URL(`../../lib`, import.meta.url).pathname, `index.ts`)

export type Run = {
	rule: string,
	primary: unknown,
	syntaxName: string,
	name: string,
	code: string,
	config: Config,
}

/**
 * Builds every run an oracle makes: every rule, under every primary option it accepts, over every fixture the syntax can hold.
 *
 * The list is built before anything is linted, so that an oracle is one loop over it rather than four nested ones.
 * @param corpus - The fixtures to use in place of the shared ones, where an oracle carries its own. Such a corpus is read under the two custom syntaxes alone, since every fixture of one is written around a comment spelled with a double slash.
 * @returns Every run, in a stable order.
 */
function buildRuns (corpus?: [string, string][]): Run[] {
	let syntaxes: [string, string | null, [string, string][]][] = corpus
		? [[`scss`, `postcss-scss`, corpus], [`less`, `postcss-less`, corpus]]
		: [[`css`, null, FIXTURES], [`scss`, `postcss-scss`, [...FIXTURES, ...INLINE_FIXTURES]], [`less`, `postcss-less`, [...FIXTURES, ...INLINE_FIXTURES]]]

	return Object.entries(RULE_OPTIONS).flatMap(([rule, primaries]) => primaries.flatMap((primary) => syntaxes.flatMap(([syntaxName, customSyntax, fixtures]) => fixtures.map(([name, code]) => ({
		rule,
		primary,
		syntaxName,
		name,
		code,
		config: customSyntax
			? { plugins: [PLUGIN], customSyntax, rules: { [`@stylistic/${rule}`]: primary } }
			: { plugins: [PLUGIN], rules: { [`@stylistic/${rule}`]: primary } },
	})))))
}

/**
 * Asks whether a result is one an oracle can say anything about.
 *
 * A fixture no syntax reads is no fixture, and an option a rule does not take is `options.ts` falling behind the plugin rather than the plugin being wrong. Neither is a finding.
 * @param result - The result of one lint, of which the warnings and the objections to the options are read.
 * @returns True where the run is worth reading.
 */
function isUsable (result: {
	warnings: { rule?: string | undefined }[],
	invalidOptionWarnings?: unknown[],
}): boolean {
	if (result.warnings.some((warning) => warning.rule === `CssSyntaxError`)) return false

	return (result.invalidOptionWarnings ?? []).length === 0
}

export { buildRuns, isUsable, PLUGIN }
