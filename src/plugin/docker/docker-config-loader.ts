/**
 * Docker configuration loader for environment variable support
 * Maps environment variables to WebConfig properties for CI/CD integration
 */

import { WebConfig, DEFAULT_WEB_CONFIG, validateWebConfig, MetaTag } from '../settings/web-config';

export class DockerConfigLoader {
    /**
     * Load configuration from environment variables
     * Falls back to defaults for any missing values
     */
    static loadFromEnvironment(): WebConfig {
        const config: WebConfig = JSON.parse(JSON.stringify(DEFAULT_WEB_CONFIG));
        
        // Site Information
        if (process.env.OBSIDIAN_SITE_NAME) {
            config.site.name = process.env.OBSIDIAN_SITE_NAME;
        }
        
        if (process.env.OBSIDIAN_SITE_DESCRIPTION) {
            config.site.description = process.env.OBSIDIAN_SITE_DESCRIPTION;
        }
        
        if (process.env.OBSIDIAN_SITE_URL) {
            config.site.url = process.env.OBSIDIAN_SITE_URL;
        }
        
        if (process.env.OBSIDIAN_SITE_FAVICON) {
            config.site.favicon = process.env.OBSIDIAN_SITE_FAVICON;
        }
        
        // Features (boolean environment variables)
        config.features.search = this.parseBooleanEnv('OBSIDIAN_FEATURE_SEARCH', config.features.search);
        config.features.graphView = this.parseBooleanEnv('OBSIDIAN_FEATURE_GRAPH_VIEW', config.features.graphView);
        config.features.navigation = this.parseBooleanEnv('OBSIDIAN_FEATURE_NAVIGATION', config.features.navigation);
        config.features.themeToggle = this.parseBooleanEnv('OBSIDIAN_FEATURE_THEME_TOGGLE', config.features.themeToggle);
        config.features.backlinks = this.parseBooleanEnv('OBSIDIAN_FEATURE_BACKLINKS', config.features.backlinks);
        config.features.tags = this.parseBooleanEnv('OBSIDIAN_FEATURE_TAGS', config.features.tags);
        config.features.outline = this.parseBooleanEnv('OBSIDIAN_FEATURE_OUTLINE', config.features.outline);
        config.features.sidebar = this.parseBooleanEnv('OBSIDIAN_FEATURE_SIDEBAR', config.features.sidebar);
        
        // SEO & Analytics
        if (process.env.OBSIDIAN_GOOGLE_ANALYTICS_ID) {
            config.seo.googleAnalyticsId = process.env.OBSIDIAN_GOOGLE_ANALYTICS_ID;
        }
        
        config.seo.generateSitemap = this.parseBooleanEnv('OBSIDIAN_GENERATE_SITEMAP', config.seo.generateSitemap);
        config.seo.generateRobotsTxt = this.parseBooleanEnv('OBSIDIAN_GENERATE_ROBOTS_TXT', config.seo.generateRobotsTxt);
        
        // Custom meta tags from JSON string
        if (process.env.OBSIDIAN_CUSTOM_META_TAGS) {
            try {
                const metaTags = JSON.parse(process.env.OBSIDIAN_CUSTOM_META_TAGS) as MetaTag[];
                if (Array.isArray(metaTags)) {
                    config.seo.customMetaTags = metaTags;
                }
            } catch (error) {
                console.warn('Invalid OBSIDIAN_CUSTOM_META_TAGS JSON format, using defaults');
            }
        }
        
        // Advanced settings
        if (process.env.OBSIDIAN_CUSTOM_CSS) {
            config.advanced.customCSS = process.env.OBSIDIAN_CUSTOM_CSS;
        }
        
        // Exclude patterns from comma-separated string
        if (process.env.OBSIDIAN_EXCLUDE_PATTERNS) {
            config.advanced.excludePatterns = process.env.OBSIDIAN_EXCLUDE_PATTERNS
                .split(',')
                .map(pattern => pattern.trim())
                .filter(pattern => pattern.length > 0);
        }
        
        config.advanced.imageOptimization = this.parseBooleanEnv('OBSIDIAN_IMAGE_OPTIMIZATION', config.advanced.imageOptimization);
        config.advanced.generateResponsiveImages = this.parseBooleanEnv('OBSIDIAN_RESPONSIVE_IMAGES', config.advanced.generateResponsiveImages);
        config.advanced.slugifyPaths = this.parseBooleanEnv('OBSIDIAN_SLUGIFY_PATHS', config.advanced.slugifyPaths);
        config.advanced.offlineResources = this.parseBooleanEnv('OBSIDIAN_OFFLINE_RESOURCES', config.advanced.offlineResources);
        
        return config;
    }
    
    /**
     * Validate configuration loaded from environment variables
     * Returns validation errors if any
     */
    static validateEnvironmentConfig(config: WebConfig): string[] {
        return validateWebConfig(config);
    }
    
    /**
     * Get all supported environment variables with their descriptions
     * Useful for documentation and debugging
     */
    static getSupportedEnvironmentVariables(): Record<string, string> {
        return {
            // Site Information
            'OBSIDIAN_SITE_NAME': 'Name of the website (required)',
            'OBSIDIAN_SITE_DESCRIPTION': 'Description of the website (required)',
            'OBSIDIAN_SITE_URL': 'Base URL of the website (required, e.g., https://example.com)',
            'OBSIDIAN_SITE_FAVICON': 'Path to favicon file (optional)',
            
            // Features (true/false)
            'OBSIDIAN_FEATURE_SEARCH': 'Enable search functionality (default: true)',
            'OBSIDIAN_FEATURE_GRAPH_VIEW': 'Enable graph view (default: true)',
            'OBSIDIAN_FEATURE_NAVIGATION': 'Enable file navigation (default: true)',
            'OBSIDIAN_FEATURE_THEME_TOGGLE': 'Enable theme toggle (default: true)',
            'OBSIDIAN_FEATURE_BACKLINKS': 'Enable backlinks (default: true)',
            'OBSIDIAN_FEATURE_TAGS': 'Enable tags (default: true)',
            'OBSIDIAN_FEATURE_OUTLINE': 'Enable document outline (default: true)',
            'OBSIDIAN_FEATURE_SIDEBAR': 'Enable sidebar (default: true)',
            
            // SEO & Analytics
            'OBSIDIAN_GOOGLE_ANALYTICS_ID': 'Google Analytics tracking ID (optional, format: G-XXXXXXXXXX)',
            'OBSIDIAN_GENERATE_SITEMAP': 'Generate sitemap.xml (default: true)',
            'OBSIDIAN_GENERATE_ROBOTS_TXT': 'Generate robots.txt (default: true)',
            'OBSIDIAN_CUSTOM_META_TAGS': 'Custom meta tags as JSON array (optional)',
            
            // Advanced Settings
            'OBSIDIAN_CUSTOM_CSS': 'Custom CSS to inject (optional)',
            'OBSIDIAN_EXCLUDE_PATTERNS': 'Comma-separated list of patterns to exclude (default: Private/**,Drafts/**,.obsidian/**)',
            'OBSIDIAN_IMAGE_OPTIMIZATION': 'Enable image optimization (default: true)',
            'OBSIDIAN_RESPONSIVE_IMAGES': 'Generate responsive images (default: true)',
            'OBSIDIAN_SLUGIFY_PATHS': 'Convert paths to URL-friendly slugs (default: true)',
            'OBSIDIAN_OFFLINE_RESOURCES': 'Include resources for offline use (default: false)'
        };
    }
    
    /**
     * Generate example environment file content
     */
    static generateExampleEnvFile(): string {
        const envVars = this.getSupportedEnvironmentVariables();
        const lines: string[] = [
            '# Obsidian Webpage HTML Export - Environment Configuration',
            '# Copy this file to .env and customize the values',
            '',
            '# Required Site Information',
            'OBSIDIAN_SITE_NAME="My Digital Garden"',
            'OBSIDIAN_SITE_DESCRIPTION="A collection of interconnected notes and ideas"',
            'OBSIDIAN_SITE_URL="https://example.com"',
            '',
            '# Optional Site Settings',
            '# OBSIDIAN_SITE_FAVICON="favicon.ico"',
            '',
            '# Feature Toggles (true/false)',
            '# OBSIDIAN_FEATURE_SEARCH=true',
            '# OBSIDIAN_FEATURE_GRAPH_VIEW=true',
            '# OBSIDIAN_FEATURE_NAVIGATION=true',
            '# OBSIDIAN_FEATURE_THEME_TOGGLE=true',
            '# OBSIDIAN_FEATURE_BACKLINKS=true',
            '# OBSIDIAN_FEATURE_TAGS=true',
            '# OBSIDIAN_FEATURE_OUTLINE=true',
            '# OBSIDIAN_FEATURE_SIDEBAR=true',
            '',
            '# SEO & Analytics',
            '# OBSIDIAN_GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"',
            '# OBSIDIAN_GENERATE_SITEMAP=true',
            '# OBSIDIAN_GENERATE_ROBOTS_TXT=true',
            '# OBSIDIAN_CUSTOM_META_TAGS=\'[{"name":"author","content":"Your Name"}]\'',
            '',
            '# Advanced Settings',
            '# OBSIDIAN_CUSTOM_CSS="body { font-family: Arial; }"',
            '# OBSIDIAN_EXCLUDE_PATTERNS="Private/**,Drafts/**,.obsidian/**"',
            '# OBSIDIAN_IMAGE_OPTIMIZATION=true',
            '# OBSIDIAN_RESPONSIVE_IMAGES=true',
            '# OBSIDIAN_SLUGIFY_PATHS=true',
            '# OBSIDIAN_OFFLINE_RESOURCES=false'
        ];
        
        return lines.join('\n');
    }
    
    /**
     * Parse boolean environment variable with fallback
     */
    private static parseBooleanEnv(envVar: string, defaultValue: boolean): boolean {
        const value = process.env[envVar];
        if (value === undefined) {
            return defaultValue;
        }
        
        const lowerValue = value.toLowerCase().trim();
        if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
            return true;
        }
        if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') {
            return false;
        }
        
        console.warn(`Invalid boolean value for ${envVar}: "${value}". Using default: ${defaultValue}`);
        return defaultValue;
    }
    
    /**
     * Log current environment configuration for debugging
     */
    static logEnvironmentConfig(): void {
        const config = this.loadFromEnvironment();
        const supportedVars = this.getSupportedEnvironmentVariables();
        
        console.log('=== Docker Environment Configuration ===');
        console.log('Loaded configuration:');
        console.log(JSON.stringify(config, null, 2));
        
        console.log('\nEnvironment variables detected:');
        Object.keys(supportedVars).forEach(envVar => {
            const value = process.env[envVar];
            if (value !== undefined) {
                // Mask sensitive values
                const maskedValue = envVar.includes('ANALYTICS') ? '***' : value;
                console.log(`  ${envVar}=${maskedValue}`);
            }
        });
        
        const errors = this.validateEnvironmentConfig(config);
        if (errors.length > 0) {
            console.log('\nConfiguration errors:');
            errors.forEach(error => console.log(`  - ${error}`));
        } else {
            console.log('\nConfiguration is valid ✓');
        }
    }
}