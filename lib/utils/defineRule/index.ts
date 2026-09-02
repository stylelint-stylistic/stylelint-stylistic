import type { Root } from "postcss"
import stylelint, { type PostcssResult, type Rule, type RuleMessages, type RuleMeta } from "stylelint"

import { namespaces, type Syntax } from "../../syntaxes/index.ts"
import { addNamespace } from "../addNamespace/index.ts"
import { deferCheck, defersToRunEnd, flushDeferredChecks, lastConfiguredPluginRule, registerPluginRule } from "../defersToRunEnd/index.ts"
import type { RuleCheck } from "../ruleCheck/index.ts"

let { utils: { report, ruleMessages } } = stylelint

/** What a rule is handed by the namespace it is registered under: the name a configuration refers to it by, and its messages, each closing with that name. */
export type RuleScope<M extends RuleMessages> = {
	ruleName: string,
	messages: M,
	syntax: Syntax,
}

/** What a rule module defines once, whichever namespaces the rule is then registered under. */
export type RuleDefinition<P, S, M extends RuleMessages> = {
	shortName: string,
	meta: RuleMeta,
	messages: M,
	rule: (scope: RuleScope<M>, primary: P, secondaryOptions: S) => RuleCheck,
}

/**
 * Names the messages of a rule before any rule name closes them, so that `defineRule` can close them under each namespace's name in turn.
 * @param messages - Each message by its key, as `stylelint.utils.ruleMessages` takes them.
 * @returns The same messages, typed as they are written.
 */
export function defineMessages<M extends RuleMessages> (messages: M): M {
	return messages
}

/** The roots refused already, so that a stylesheet parsed with a syntax the rules of a namespace do not read is answered by one warning rather than by one per rule configured. */
let refused: WeakSet<Root> = new WeakSet()

/**
 * Turns what a rule module defines into a factory over a syntax: called with one, it names the rule under the syntax's namespace, closes the messages with that name, and hands both to the rule's own function — and it gates the check the rule returns, so that a root the syntax does not accept is refused in front of the rule rather than read by it.
 * @param definition - The rule's short name, its metadata, its messages before any name closes them, and the function that builds its check.
 * @returns The factory, whose result is what Stylelint's `createPlugin` takes.
 */
export function defineRule<P, S, M extends RuleMessages> (definition: RuleDefinition<P, S, M>): (syntax: Syntax) => Rule<P, S, M> {
	let { shortName, meta, messages, rule } = definition

	return (syntax) => {
		let ruleName = addNamespace(shortName, syntax.namespace)

		registerPluginRule(ruleName)

		let scopedMessages = ruleMessages(ruleName, messages) as M
		let { refusal } = ruleMessages(ruleName, {
			refusal: (names: string) => (names ? `The "${ruleName}" rule does not read a stylesheet parsed with this syntax; the ${names} rules do` : `The "${ruleName}" rule does not read a stylesheet parsed with this syntax`),
		})

		/**
		 * The rule as Stylelint calls it, with its options.
		 * @param primary - The primary option.
		 * @param secondaryOptions - The secondary options, where the rule takes any.
		 * @returns The check, run over every stylesheet the rule is configured for, unless the syntax refuses it.
		 */
		function scoped (primary: P, secondaryOptions: S): RuleCheck {
			let check = rule({ ruleName, messages: scopedMessages, syntax }, primary, secondaryOptions)

			/**
			 * The whole of what the rule does at a turn, the syntax's refusal included, so a deferred rule refuses and reports exactly as an undeferred one would have.
			 * @param root - The root of the stylesheet.
			 * @param result - The result to report into.
			 */
			function guarded (root: Root, result: PostcssResult): void {
				if (syntax.accepts(root, result)) {
					check(root, result)

					return
				}

				if (refused.has(root)) return

				refused.add(root)

				// The namespaces that do read the root are what the warning teaches, so a user meeting the refusal knows the names to configure instead
				let takers = namespaces.filter((namespace) => namespace.accepts(root, result)).map((namespace) => `"@stylistic/${namespace.namespace}/"`).join(` and `)

				report({ message: refusal, messageArgs: [takers], node: root, index: 0, endIndex: 0, result, ruleName })
			}

			return (root, result) => {
				let last = lastConfiguredPluginRule(result)

				// A lineness-conditioned check waits for the run's writers, and only where a flush is sure to come — a run whose configuration the plugin cannot read runs the check where it stands (#355)
				if (defersToRunEnd(primary) && last !== undefined) deferCheck(root, () => guarded(root, result))
				else guarded(root, result)

				if (ruleName === last) flushDeferredChecks(root)
			}
		}

		return Object.assign(scoped, { ruleName, messages: scopedMessages, meta })
	}
}
