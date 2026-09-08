import type { Root } from "postcss"
import stylelint, { type PostcssResult, type Rule, type RuleMessages, type RuleMeta } from "stylelint"

import { namespaces, type Syntax } from "../../syntaxes/index.ts"
import { addNamespace } from "../addNamespace/index.ts"
import { deferCheck, deferFinalCheck, defersToRunEnd, flushDeferredChecks, lastConfiguredPluginRule, linenessRank, registerPluginRule } from "../defersToRunEnd/index.ts"
import type { RuleCheck } from "../ruleCheck/index.ts"

let { utils: { report, ruleMessages } } = stylelint

/** What the namespace hands a rule: its name, its messages closing with that name, and the syntax. */
export type RuleScope<M extends RuleMessages> = {
	ruleName: string,
	messages: M,
	syntax: Syntax,
}

/** What a rule module defines once, whichever namespaces it is registered under. `defersToRunEnd` marks a rule that reads what a run's writers leave, so it checks last, behind the lineness-deferred rules: `indentation`, which reads every line ([#353](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/353)), and `declaration-block-single-line-max-declarations`, which reads a block's lineness and breaks the block behind them ([#641](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/641)). */
export type RuleDefinition<P, S, M extends RuleMessages> = {
	shortName: string,
	meta: RuleMeta,
	messages: M,
	rule: (scope: RuleScope<M>, primary: P, secondaryOptions: S) => RuleCheck,
	defersToRunEnd?: true,
}

/**
 * Names a rule's messages before a rule name closes them under each namespace.
 * @param messages - Each message by key.
 * @returns The same messages, typed as written.
 */
export function defineMessages<M extends RuleMessages> (messages: M): M {
	return messages
}

/** What `defineRule` returns: the rule under a syntax's namespace, with the options its function is written for in the type arguments, where `defineStylistic` reads them ([#624](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/624)). */
export type RuleFactory<P, S, M extends RuleMessages> = (syntax: Syntax) => Rule<P, S, M>

/** The roots refused already: one warning per stylesheet, not one per rule. */
let refused: WeakSet<Root> = new WeakSet()

/**
 * Turns a rule definition into a factory over a syntax, which names the rule under the syntax's namespace, closes the messages with that name, and refuses a root the syntax does not accept in front of the rule.
 * @param definition - The rule's definition.
 * @returns The factory, whose result `createPlugin` takes.
 */
export function defineRule<P, S, M extends RuleMessages> (definition: RuleDefinition<P, S, M>): RuleFactory<P, S, M> {
	let { shortName, meta, messages, rule, defersToRunEnd: readsEveryLine } = definition

	return (syntax) => {
		let ruleName = addNamespace(shortName, syntax.namespace)

		registerPluginRule(ruleName)

		let scopedMessages = ruleMessages(ruleName, messages) as M
		let { refusal } = ruleMessages(ruleName, {
			refusal: (names: string) => (names ? `The "${ruleName}" rule does not read a stylesheet parsed with this syntax; the ${names} rules do` : `The "${ruleName}" rule does not read a stylesheet parsed with this syntax`),
		})

		/**
		 * The rule as Stylelint calls it.
		 * @param primary - The configured primary, passed through unread.
		 * @param secondaryOptions - The configured secondaries, passed through unread.
		 * @returns The check, unless the syntax refuses the root.
		 */
		function scoped (primary: P, secondaryOptions: S): RuleCheck {
			let check = rule({ ruleName, messages: scopedMessages, syntax }, primary, secondaryOptions)
			let rank = linenessRank(shortName, syntax.namespace, typeof primary === `string` ? primary : ``)

			/**
			 * What the rule does at a turn, refusal included, so a deferred rule refuses as an undeferred one would.
			 * @param root - The stylesheet of the turn.
			 * @param result - The lint result the warnings go into.
			 */
			function guarded (root: Root, result: PostcssResult): void {
				if (syntax.accepts(root, result)) {
					check(root, result)

					return
				}

				if (refused.has(root)) return

				refused.add(root)

				// The warning names the namespaces that do read the root
				let takers = namespaces.filter((namespace) => namespace.accepts(root, result)).map((namespace) => `"@stylistic/${namespace.namespace}/"`).join(` and `)

				report({ message: refusal, messageArgs: [takers], node: root, index: 0, endIndex: 0, result, ruleName })
			}

			return (root, result) => {
				let last = lastConfiguredPluginRule(result)

				// Deferred (#355 lineness, #353 every line) only where a flush is sure to come: under a configuration the plugin cannot read the check runs where it stands. Its place is the plugin's to decide, not the configuration's (#502)
				if (readsEveryLine && last !== undefined) deferFinalCheck(root, rank, () => guarded(root, result))
				else if (defersToRunEnd(primary) && last !== undefined) deferCheck(root, rank, () => guarded(root, result))
				else guarded(root, result)

				if (ruleName === last) flushDeferredChecks(root)
			}
		}

		return Object.assign(scoped, { ruleName, messages: scopedMessages, meta })
	}
}
