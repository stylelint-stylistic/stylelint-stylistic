import type { Theme } from "vitepress"
// The theme without its fonts: the default one bundles Inter, and the build preloads it on every page, while the site is set in Geist.
import DefaultTheme from "vitepress/theme-without-fonts"

import "./style.css"

import RulesTable from "./components/RulesTable.vue"

export default {
	"extends": DefaultTheme,
	enhanceApp ({ app }): void {
		app.component(`RulesTable`, RulesTable)
	},
} satisfies Theme
