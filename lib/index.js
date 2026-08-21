import stylelint from "stylelint"

import rules from "./rules/index.js"
import { addNamespace } from "./utils/addNamespace/index.js"

/** The code Stylelint exits with when its configuration is invalid. */
const EXIT_CODE_INVALID_CONFIG = 78

let rulesPlugins = Object.keys(rules).map((name) => stylelint.createPlugin(addNamespace(name), rules[name]))

/** Stylelint reads `extends` on every config it is told to extend, and never on a plugin, so this getter runs only where the package has been listed in the wrong field. Without it Stylelint loads the package as a config, finds no rules in it, and reports every `@stylistic/` rule as unknown — an error about the rules, whose cause is the field they were never reached from. */
Object.defineProperty(rulesPlugins, `extends`, {
	get () {
		let error = new Error(`"@stylistic/stylelint-plugin" is a plugin, not a shareable config, so it cannot be used in "extends". List it in "plugins" instead, and put the rules you need, each namespaced with "@stylistic/", in "rules".`)

		error.name = `ConfigurationError`
		error.code = EXIT_CODE_INVALID_CONFIG

		throw error
	},
})

export default rulesPlugins
