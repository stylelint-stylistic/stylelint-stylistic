import { cwd } from "node:process"
import { join } from "node:path"
import { readFileSync } from "node:fs"

let changelogPath = join(cwd(), `CHANGELOG.md`)
let changelog = readFileSync(changelogPath, `utf-8`)
let unreleasedSection = changelog.split(`## [Unreleased]`)[1].split(`## [`)[0]
let versionType = ``

if (unreleasedSection.includes(`### Changed`)) {
	versionType = `major`
} else if (unreleasedSection.includes(`### Added`)) {
	versionType = `minor`
} else if (unreleasedSection.includes(`### Fixed`)) {
	versionType = `patch`
}

console.log(versionType)
