# Project Structure

## Root Level Organization
- **Configuration files**: TypeScript configs, build configs, linting, Docker
- **Package management**: package.json, package-lock.json, .npmrc
- **Obsidian plugin files**: manifest.json, manifest-beta.json, styles.css
- **Build output**: main.js (generated plugin bundle)

## Source Code Structure (`src/`)

### Plugin Code (`src/plugin/`)
- **main.ts** - Plugin entry point and initialization
- **exporter.ts** - Core export functionality
- **asset-loaders/** - Handle different asset types and file processing
- **features/** - Individual plugin features and components
- **render-api/** - Rendering engine and API interfaces
- **settings/** - Plugin configuration and user preferences
- **translations/** - Internationalization support
- **utils/** - Shared utility functions
- **website/** - Website generation and templating

### Frontend Code (`src/frontend/`)
- **main/** - Browser-side application entry point
- **graph-view/** - Interactive graph visualization components
- Built separately from plugin code for browser environment

### Shared Code (`src/shared/`)
- **shared.ts** - Common types and utilities
- **website-data.ts** - Data structures for exported websites
- **inserted-feature.ts** - Base classes for injectable features
- **features/** - Feature implementations used by both plugin and frontend

### Assets (`src/assets/`)
- **Static resources**: CSS, JavaScript, images
- **Text imports**: .txt.js, .txt.css files for embedding
- **Configuration**: Plugin style mappings and blacklists

## Build Artifacts
- **main.js** - Bundled plugin code (generated)
- **src/frontend/dist/** - Bundled frontend code (generated)

## Docker & CI
- **docker/** - Container scripts and utilities
- **action.yml** - GitHub Actions workflow definition
- **Dockerfile** - Multi-stage container build

## Naming Conventions
- TypeScript files use kebab-case for directories
- Feature modules organized by functionality
- Text assets use .txt extension for esbuild processing
- Shared code accessible to both plugin and frontend builds