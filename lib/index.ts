import stylelint from "stylelint"

import rules from "./rules/index.ts"
import { css } from "./syntaxes/css/index.ts"
import { namespaces } from "./syntaxes/index.ts"
import { addNamespace } from "./utils/addNamespace/index.ts"
import type { ConfigurationError } from "./utils/configurationError/index.ts"

/** The code Stylelint exits with when its configuration is invalid. */
const EXIT_CODE_INVALID_CONFIG = 78

/** Every rule once per syntax: under `@stylistic/<rule>` for the core, and under `@stylistic/<namespace>/<rule>` for each syntax registered beside it. */
let rulesPlugins = [css, ...namespaces].flatMap((syntax) => Object.entries(rules).map(([name, createRule]) => stylelint.createPlugin(addNamespace(name, syntax.namespace), createRule(syntax))))

/** Stylelint reads `extends` on every config it is told to extend, and never on a plugin, so this getter runs only where the package has been listed in the wrong field. Without it Stylelint loads the package as a config, finds no rules in it, and reports every `@stylistic/` rule as unknown — an error about the rules, whose cause is the field they were never reached from. */
Object.defineProperty(rulesPlugins, `extends`, {
	get () {
		let error = new Error(`"@stylistic/stylelint-plugin" is a plugin, not a shareable config, so it cannot be used in "extends". List it in "plugins" instead, and put the rules you need, each namespaced with "@stylistic/", in "rules".`) as ConfigurationError

		error.name = `ConfigurationError`
		error.code = EXIT_CODE_INVALID_CONFIG

		throw error
	},
})

export default rulesPlugins
