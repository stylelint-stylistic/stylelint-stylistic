import { execSync } from "node:child_process"
import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"

let output = execSync(`git diff --cached --name-only`, { encoding: `utf8` })

let files = output.trim().split(`\n`)

let dirs = files
	.filter((f) => f.endsWith(`.js`) && existsSync(f))
	.map((f) => dirname(resolve(f)))

let uniqueDirs = [...new Set(dirs)]

for (let dir of uniqueDirs) {
	try {
		execSync(`node --test --test-reporter dot "${dir}/*.test.js"`, { stdio: `inherit` })
	} catch {
		process.exitCode = 1
	}
}
