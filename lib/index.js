import stylelint from "stylelint"

import { addNamespace } from "./utils/addNamespace.js"
import rules from "./rules/index.js"

let rulesPlugins = Object.keys(rules).map((name) => stylelint.createPlugin(addNamespace(name), rules[name]))

export default rulesPlugins
