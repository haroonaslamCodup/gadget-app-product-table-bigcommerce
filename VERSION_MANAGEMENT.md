# Version Management

This project uses automated version bumping when changes are merged to the `main` branch.

## How It Works

### Automatic Version Bumping

When you merge a PR from `staging` → `main`, the **Version Bump** workflow automatically:

1. Determines the version bump type based on your commit message
2. Bumps the version in `package.json`
3. Creates a git tag (`v1.2.3`)
4. Pushes the changes back to `main`
5. Creates a GitHub Release

### Version Bump Types

Control the version bump type by adding keywords to your commit message:

- **PATCH** (default): `1.0.0` → `1.0.1`
  - Bug fixes, minor changes
  - No keyword needed (default behavior)

- **MINOR**: `1.0.0` → `1.1.0`
  - Add `[minor]` to your commit message
  - New features, backwards-compatible changes

- **MAJOR**: `1.0.0` → `2.0.0`
  - Add `[major]` to your commit message
  - Breaking changes, major overhauls

### Examples

```bash
# Patch version bump (1.0.0 → 1.0.1)
git commit -m "fix: resolve widget loading issue"

# Minor version bump (1.0.0 → 1.1.0)
git commit -m "[minor] feat: add new table sorting feature"

# Major version bump (1.0.0 → 2.0.0)
git commit -m "[major] refactor: complete widget API redesign"
```

## Single Source of Truth

The version in `package.json` is used everywhere in the app:

### In Code

```typescript
import { APP_VERSION, WIDGET_VERSION } from './web/version';

console.log(`App version: ${APP_VERSION}`);        // "1.0.0"
console.log(`Widget version: ${WIDGET_VERSION}`);  // "v1.0.0"
```

### In Widget Loader

The widget automatically logs its version:
```javascript
// Browser console output:
// 📦 Product Table Widget v1.0.0 loaded
```

Access programmatically:
```javascript
window.ProductTableWidget.version;      // "v1.0.0"
window.ProductTableWidget.appVersion;   // "1.0.0"
```

### In CI/CD

Version is available in all workflows:
```yaml
- name: Get version
  id: version
  run: |
    VERSION=$(node -p "require('./package.json').version")
    echo "version=$VERSION" >> $GITHUB_OUTPUT
```

## Manual Version Bumping

If you need to bump the version manually (locally):

```bash
# Patch (1.0.0 → 1.0.1)
npm version patch

# Minor (1.0.0 → 1.1.0)
npm version minor

# Major (1.0.0 → 2.0.0)
npm version major

# Specific version
npm version 2.5.3

# Push tags
git push origin main --follow-tags
```

## Skipping Version Bump

To push to `main` without triggering a version bump, add `[skip ci]` to your commit message:

```bash
git commit -m "docs: update README [skip ci]"
```

## Version Files

- **`package.json`** - Single source of truth
- **`web/version.ts`** - Auto-exports version from package.json
- **`.github/workflows/version-bump.yml`** - Automated version bumping workflow

## Workflow Flow

```
1. Feature Branch
   ↓
2. PR to Staging
   ↓
3. Merge to Staging (no version bump)
   ↓
4. PR from Staging to Main
   ↓
5. Merge to Main
   ↓
6. Version Bump Workflow Runs:
   - Reads commit message
   - Bumps version in package.json
   - Creates git tag (v1.2.3)
   - Pushes to main
   - Creates GitHub Release
```

## Checking Current Version

```bash
# From terminal
node -p "require('./package.json').version"

# From browser console (after widget loads)
console.log(window.ProductTableWidget.version);

# From code
import { APP_VERSION } from './web/version';
console.log(APP_VERSION);
```

## Best Practices

1. **Use Semantic Versioning**: Follow [semver.org](https://semver.org/)
   - MAJOR: Breaking changes
   - MINOR: New features (backwards-compatible)
   - PATCH: Bug fixes

2. **Write Clear Commit Messages**:
   - Include `[minor]` or `[major]` when appropriate
   - Default is always PATCH

3. **Check Release Notes**:
   - GitHub Releases are auto-created
   - Add custom release notes after auto-creation

4. **Version Consistency**:
   - Don't manually edit `package.json` version
   - Let the workflow handle it

## Troubleshooting

### Version didn't bump after merge

**Check:**
- Did commit message contain `[skip ci]`?
- Did the workflow run? (Check Actions tab)
- Was there a workflow error?

### Multiple version bumps on same commit

**This shouldn't happen**, but if it does:
- The workflow checks for `[skip ci]` in the version bump commit
- Only one bump should occur per merge

### Need to revert a version

```bash
# Revert the version bump commit
git revert <commit-hash>
git push origin main

# Or manually set version
npm version 1.0.0
git push origin main --follow-tags
```
