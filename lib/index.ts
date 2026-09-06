import stylelint from "stylelint"

import rules from "./rules/index.ts"
import { css } from "./syntaxes/css/index.ts"
import { namespaces } from "./syntaxes/index.ts"
import { addNamespace } from "./utils/addNamespace/index.ts"
import type { ConfigurationError } from "./utils/configurationError/index.ts"

/** The code Stylelint exits with when its configuration is invalid. */
const EXIT_CODE_INVALID_CONFIG = 78

/** Every rule per syntax: `@stylistic/<rule>` for the core, `@stylistic/<namespace>/<rule>` for the rest. */
let rulesPlugins = [css, ...namespaces].flatMap((syntax) => Object.entries(rules).map(([name, createRule]) => stylelint.createPlugin(addNamespace(name, syntax.namespace), createRule(syntax))))

/** Stylelint reads `extends` only on a config, so this getter runs only where the package was listed in the wrong field, which otherwise makes every `@stylistic/` rule unknown. */
Object.defineProperty(rulesPlugins, `extends`, {
	get () {
		let error = new Error(`"@stylistic/stylelint-plugin" is a plugin, not a shareable config, so it cannot be used in "extends". List it in "plugins" instead, and put the rules you need, each namespaced with "@stylistic/", in "rules".`) as ConfigurationError

		error.name = `ConfigurationError`
		error.code = EXIT_CODE_INVALID_CONFIG

		throw error
	},
})

export default rulesPlugins

export { type CommonSecondary, defineStylistic, defineStylisticOverride, type GlobalOptions, type Namespace, type RuleName, type RulesInput, type StylisticOverride, type StylisticRules, type SyntaxName } from "./defineStylistic/index.ts"
