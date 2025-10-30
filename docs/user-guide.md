# Obsidian Webpage HTML Export - Complete User Guide

## Table of Contents
1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Export Modes](#export-modes)
4. [Configuration](#configuration)
5. [Features](#features)
6. [Advanced Usage](#advanced-usage)
7. [Troubleshooting](#troubleshooting)

## Installation

### Community Plugin Installation (Recommended)
1. Open Obsidian Settings
2. Navigate to **Community Plugins**
3. Click **Browse** and search for "Webpage HTML Export"
4. Click **Install** and then **Enable**

### Manual Installation
1. Download the latest release from [GitHub](https://github.com/KosmosisDire/obsidian-webpage-export/releases)
2. Extract the ZIP file to `{VaultFolder}/.obsidian/plugins/webpage-html-export/`
3. Reload Obsidian or restart the application
4. Enable the plugin in Community Plugins settings

### Beta Installation (BRAT)
1. Install the [BRAT plugin](https://obsidian.md/plugins?id=obsidian42-brat)
2. Open BRAT settings and select "Add Beta Plugin"
3. Enter: `https://github.com/KosmosisDire/obsidian-webpage-export`
4. Click "Add Plugin"

## Quick Start

### First Export
1. Click the **folder-up icon** in the ribbon or use `Ctrl+P` → "Export as HTML"
2. Choose your export destination folder
3. Select files to export (or export entire vault)
4. Click **Export** and wait for completion
5. Open the generated `index.html` in your browser

### Export Current File
- **Right-click** any file → "Export as HTML"
- **Command Palette**: "Export only current file using previous settings"
- **Ribbon Icon**: Click and select current file

## Export Modes

### 1. Online Mode (Default)
**Best for**: Web hosting, GitHub Pages, Netlify

**Features**:
- Separate CSS/JS files for better caching
- Full search functionality
- Graph view with interactive navigation
- RSS feed generation
- SEO-optimized structure

**Configuration**:
- External assets (not inlined)
- Slugified URLs for web compatibility
- All interactive features enabled

### 2. Local Mode
**Best for**: Offline viewing, sharing single files

**Features**:
- Everything embedded in HTML files
- Works without internet connection
- Portable - can be moved between devices
- Single file option available

**Configuration**:
- All assets inlined (CSS, JS, fonts, images)
- Search disabled (requires server)
- RSS disabled
- Graph view and navigation enabled

### 3. Raw Documents Mode
**Best for**: Simple document conversion, minimal overhead

**Features**:
- Clean HTML output
- No interactive features
- Minimal file size
- Fast generation

**Configuration**:
- All assets inlined
- No navigation features
- No search or graph view
- Original file paths preserved

## Configuration

### Export Settings

#### File Selection
- **Entire Vault**: Export all markdown files
- **Selected Files**: Choose specific files/folders
- **Current File**: Export only the active file
- **Folder Export**: Right-click folder → Export as HTML

#### Output Options
- **Export Path**: Destination folder for generated website
- **Delete Old Files**: Remove outdated files from previous exports
- **Open After Export**: Automatically open the website after generation
- **Combine as Single File**: Create one HTML file with everything embedded

#### Asset Handling
- **Inline CSS**: Embed stylesheets directly in HTML
- **Inline JavaScript**: Embed scripts directly in HTML
- **Inline Fonts**: Embed font files as base64
- **Inline Media**: Embed images and videos
- **Slugify Paths**: Convert file paths to web-friendly URLs

### Feature Configuration

#### Search
- **Enable Search**: Add full-text search functionality
- **Search Placeholder**: Customize search input text
- **Search Position**: Choose where to place search bar

#### Graph View
- **Enable Graph**: Interactive node-link diagram
- **Show Attachments**: Include non-markdown files in graph
- **Node Size**: Adjust node sizing based on connections
- **Link Distance**: Control spacing between nodes

#### File Navigation
- **Enable File Tree**: Hierarchical file browser
- **Show Folders**: Display folder structure
- **Expand Depth**: Default expansion level
- **Sort Order**: Alphabetical or custom sorting

#### Theme Toggle
- **Enable Theme Toggle**: Light/dark mode switcher
- **Default Theme**: Starting theme (light/dark/auto)
- **Position**: Where to place the toggle button

#### Document Features
- **Show Outline**: Table of contents for each page
- **Show Properties**: Display frontmatter properties
- **Show Tags**: Display note tags
- **Show Aliases**: Display note aliases
- **Show Backlinks**: Display incoming links

### Advanced Settings

#### Custom Head Content
Add custom HTML to the `<head>` section:
```html
<meta name="author" content="Your Name">
<link rel="canonical" href="https://yoursite.com">
<script async src="https://analytics.example.com/script.js"></script>
```

#### RSS Configuration
- **Enable RSS**: Generate RSS feed for your content
- **Feed Title**: Name of your RSS feed
- **Feed Description**: Description for RSS readers
- **Date Property**: Frontmatter property for post dates
- **Max Items**: Number of items in feed

#### Plugin Compatibility
- **Dataview**: Renders dataview queries in exported HTML
- **Tasks**: Converts task lists with proper formatting
- **Mermaid**: Renders diagrams as SVG
- **MathJax**: Renders mathematical expressions
- **Excalidraw**: Exports drawings as images

## Features

### Interactive Components

#### Full-Text Search
- **Instant Search**: Real-time results as you type
- **Fuzzy Matching**: Finds results even with typos
- **Content Preview**: Shows matching text snippets
- **Keyboard Navigation**: Use arrow keys and Enter

**Usage**:
1. Type in the search box
2. Click results to navigate
3. Use `Esc` to close search
4. Use `Ctrl+K` or `/` to focus search

#### Graph View
- **Interactive Nodes**: Click to navigate to notes
- **Zoom and Pan**: Mouse wheel and drag to explore
- **Hover Previews**: See note content on hover
- **Filter Options**: Show/hide different node types

**Controls**:
- **Mouse Wheel**: Zoom in/out
- **Click + Drag**: Pan around the graph
- **Click Node**: Navigate to that note
- **Hover Node**: Preview note content

#### File Navigation Tree
- **Hierarchical Structure**: Mirrors your vault organization
- **Expand/Collapse**: Click folders to expand
- **Current Page Highlight**: Shows your current location
- **Search Integration**: Highlights search results

#### Document Outline
- **Auto-Generated**: Based on heading structure
- **Clickable Links**: Jump to sections
- **Nested Structure**: Reflects heading hierarchy
- **Scroll Sync**: Highlights current section

### Content Features

#### Link Handling
- **Internal Links**: Converted to relative HTML links
- **Wikilinks**: `[[Note Name]]` converted to proper links
- **Embed Links**: `![[Note]]` embeds content inline
- **External Links**: Preserved with proper attributes

#### Image Processing
- **Local Images**: Copied and optimized
- **External Images**: Linked or optionally downloaded
- **Image Formats**: Supports PNG, JPG, GIF, SVG, WebP
- **Responsive Images**: Automatic sizing for mobile

#### Code Blocks
- **Syntax Highlighting**: Preserved from Obsidian
- **Language Detection**: Automatic or specified
- **Copy Button**: Easy code copying
- **Line Numbers**: Optional line numbering

#### Mathematical Expressions
- **LaTeX Support**: Renders math expressions
- **Inline Math**: `$equation$` format
- **Block Math**: `$$equation$$` format
- **MathJax Integration**: High-quality rendering

### Styling and Themes

#### Theme Compatibility
- **Obsidian Themes**: Exports with your current theme
- **Custom CSS**: Includes your CSS snippets
- **Plugin Styles**: Maintains plugin-specific styling
- **Responsive Design**: Works on all device sizes

#### Dark/Light Mode
- **Automatic Toggle**: Respects system preferences
- **Manual Toggle**: User can switch modes
- **Persistent Choice**: Remembers user preference
- **Smooth Transitions**: Animated theme switching

## Advanced Usage

### Automation with Docker

The plugin provides comprehensive Docker automation for CI/CD pipelines. Docker runs Obsidian headlessly using electron-injector to perform automated exports.

#### Quick Start
```bash
# Basic export
docker run --rm \
  -v ./vault:/vault \
  -v ./output:/output \
  -e EXPORT_ENTIRE_VAULT=true \
  kosmosisdire/obsidian-webpage-export:latest
```

#### GitHub Actions Integration
```yaml
name: Export Obsidian Vault
on:
  push:
    branches: [main]
  
jobs:
  export:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Export with Docker
        run: |
          mkdir -p ./output
          docker run --rm \
            -v ${{ github.workspace }}/vault:/vault \
            -v ${{ github.workspace }}/output:/output \
            -e EXPORT_ENTIRE_VAULT=true \
            kosmosisdire/obsidian-webpage-export:latest
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./output
```

> **📖 Complete Docker Guide**: For detailed Docker setup, configuration options, troubleshooting, and advanced automation scenarios, see the [Docker Automation Guide](docker-automation-guide.md).

### Custom Styling

#### CSS Customization
Add custom CSS in Obsidian settings or via custom head content:
```css
/* Custom navigation styling */
.nav-tree {
  background: var(--background-secondary);
  border-radius: 8px;
}

/* Custom search styling */
.search-input {
  border: 2px solid var(--interactive-accent);
}

/* Custom graph styling */
.graph-view {
  background: linear-gradient(45deg, #1e1e1e, #2d2d2d);
}
```

#### JavaScript Customization
Add custom JavaScript functionality:
```javascript
// Custom search behavior
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.querySelector('.search-input');
  searchInput.addEventListener('focus', function() {
    console.log('Search focused');
  });
});

// Custom graph interactions
window.addEventListener('graphReady', function() {
  console.log('Graph view loaded');
});
```

### Plugin Integration

#### Dataview Queries
Dataview queries are automatically rendered:
```dataview
TABLE file.mtime as "Modified"
FROM "Projects"
SORT file.mtime DESC
LIMIT 10
```

#### Task Management
Tasks plugin formatting is preserved:
```markdown
- [ ] Incomplete task
- [x] Completed task
- [>] Rescheduled task
- [!] Important task
```

#### Templater Integration
Templater templates are processed during export:
```markdown
# <% tp.file.title %>
Created: <% tp.date.now() %>
Tags: <% tp.frontmatter.tags %>
```

## Troubleshooting

### Common Issues

#### Export Fails
**Problem**: Export process stops with error
**Solutions**:
1. Check file permissions on export directory
2. Ensure export path exists and is writable
3. Check for special characters in file names
4. Verify vault integrity (no corrupted files)

#### Missing Styles
**Problem**: Exported site looks different from Obsidian
**Solutions**:
1. Update to latest plugin version
2. Check if custom CSS snippets are enabled
3. Verify theme compatibility
4. Clear browser cache and reload

#### Search Not Working
**Problem**: Search functionality doesn't work
**Solutions**:
1. Ensure search is enabled in settings
2. Check if using local mode (search disabled)
3. Verify JavaScript is enabled in browser
4. Check browser console for errors

#### Graph View Issues
**Problem**: Graph view doesn't load or display correctly
**Solutions**:
1. Check browser JavaScript console for errors
2. Ensure graph view is enabled in settings
3. Try different browser or clear cache
4. Check if files have proper links between them

#### Large Vault Performance
**Problem**: Export takes very long or fails on large vaults
**Solutions**:
1. Export in smaller batches
2. Exclude unnecessary files (images, PDFs)
3. Use "Only export modified" option
4. Increase system memory allocation

#### Docker Issues
**Problem**: Docker export fails or produces errors
**Solutions**:
1. Check Docker container logs
2. Verify volume mounts are correct
3. Ensure proper file permissions
4. Update to latest Docker image

### Performance Optimization

#### Large Vaults
- Use selective file export instead of entire vault
- Enable "Only export modified files"
- Exclude large binary files when possible
- Use external asset linking instead of inlining

#### Asset Optimization
- Compress images before adding to vault
- Use web-optimized image formats (WebP, optimized PNG)
- Minimize custom CSS and JavaScript
- Use CDN links for external libraries

#### Build Speed
- Use SSD storage for vault and export destination
- Increase available RAM for large exports
- Close unnecessary applications during export
- Use local export path (not network drives)

### Getting Help

#### Documentation
- [Official Documentation](https://docs.obsidianweb.net/)
- [GitHub Repository](https://github.com/KosmosisDire/obsidian-webpage-export)
- [Community Forum](https://forum.obsidian.md/)

#### Support Channels
- GitHub Issues for bug reports
- Obsidian Discord for community help
- Plugin settings for feature requests

#### Contributing
- Report bugs with detailed reproduction steps
- Suggest features through GitHub issues
- Contribute code via pull requests
- Help with documentation improvements

## Tips and Best Practices

### Vault Organization
- Use consistent folder structure
- Keep related notes in same folders
- Use descriptive file names
- Maintain clean link structure

### Content Creation
- Use proper heading hierarchy (H1 → H2 → H3)
- Add meaningful tags and properties
- Create index pages for major topics
- Use consistent naming conventions

### Export Strategy
- Test exports with small subsets first
- Use version control for export configurations
- Backup vaults before major exports
- Document custom configurations

### Performance
- Regular vault maintenance and cleanup
- Optimize images and media files
- Use appropriate export presets
- Monitor export logs for issues