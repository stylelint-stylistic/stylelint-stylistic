import type { Theme } from "vitepress"
import DefaultTheme from "vitepress/theme"

import "./style.css"

import RulesTable from "./components/RulesTable.vue"

export default {
	"extends": DefaultTheme,
	enhanceApp ({ app }): void {
		app.component(`RulesTable`, RulesTable)
	},
} satisfies Theme
