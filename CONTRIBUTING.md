# Contributing to InverApp

## Commit Convention

This project uses [Semantic Release](https://semantic-release.gitbook.io/semantic-release) commit format:

```
<type>: <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style (formatting, missing semi-colons, etc.) |
| `refactor` | Code refactoring |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks (deps, config, etc.) |
| `ci` | CI/CD changes |
| `build` | Build system changes |

### Breaking changes

Add `BREAKING CHANGE:` footer or `!` after the type:

```
feat!: drop support for Node 18

BREAKING CHANGE: Node 18 is no longer supported. Minimum is Node 20.
```

### Examples

```
feat: add portfolio dashboard with buy/sell flows
fix: redirect to home on logout
docs: add local dev setup to README
refactor: use Mozaic DataTable instead of custom HTML table
```

## Pull Requests

1. Create a branch from `main`
2. Make your changes
3. Ensure `pnpm build` passes
4. Open a PR using the template in `.github/pull_request_template.md`
5. Wait for review

## Local Development

```bash
pnpm install
cp .env.example .env
# Edit .env with your Supabase credentials
pnpm dev
```

See [README.md](README.md) for full setup instructions.
