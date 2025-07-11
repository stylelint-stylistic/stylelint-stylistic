import stylelint from "stylelint"

import { addNamespace } from "./utils/addNamespace/index.js"
import rules from "./rules/index.js"

let rulesPlugins = Object.keys(rules).map((name) => stylelint.createPlugin(addNamespace(name), rules[name]))

export default rulesPlugins
