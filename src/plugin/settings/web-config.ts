/**
 * Simplified configuration interface for web-optimized exports
 * This replaces the complex ExportPipelineOptions with essential settings only
 */

export interface WebConfig {
    version: string;
    
    // Site Information (Required)
    site: {
        name: string;
        description: string;
        url: string;
        favicon?: string;
    };
    
    // Features (All enabled by default for web optimization)
    features: {
        search: boolean;
        graphView: boolean;
        navigation: boolean;
        themeToggle: boolean;
        backlinks: boolean;
        tags: boolean;
        outline: boolean;
        sidebar: boolean;
    };
    
    // SEO & Analytics (Optional)
    seo: {
        googleAnalyticsId?: string;
        customMetaTags?: MetaTag[];
        generateSitemap: boolean;
        generateRobotsTxt: boolean;
    };
    
    // Advanced (Hidden from main UI)
    advanced: {
        customCSS?: string;
        excludePatterns: string[];
        imageOptimization: boolean;
        generateResponsiveImages: boolean;
        slugifyPaths: boolean;
        offlineResources: boolean;
    };
}

export interface MetaTag {
    name: string;
    content: string;
    property?: string; // For Open Graph tags
}

/**
 * Default web-optimized configuration
 */
export const DEFAULT_WEB_CONFIG: WebConfig = {
    version: "1.0.0",
    
    site: {
        name: "My Digital Garden",
        description: "A collection of interconnected notes and ideas",
        url: "https://example.com",
        favicon: undefined
    },
    
    features: {
        search: true,
        graphView: true,
        navigation: true,
        themeToggle: true,
        backlinks: true,
        tags: true,
        outline: true,
        sidebar: true
    },
    
    seo: {
        googleAnalyticsId: undefined,
        customMetaTags: [],
        generateSitemap: true,
        generateRobotsTxt: true
    },
    
    advanced: {
        customCSS: undefined,
        excludePatterns: ["Private/**", "Drafts/**", ".obsidian/**"],
        imageOptimization: true,
        generateResponsiveImages: true,
        slugifyPaths: true,
        offlineResources: false
    }
};

/**
 * Validates a WebConfig object and returns validation errors
 */
export function validateWebConfig(config: WebConfig): string[] {
    const errors: string[] = [];
    
    // Validate required site information
    if (!config.site.name || config.site.name.trim() === '') {
        errors.push("Site name is required");
    }
    
    if (!config.site.description || config.site.description.trim() === '') {
        errors.push("Site description is required");
    }
    
    if (!config.site.url || config.site.url.trim() === '') {
        errors.push("Site URL is required");
    } else {
        // Basic URL validation
        try {
            new URL(config.site.url);
        } catch {
            errors.push("Site URL must be a valid URL (e.g., https://example.com)");
        }
    }
    
    // Validate Google Analytics ID format if provided
    if (config.seo.googleAnalyticsId && 
        !config.seo.googleAnalyticsId.match(/^(G-[A-Z0-9]+|UA-\d+-\d+|GT-[A-Z0-9]+)$/)) {
        errors.push("Google Analytics ID must be in format G-XXXXXXXXXX, UA-XXXXXXXX-X, or GT-XXXXXXXXXX");
    }
    
    return errors;
}

/**
 * Creates a WebConfig from legacy ExportPipelineOptions
 * Used for migration from complex settings to simplified settings
 */
export function migrateFromLegacyConfig(legacyConfig: any): WebConfig {
    const config: WebConfig = JSON.parse(JSON.stringify(DEFAULT_WEB_CONFIG));
    
    // Migrate site information
    if (legacyConfig.siteName) {
        config.site.name = legacyConfig.siteName;
    }
    if (legacyConfig.faviconPath) {
        config.site.favicon = legacyConfig.faviconPath;
    }
    
    // Migrate feature settings from legacy feature options
    if (legacyConfig.searchOptions) {
        config.features.search = legacyConfig.searchOptions.enabled ?? true;
    }
    if (legacyConfig.graphViewOptions) {
        config.features.graphView = legacyConfig.graphViewOptions.enabled ?? true;
    }
    if (legacyConfig.fileNavigationOptions) {
        config.features.navigation = legacyConfig.fileNavigationOptions.enabled ?? true;
    }
    if (legacyConfig.themeToggleOptions) {
        config.features.themeToggle = legacyConfig.themeToggleOptions.enabled ?? true;
    }
    if (legacyConfig.backlinkOptions) {
        config.features.backlinks = legacyConfig.backlinkOptions.enabled ?? true;
    }
    if (legacyConfig.tagOptions) {
        config.features.tags = legacyConfig.tagOptions.enabled ?? true;
    }
    if (legacyConfig.outlineOptions) {
        config.features.outline = legacyConfig.outlineOptions.enabled ?? true;
    }
    if (legacyConfig.sidebarOptions) {
        config.features.sidebar = legacyConfig.sidebarOptions.enabled ?? true;
    }
    
    // Migrate advanced settings
    if (legacyConfig.slugifyPaths !== undefined) {
        config.advanced.slugifyPaths = legacyConfig.slugifyPaths;
    }
    if (legacyConfig.offlineResources !== undefined) {
        config.advanced.offlineResources = legacyConfig.offlineResources;
    }
    
    return config;
}