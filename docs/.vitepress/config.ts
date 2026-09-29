import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { type DefaultTheme, defineConfig } from "vitepress"

import { namespaces } from "../../lib/syntaxes/index.ts"

import { readRules } from "./readRules.ts"

/** The root of the repository, which is the root the site is built from: every README of a rule and of a namespace stays where it lies, and `rewritePath` names the page it is served as. */
const ROOT = fileURLToPath(new URL(`../../`, import.meta.url))

/** The site itself, which a card has to name in full. */
const SITE = `https://stylelint-stylistic.github.io/`

/** The repository on GitHub, where every page of the site is edited. */
const REPOSITORY = `https://github.com/stylelint-stylistic/stylelint-stylistic`

/** Where each Markdown file of the repository is served, by its path from the root: the README of a rule under `rules/`, the README of a namespace under `syntaxes/`, the guides of `docs/` at the root of the site, and the two documents of the repository under their own names. */
const REWRITES: [RegExp, string][] = [
	[/^lib\/rules\/([^/]+)\/README\.md$/u, `rules/$1.md`],
	[/^lib\/syntaxes\/([^/]+)\/README\.md$/u, `syntaxes/$1.md`],
	[/^docs\/(.+)$/u, `$1`],
	[/^CHANGELOG\.md$/u, `changelog.md`],
	[/^CONTRIBUTING\.md$/u, `contributing.md`],
]

/** A link to a Markdown file of the repository, written relative to the file it stands in: no scheme, no leading slash, no bare anchor; the path and the anchor apart. */
const RELATIVE_MARKDOWN_LINK = /^(?![a-z]+:|\/|#)([^#]+\.md)(#.*)?$/u

/** The Latin upright faces of Geist and Geist Mono as the build names them, the files of the site's fonts every page needs. */
const GEIST_LATIN = /geist(?:-mono)?-latin-wght-normal\.[\w-]+\.woff2$/u

/** A font's preload as `transformHead` writes it, on a line of its own. */
const FONT_PRELOAD = /\n {4}<link rel="preload" [^>]*as="font"[^>]*>/gu

/** A stylesheet VitePress links as a preload too, which a stylesheet in the head gains nothing from: the browser finds it early and fetches it first anyway. */
const STYLESHEET_PRELOAD = /<link rel="preload stylesheet"([^>]*?) as="style"/gu

/** The stand-in for the default theme's overflow engine of the navbar. */
const NO_NAV_OVERFLOW = fileURLToPath(new URL(`theme/no-nav-overflow.ts`, import.meta.url))

let { version } = JSON.parse(readFileSync(`${ROOT}package.json`, `utf8`)) as { version: string }

/**
 * Names the page a Markdown file of the repository is served as.
 * @param page - The file's path from the root of the repository.
 * @returns The page's path from the root of the site.
 */
function rewritePath (page: string): string {
	for (let [pattern, replacement] of REWRITES) {
		if (pattern.test(page)) return page.replace(pattern, replacement)
	}

	return page
}

/**
 * Reads the groups of the hand-written rule list, so that the sidebar of the rule pages follows the file the registry test guards.
 * @returns One sidebar group per heading of the list, holding one item per rule named under it.
 */
function readRuleGroups (): DefaultTheme.SidebarItem[] {
	let groups: DefaultTheme.SidebarItem[] = []

	for (let { name, group } of readRules()) {
		let last = groups.at(-1)

		if (last?.text !== group) {
			last = { text: group, collapsed: true, items: [] }

			groups.push(last)
		}

		last.items?.push({ text: name, link: `/rules/${name}` })
	}

	return groups
}

let syntaxItems: DefaultTheme.SidebarItem[] = namespaces.flatMap((syntax) => (syntax.namespace === undefined ? [] : [{ text: syntax.namespace, link: `/syntaxes/${syntax.namespace}` }]))

let userGuide: DefaultTheme.SidebarItem[] = [
	{ text: `Why?`, link: `/user-guide/why` },
	{ text: `Getting started`, link: `/user-guide/getting-started` },
	{ text: `Rules`, link: `/user-guide/rules` },
	{ text: `Custom syntaxes`, link: `/user-guide/custom-syntaxes`, items: syntaxItems },
	{ text: `Typed configuration`, link: `/user-guide/typed-configuration` },
	{ text: `Conflicting settings`, link: `/user-guide/conflicting-settings` },
]

let contribute: DefaultTheme.SidebarItem[] = [{ text: `Contributing`, link: `/contributing` }]

let developerGuide: DefaultTheme.SidebarItem[] = [{ text: `Writing rules`, link: `/developer-guide/rules` }]

let maintainerGuide: DefaultTheme.SidebarItem[] = [
	{ text: `Issues`, link: `/maintainer-guide/issues` },
	{ text: `Pull requests`, link: `/maintainer-guide/pull-requests` },
	{ text: `Releases`, link: `/maintainer-guide/releases` },
]

/** The guides by the reader they are written for: whoever uses the plugin, whoever wants to help, whoever writes a rule, and whoever maintains the repository. */
let guides: DefaultTheme.SidebarItem[] = [
	{ text: `User guide`, items: userGuide },
	{ text: `Contribute`, items: contribute },
	{ text: `Developer guide`, items: developerGuide },
	{ text: `Maintainer guide`, items: maintainerGuide },
]

export default defineConfig({
	title: `Stylelint Stylistic`,
	description: `Formatting and Linting in one go, with fully customizable rules`,

	// A browser takes the SVG icon where it reads one, the `.ico` where it does not, and iOS takes the PNG.
	head: [
		[`meta`, { name: `viewport`, content: `width=device-width` }],
		[`meta`, { name: `color-scheme`, content: `light dark` }],
		[`link`, { rel: `icon`, type: `image/svg+xml`, href: `/favicon.svg` }],
		[`link`, { rel: `alternate icon`, href: `/favicon.ico`, sizes: `32x32` }],
		[`link`, { rel: `manifest`, href: `/manifest.webmanifest` }],

		// The card a chat or a feed shows in place of the address; `docs/og/index.html` is what `og.png` is rendered from.
		[`meta`, { property: `og:type`, content: `website` }],
		[`meta`, { property: `og:url`, content: SITE }],
		[`meta`, { property: `og:title`, content: `Stylelint Stylistic` }],
		[`meta`, { property: `og:description`, content: `Formatting and Linting in one go, with fully customizable rules` }],
		[`meta`, { property: `og:image`, content: `${SITE}og.png` }],
		[`meta`, { name: `twitter:card`, content: `summary_large_image` }],
	],
	// VitePress preloads a font only for the default theme's Inter, which `theme/index.ts` leaves out, so the Latin faces of Geist and Geist Mono are preloaded here: the ones every page opens with. VitePress writes the head after its stylesheets and scripts, so `transformHtml` lifts these above them.
	transformHead: ({ assets }) => assets.filter((file) => GEIST_LATIN.test(file)).map((font) => [`link`, { rel: `preload`, href: font, as: `font`, type: `font/woff2`, crossorigin: `` }]),
	transformHtml: (html) => {
		let first = [
			`<meta name="viewport" content="width=device-width">`,
			`<meta name="color-scheme" content="light dark">`,
		]
		let content = html
		for (let tag of first) content = content.replace(`\n    ${tag}`, ``)
		let fonts = content.match(FONT_PRELOAD)?.join(``) ?? ``
		content = content.replace(FONT_PRELOAD, ``)
		content = content.replace(/\n {4}<link rel="preload stylesheet"/u, `${fonts}$&`)
		content = content.replace(STYLESHEET_PRELOAD, `<link rel="stylesheet"$1`)
		return content.replace(`<meta charset="utf-8">`, `$&\n    ${first.join(`\n    `)}`)
	},

	// No switch: the scheme follows the system alone, which is `theme/style.css`'s to answer, and VitePress writes neither the `dark` class nor the script that restores a choice.
	appearance: false,
	base: `/`,
	srcDir: `..`,
	srcExclude: [
		`node_modules/**`,
		`tmp/**`,
		`dist/**`,
		`.claude/**`,
		`lib/**/*.test.*`,
		`scripts/**`,
		`types/**`,
		`AGENTS*.md`,
		`CLAUDE*.md`,
		`LICENSE.md`,
		`README.md`,
	],
	rewrites: rewritePath,
	cleanUrls: true,
	lastUpdated: true,
	ignoreDeadLinks: false,

	// A rule's page is titled by the rule's name, which is code; the class is what `theme/style.css` sets that title in the mono face by.
	transformPageData (pageData) {
		if (pageData.filePath.startsWith(`lib/rules/`)) pageData.frontmatter.pageClass = `rule-page`
	},
	markdown: {
		config (md) {
			let renderLink = md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self): string => self.renderToken(tokens, idx, options))
			let renderCode = md.renderer.rules.code_inline ?? ((tokens, idx, options, _env, self): string => self.renderToken(tokens, idx, options))

			// A relative link to a Markdown file is written for GitHub, where the file lies in the repository, and VitePress resolves it as written, without asking `rewrites` where the file is served; so the link is resolved against the source file (`env.realPath`, where `env.path` is already the rewritten one) and translated to the page before VitePress reads it
			md.renderer.rules.link_open = (tokens, idx, options, env, self): string => {
				let token = tokens[idx]
				let target = RELATIVE_MARKDOWN_LINK.exec(token?.attrGet(`href`) ?? ``)
				let file = target?.[1]

				if (token && file !== undefined && typeof env.realPath === `string`) {
					let source = path.relative(ROOT, path.resolve(path.dirname(env.realPath), file))

					token.attrSet(`href`, `/${rewritePath(source)}${target?.[2] ?? ``}`)
				}

				return renderLink(tokens, idx, options, env, self)
			}

			// VitePress wraps a fenced block in `v-pre` and an inline code span in nothing, so a `{{` inside one — the changelog spells one — is read by Vue as an interpolation
			md.renderer.rules.code_inline = (tokens, idx, options, env, self): string => {
				tokens[idx]?.attrSet(`v-pre`, ``)

				return renderCode(tokens, idx, options, env, self)
			}
		},
	},
	// The public directory is resolved against `srcDir`, which here is the root of the repository, so the site's own one has to be named.
	vite: {
		publicDir: `docs/public`,
		// The bar folds its units into a `⋯` menu as it runs short of room, which for a single icon trades it for another one; the theme's engine for it is replaced, and the burger alone folds the bar on a narrow screen.
		resolve: { alias: [{ find: /^\.\.\/composables\/nav-overflow$/u, replacement: NO_NAV_OVERFLOW }] },
	},
	themeConfig: {
		logo: `/logo.svg`,
		nav: [
			{ text: `Guide`, items: guides.map(({ text, items }) => ({ text, items: items as DefaultTheme.NavItemWithLink[] })) },
			{ text: `Rules`, link: `/user-guide/rules` },
			{ text: `Changelog`, link: `/changelog` },
			{ text: `v${version}`, link: `${REPOSITORY}/releases` },
		],
		sidebar: {
			"/rules/": readRuleGroups(),
			"/syntaxes/": [{ text: `Custom syntaxes`, link: `/user-guide/custom-syntaxes`, items: syntaxItems }],
			"/": guides,
		},
		outline: `deep`,
		editLink: {
			pattern: `${REPOSITORY}/edit/main/:path`,
			text: `Edit this page on GitHub`,
		},
		search: { provider: `local` },
		socialLinks: [{ icon: `github`, link: REPOSITORY }],
		footer: { message: `Released under the MIT License.` },
	},
})
