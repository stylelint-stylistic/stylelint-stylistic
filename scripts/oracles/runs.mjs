import { env, exit, stderr } from "node:process"

import { FIXTURES, INLINE_FIXTURES } from "./fixtures.mjs"
import { RULE_OPTIONS } from "./options.mjs"

/** The code a run stops with where it was started without approval, and the one thing every oracle shares apart from its list of runs: a run collects results rather than reading them, it is the slowest thing the repository does, and it is asked for far more often than it is needed. So a script of this directory refuses to start unless the Makefile has set this variable, which `make oracles RUN=1` does and nothing else should — a session that wants a run asks for that spelling, and a permission rule of the user's own makes that spelling prompt. */
const EXIT_CODE_NOT_APPROVED = 3

if (env.HARNESS_RUN !== `1`) {
	stderr.write(`Not running: an oracle collects new results, so it is started through \`make oracles RUN=1\` after the user has approved the run, never directly.\n`)
	exit(EXIT_CODE_NOT_APPROVED)
}

/** The plugin is loaded by its place on disk, so that an oracle runs the same from any directory. */
const PLUGIN = new URL(`../../lib/index.js`, import.meta.url).pathname

/** @typedef {{ rule: string, primary: unknown, syntaxName: string, name: string, code: string, config: object }} Run */

/**
 * Builds every run an oracle makes: every rule, under every primary option it accepts, over every fixture the syntax can hold.
 *
 * The list is built before anything is linted, so that an oracle is one loop over it rather than four nested ones.
 * @param {[string, string][]} [corpus] - The fixtures to use in place of the shared ones, where an oracle carries its own. Such a corpus is read under the two custom syntaxes alone, since every fixture of one is written around a comment spelled with a double slash.
 * @returns {Run[]} Every run, in a stable order.
 */
function buildRuns (corpus) {
	let syntaxes = corpus
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
 * A fixture no syntax reads is no fixture, and an option a rule does not take is `options.mjs` falling behind the plugin rather than the plugin being wrong. Neither is a finding.
 * @param {import('stylelint').LintResult} result - The result of one lint.
 * @returns {boolean} True where the run is worth reading.
 */
function isUsable (result) {
	if (result.warnings.some((warning) => warning.rule === `CssSyntaxError`)) return false

	return (result.invalidOptionWarnings ?? []).length === 0
}

export { buildRuns, isUsable, PLUGIN }
