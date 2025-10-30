# Technology Stack

## Core Technologies
- **TypeScript** - Primary language for both plugin and frontend code
- **Node.js** - Runtime environment and build tooling
- **esbuild** - Fast bundler for both plugin and frontend builds
- **Obsidian API** - Plugin development framework

## Build System
- **esbuild** with custom configuration for dual builds:
  - Plugin build: Targets Obsidian environment (CommonJS, Node APIs)
  - Frontend build: Targets browser environment with text/binary loaders
- **TypeScript** compilation with separate configs for plugin and frontend
- **ESLint** for code quality with TypeScript support

## Key Dependencies
- **Production**: HTML processing (html-minifier-terser, postcss), file handling (mime, file-type), search (minisearch), RSS generation
- **Development**: Obsidian types, Electron, TypeScript toolchain, ESLint

## Common Commands

### Development
```bash
npm run dev          # Start development build with watch mode
```

### Production Build
```bash
npm run build        # Type check + production build
```

### Version Management
```bash
npm run version      # Bump version in manifest files and stage for git
```

## Architecture Notes
- Dual-build system: separate plugin (Node.js/Obsidian) and frontend (browser) bundles
- Custom esbuild plugin for post-processing and regex replacements
- Text file imports (.txt.js, .txt.css) for embedding assets
- External dependencies excluded from plugin bundle (Obsidian, Electron, CodeMirror)

## Docker Support
- Multi-stage build with Node.js for compilation and Debian for runtime
- Includes Obsidian installation and electron-injector for headless operation
- Supports automated exports via GitHub Actions