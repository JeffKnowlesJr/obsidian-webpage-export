# Requirements Document

## Introduction

This specification defines requirements for streamlining the Obsidian Webpage HTML Export plugin to eliminate unnecessary complexity and focus on web deployment use cases. The goal is to create a simplified, opinionated version that prioritizes ease of use for publishing digital gardens and knowledge bases online.

## Glossary

- **Plugin**: The Obsidian Webpage HTML Export plugin
- **Web Mode**: Simplified export mode optimized for online publishing
- **Docker Export**: Automated export process using Docker containers
- **Digital Garden**: A publicly accessible collection of interconnected notes
- **Vault**: An Obsidian workspace containing markdown files and configuration
- **Export Pipeline**: The process of converting Obsidian notes to HTML website

## Requirements

### Requirement 1: Simplified Export Modes

**User Story:** As a digital garden creator, I want a single, optimized export mode so that I don't have to choose between confusing options.

#### Acceptance Criteria

1. WHEN the user initiates an export, THE Plugin SHALL provide only one export mode optimized for web publishing
2. THE Plugin SHALL eliminate the "Local Mode" and "Raw Documents Mode" options from the user interface
3. THE Plugin SHALL use web-optimized defaults (external CSS/JS, slugified URLs, all interactive features enabled)
4. THE Plugin SHALL automatically enable search, graph view, file navigation, and theme toggle features
5. THE Plugin SHALL generate SEO-friendly HTML structure by default

### Requirement 2: Streamlined Configuration Interface

**User Story:** As a content creator, I want minimal configuration options so that I can focus on writing instead of technical setup.

#### Acceptance Criteria

1. THE Plugin SHALL reduce configuration options to essential settings only
2. THE Plugin SHALL provide a simplified settings panel with maximum 10 configuration options
3. THE Plugin SHALL use sensible defaults for all non-essential settings
4. THE Plugin SHALL group related settings into logical sections (Site Info, Features, Advanced)
5. THE Plugin SHALL hide technical options (asset inlining, CSS processing) from the main interface
6. WHERE advanced configuration is needed, THE Plugin SHALL provide preset configurations via JSON files

### Requirement 3: Docker-First Architecture

**User Story:** As a developer, I want Docker deployment to be the primary method so that I can easily automate publishing workflows.

#### Acceptance Criteria

1. THE Plugin SHALL prioritize Docker deployment over manual exports
2. THE Plugin SHALL provide a single Docker command for complete vault export
3. THE Plugin SHALL include GitHub Actions templates in the plugin distribution
4. THE Plugin SHALL validate vault structure and provide clear error messages for Docker exports
5. THE Plugin SHALL optimize Docker image size and build time
6. THE Plugin SHALL support configuration via environment variables for CI/CD integration

### Requirement 4: Opinionated Web Defaults

**User Story:** As a knowledge worker, I want the exported website to work perfectly out-of-the-box so that I don't need web development expertise.

#### Acceptance Criteria

1. THE Plugin SHALL enable all interactive features by default (search, graph, navigation, theme toggle)
2. THE Plugin SHALL use web-optimized asset handling (external files, CDN-ready structure)
3. THE Plugin SHALL generate responsive design that works on mobile devices
4. THE Plugin SHALL include proper meta tags for SEO and social sharing
5. THE Plugin SHALL create a sitemap.xml file automatically
6. THE Plugin SHALL generate Open Graph meta tags for social media previews

### Requirement 5: Simplified Asset Management

**User Story:** As a content publisher, I want images and attachments to work automatically so that I don't have to manage file paths manually.

#### Acceptance Criteria

1. THE Plugin SHALL automatically copy and optimize all referenced assets
2. THE Plugin SHALL convert image paths to web-friendly URLs automatically
3. THE Plugin SHALL generate responsive image variants for different screen sizes
4. THE Plugin SHALL compress images without quality loss
5. THE Plugin SHALL handle external images by downloading and hosting them locally
6. WHERE an asset cannot be processed, THE Plugin SHALL log a clear warning and continue export

### Requirement 6: Enhanced Docker Integration

**User Story:** As a DevOps engineer, I want seamless CI/CD integration so that I can automate content publishing workflows.

#### Acceptance Criteria

1. THE Plugin SHALL provide environment variable configuration for all essential settings
2. THE Plugin SHALL support vault validation before export begins
3. THE Plugin SHALL provide structured logging output for CI/CD monitoring
4. THE Plugin SHALL exit with appropriate status codes for success/failure scenarios
5. THE Plugin SHALL support incremental exports to reduce build times
6. THE Plugin SHALL include health check endpoints for container orchestration

### Requirement 7: Removed Complexity

**User Story:** As a non-technical user, I want the plugin to be simple to use so that I can publish my notes without learning complex configurations.

#### Acceptance Criteria

1. THE Plugin SHALL remove the export preset selection (Online/Local/Raw Documents)
2. THE Plugin SHALL remove individual asset inlining toggles from the main interface
3. THE Plugin SHALL remove advanced CSS and JavaScript processing options
4. THE Plugin SHALL remove file picker complexity by defaulting to entire vault export
5. THE Plugin SHALL remove plugin-specific style inclusion options
6. THE Plugin SHALL consolidate theme and styling options into a single "Appearance" section

### Requirement 8: Web-Optimized Output Structure

**User Story:** As a website administrator, I want the exported files to follow web standards so that I can host them on any platform.

#### Acceptance Criteria

1. THE Plugin SHALL generate a standard web directory structure (assets/, pages/, index.html)
2. THE Plugin SHALL create proper .htaccess or nginx configuration files for URL rewriting
3. THE Plugin SHALL generate a robots.txt file with sensible defaults
4. THE Plugin SHALL create a sitemap.xml with all pages and last-modified dates
5. THE Plugin SHALL use semantic HTML5 structure throughout
6. THE Plugin SHALL ensure all URLs are relative and portable across hosting platforms

### Requirement 9: Integrated Analytics and SEO

**User Story:** As a content marketer, I want built-in SEO optimization so that my digital garden can be discovered by search engines.

#### Acceptance Criteria

1. THE Plugin SHALL generate proper HTML meta tags for each page
2. THE Plugin SHALL create structured data markup for better search engine understanding
3. THE Plugin SHALL support Google Analytics integration via simple configuration
4. THE Plugin SHALL generate canonical URLs for each page
5. THE Plugin SHALL create proper heading hierarchy (H1, H2, H3) from markdown structure
6. WHERE frontmatter contains SEO data, THE Plugin SHALL use it for meta tag generation

### Requirement 10: Streamlined Documentation

**User Story:** As a new user, I want clear, concise documentation so that I can get started quickly without reading extensive manuals.

#### Acceptance Criteria

1. THE Plugin SHALL provide a single "Quick Start" guide for web deployment
2. THE Plugin SHALL include example GitHub Actions workflows in the plugin package
3. THE Plugin SHALL provide troubleshooting steps for common Docker issues
4. THE Plugin SHALL include example configuration files for typical use cases
5. THE Plugin SHALL remove outdated documentation for deprecated features
6. THE Plugin SHALL provide video tutorials for the most common workflows