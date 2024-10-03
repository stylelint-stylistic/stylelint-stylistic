# Performing releases

> [!IMPORTANT]
> Releasing a new version makes sense only when there are changes that are significant for users. Therefore, the **Unreleased** section of the [CHANGELOG.md](https://github.com/stylelint-stylistic/stylelint-stylistic/blob/main/CHANGELOG.md) in the `main` branch should not be empty.

To release a new version:

1. Create a pull request from the `main` branch to the `release` branch.
2. After agreement with the other team members, [“Rebase and merge”](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/about-pull-request-merges#rebase-and-merge-your-commits) this pull request. This will trigger the GitHub Action for the release.
3. Wait for the successful completion of the action. Success means that:

	- In the new commit (with the new version number in the title), the package version in `package.json` and `CHANGELOG.md` has been updated.
	- This commit has a tag with the version number, and the `main` and `release` branches have been updated.
	- Release notes for the new version have appeared in the [Releases](https://github.com/stylistic-stylelint/stylistic-stylelint/releases).
	- The new version of the package has been published on [npmjs.org](https://www.npmjs.com/package/@stylistic/stylelint-plugin).
4. If the automation fails, check the [GitHub Actions logs](https://github.com/stylelint-stylistic/stylelint-stylistic/actions/workflows/release.yaml) for troubleshooting.

If necessary, release [`@stylistic/stylelint-config`](https://github.com/stylelint-stylistic/stylelint-config/).

> [!NOTE]
> The release level is determined automatically based on the presence of certain subsections in the **Unreleased** section of the changelog:
>
> - If there is **“Changed”** (with breaking changes) — it is always _major_, regardless of the presence of “Added” and “Fixed”.
> - If there is **“Added”** (with new features) — it is _minor_, regardless of the presence of “Fixed”.
> - If there is only **“Fixed”** (with bug fixes) — it is _patch_.
>
> This automation is not yet designed for alpha, beta, rc, and other pre-releases. In such rare cases, publication is done manually and locally.
