import { appendFileSync } from "node:fs"

import stylelintPackageJson from "stylelint/package.json" with { type: "json" }

let range = stylelintPackageJson.engines?.node

if (!range) throw new Error(`Stylelint does not specify engines.node`)

let versions = range.split(`||`).map((part) => {
	let version = part.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/u)

	if (!version) throw new Error(`Cannot resolve minimum Node.js version: ${part}`)

	return `${version[1]}.${version[2] ?? 0}.${version[3] ?? 0}`
})

let output = JSON.stringify([...new Set(versions)])

if (process.env.GITHUB_OUTPUT) {
	appendFileSync(
		process.env.GITHUB_OUTPUT,
		`node_versions=${output}\n`,
	)
}

console.info(`Node.js matrix: ${output}`)
