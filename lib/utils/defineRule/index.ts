import type { Root } from "postcss"
import stylelint, { type Rule, type RuleMessages, type RuleMeta } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { addNamespace } from "../addNamespace/index.ts"
import type { RuleCheck } from "../ruleCheck/index.ts"

let { utils: { report, ruleMessages } } = stylelint

/** What a rule is handed by the namespace it is registered under: the name a configuration refers to it by, and its messages, each closing with that name. */
export type RuleScope<M extends RuleMessages> = {
	ruleName: string,
	messages: M,
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
		let scopedMessages = ruleMessages(ruleName, messages) as M
		let { refusal } = ruleMessages(ruleName, {
			refusal: () => `The "${ruleName}" rule does not read a stylesheet parsed with this syntax`,
		})

		/**
		 * The rule as Stylelint calls it, with its options.
		 * @param primary - The primary option.
		 * @param secondaryOptions - The secondary options, where the rule takes any.
		 * @returns The check, run over every stylesheet the rule is configured for, unless the syntax refuses it.
		 */
		function scoped (primary: P, secondaryOptions: S): RuleCheck {
			let check = rule({ ruleName, messages: scopedMessages }, primary, secondaryOptions)

			return (root, result) => {
				if (syntax.accepts(root, result)) return check(root, result)

				if (refused.has(root)) return

				refused.add(root)
				report({ message: refusal, node: root, index: 0, endIndex: 0, result, ruleName })
			}
		}

		return Object.assign(scoped, { ruleName, messages: scopedMessages, meta })
	}
}
