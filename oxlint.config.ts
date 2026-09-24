import stylistic from "@firefoxic/oxlint-config/stylistic"
import syntactic from "@firefoxic/oxlint-config/syntactic"
import { defineConfig } from "oxlint"

// Everything the shared config says holds. What stands below is what this plugin has a reason of its own for, and each entry carries that reason.
export default defineConfig({
	"extends": [
		syntactic,
		stylistic,
	],
	"env": {
		node: true,
	},
	"globals": {
		createTestRule: `readonly`,
		createTestRuleConfig: `readonly`,
	},
	"rules": {
		// Off for the whole project: a type is declared where it is named and exported there, and a rule opens on what it is — its name, its messages and its `meta` — and closes on the implementation. The shared config turns the rule off in its syntactic part and on again in its stylistic one, which is read second and so wins; the entry stands here until a release of the config settles that.
		"import/exports-last": `off`,
	},
})
