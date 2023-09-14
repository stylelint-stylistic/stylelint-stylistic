import { createPlugin } from "stylelint"

import rules from "./rules/index.js"

const prefix = `codeguide`

const rulesPlugins = Object.keys(rules).map((ruleName) => createPlugin(`${prefix}/${ruleName}`, rules[ruleName]))

export default rulesPlugins
