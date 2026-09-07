import path from "node:path"
import { env } from "node:process"

import type { Config } from "../harness/lint.ts"

import { FIXTURES, INLINE_FIXTURES } from "./fixtures.ts"
import { RULE_OPTIONS } from "./options.ts"

/** Loaded by path, so an oracle runs from any directory and over the `lib/` `HARNESS_LIB` names. */
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
 * Builds every run an oracle makes, every rule under every primary option over every fixture, as one list to loop over.
 * @param corpus - Fixtures in place of the shared ones, read under the two custom syntaxes alone, since each is written around a `//` comment.
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
			? { plugins: [PLUGIN], customSyntax, rules: { [`@stylistic/${syntaxName}/${rule}`]: primary } }
			: { plugins: [PLUGIN], rules: { [`@stylistic/${rule}`]: primary } },
	})))))
}

/**
 * Asks whether an oracle can read a result: a syntax error and a refused option are not findings.
 * @param result - One entry of `results` from a `lint` call.
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
