import { Plugin, PluginSettingTab, Setting, Notice } from 'obsidian';
import { WebConfig, DEFAULT_WEB_CONFIG, validateWebConfig, migrateFromLegacyConfig, MetaTag } from './web-config';
import { createDivider, createText, createToggle, createFileInput } from './settings-components';
import { Path } from 'src/plugin/utils/path';
import { i18n } from '../translations/language';

/**
 * Simplified web settings panel with maximum 10 essential options
 * Organized into logical sections: Basic, SEO, Advanced
 */
export class WebSettingsTab extends PluginSettingTab {
    private config: WebConfig;
    private plugin: Plugin;

    constructor(plugin: Plugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.config = JSON.parse(JSON.stringify(DEFAULT_WEB_CONFIG));
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.classList.add('webpage-html-web-settings');

        // Header
        const header = containerEl.createEl('h2', { text: 'Web Export Settings' });
        header.style.marginBottom = '20px';

        const description = containerEl.createEl('p', { 
            text: 'Simplified settings for web publishing. All interactive features are enabled by default for optimal web experience.',
            cls: 'setting-item-description'
        });
        description.style.marginBottom = '20px';

        // Create tabbed interface
        this.createTabbedInterface(containerEl);
    }

    private createTabbedInterface(container: HTMLElement): void {
        // Tab navigation
        const tabContainer = container.createDiv({ cls: 'web-settings-tabs' });
        const tabContent = container.createDiv({ cls: 'web-settings-content' });

        // Tab buttons
        const basicTab = tabContainer.createEl('button', { text: 'Basic', cls: 'web-settings-tab active' });
        const seoTab = tabContainer.createEl('button', { text: 'SEO', cls: 'web-settings-tab' });
        const advancedTab = tabContainer.createEl('button', { text: 'Advanced', cls: 'web-settings-tab' });

        // Tab content containers
        const basicContent = tabContent.createDiv({ cls: 'web-settings-tab-content active' });
        const seoContent = tabContent.createDiv({ cls: 'web-settings-tab-content' });
        const advancedContent = tabContent.createDiv({ cls: 'web-settings-tab-content' });

        // Tab switching logic
        const tabs = [basicTab, seoTab, advancedTab];
        const contents = [basicContent, seoContent, advancedContent];

        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and contents
                tabs.forEach(t => t.removeClass('active'));
                contents.forEach(c => c.removeClass('active'));
                
                // Add active class to clicked tab and corresponding content
                tab.addClass('active');
                contents[index].addClass('active');
            });
        });

        // Populate tab contents
        this.createBasicSettings(basicContent);
        this.createSEOSettings(seoContent);
        this.createAdvancedSettings(advancedContent);

        // Add CSS for tabs
        this.addTabStyles();
    }

    private createBasicSettings(container: HTMLElement): void {
        // Site Information Section
        const siteSection = container.createEl('div', { cls: 'settings-section' });
        const siteHeader = siteSection.createEl('h3', { text: 'Site Information' });
        siteHeader.style.marginBottom = '15px';

        // Site Name (Required)
        createText(siteSection, 'Site Name', 
            () => this.config.site.name,
            (value) => {
                this.config.site.name = value;
                this.saveConfig();
            },
            'The name of your digital garden or website'
        );

        // Site Description (Required)
        createText(siteSection, 'Site Description',
            () => this.config.site.description,
            (value) => {
                this.config.site.description = value;
                this.saveConfig();
            },
            'A brief description of your site for search engines and social media'
        );

        // Site URL (Required)
        createText(siteSection, 'Site URL',
            () => this.config.site.url,
            (value) => {
                this.config.site.url = value;
                this.saveConfig();
            },
            'The full URL where your site will be hosted (e.g., https://example.com)',
            (value) => {
                if (!value || value.trim() === '') return 'Site URL is required';
                try {
                    new URL(value);
                    return '';
                } catch {
                    return 'Please enter a valid URL (e.g., https://example.com)';
                }
            }
        );

        // Favicon (Optional)
        createFileInput(siteSection,
            () => this.config.site.favicon || '',
            (value) => {
                this.config.site.favicon = value || undefined;
                this.saveConfig();
            },
            {
                name: 'Favicon',
                description: 'Icon displayed in browser tabs (PNG, ICO, JPG, or SVG)',
                placeholder: 'Path to favicon file...',
                makeRelativeToVault: true,
                pickFolder: false,
                validation: (path) => path.validate({
                    allowEmpty: true,
                    allowAbsolute: true,
                    allowRelative: true,
                    allowFiles: true,
                    requireExists: true,
                    requireExtentions: ["png", "ico", "jpg", "jpeg", "svg"]
                }),
                browseButton: true
            }
        );

        createDivider(container);

        // Features Section
        const featuresSection = container.createEl('div', { cls: 'settings-section' });
        const featuresHeader = featuresSection.createEl('h3', { text: 'Interactive Features' });
        featuresHeader.style.marginBottom = '15px';

        const featuresNote = featuresSection.createEl('p', {
            text: 'All features are enabled by default for optimal web experience. Disable only if needed.',
            cls: 'setting-item-description'
        });
        featuresNote.style.marginBottom = '15px';

        // Essential features only (4 most important)
        createToggle(featuresSection, 'Search',
            () => this.config.features.search,
            (value) => {
                this.config.features.search = value;
                this.saveConfig();
            },
            'Enable full-text search functionality'
        );

        createToggle(featuresSection, 'Navigation',
            () => this.config.features.navigation,
            (value) => {
                this.config.features.navigation = value;
                this.saveConfig();
            },
            'Show file navigation tree'
        );

        createToggle(featuresSection, 'Graph View',
            () => this.config.features.graphView,
            (value) => {
                this.config.features.graphView = value;
                this.saveConfig();
            },
            'Interactive graph visualization of note connections'
        );

        createToggle(featuresSection, 'Theme Toggle',
            () => this.config.features.themeToggle,
            (value) => {
                this.config.features.themeToggle = value;
                this.saveConfig();
            },
            'Allow users to switch between light and dark themes'
        );
    }

    private createSEOSettings(container: HTMLElement): void {
        const seoSection = container.createEl('div', { cls: 'settings-section' });
        const seoHeader = seoSection.createEl('h3', { text: 'SEO & Analytics' });
        seoHeader.style.marginBottom = '15px';

        // Google Analytics
        createText(seoSection, 'Google Analytics ID',
            () => this.config.seo.googleAnalyticsId || '',
            (value) => {
                this.config.seo.googleAnalyticsId = value || undefined;
                this.saveConfig();
            },
            'Optional: Google Analytics tracking ID (G-XXXXXXXXXX, UA-XXXXXXXX-X, or GT-XXXXXXXXXX)',
            (value) => {
                if (!value || value.trim() === '') return '';
                if (!value.match(/^(G-[A-Z0-9]+|UA-\d+-\d+|GT-[A-Z0-9]+)$/)) {
                    return 'Invalid format. Use G-XXXXXXXXXX, UA-XXXXXXXX-X, or GT-XXXXXXXXXX';
                }
                return '';
            }
        );

        // Sitemap generation
        createToggle(seoSection, 'Generate Sitemap',
            () => this.config.seo.generateSitemap,
            (value) => {
                this.config.seo.generateSitemap = value;
                this.saveConfig();
            },
            'Automatically generate sitemap.xml for search engines'
        );

        // Robots.txt generation
        createToggle(seoSection, 'Generate Robots.txt',
            () => this.config.seo.generateRobotsTxt,
            (value) => {
                this.config.seo.generateRobotsTxt = value;
                this.saveConfig();
            },
            'Generate robots.txt file with sensible defaults'
        );

        createDivider(container);

        // Custom Meta Tags Section
        const metaSection = container.createEl('div', { cls: 'settings-section' });
        const metaHeader = metaSection.createEl('h3', { text: 'Custom Meta Tags' });
        metaHeader.style.marginBottom = '15px';

        const metaDescription = metaSection.createEl('p', {
            text: 'Add custom meta tags for enhanced SEO and social media integration.',
            cls: 'setting-item-description'
        });
        metaDescription.style.marginBottom = '15px';

        this.createMetaTagsList(metaSection);
    }

    private createAdvancedSettings(container: HTMLElement): void {
        const advancedSection = container.createEl('div', { cls: 'settings-section' });
        const advancedHeader = advancedSection.createEl('h3', { text: 'Advanced Options' });
        advancedHeader.style.marginBottom = '15px';

        const advancedNote = advancedSection.createEl('p', {
            text: 'These settings are pre-configured for optimal web deployment. Change only if you have specific requirements.',
            cls: 'setting-item-description'
        });
        advancedNote.style.marginBottom = '15px';

        // Additional features (hidden from basic view)
        createToggle(advancedSection, 'Backlinks',
            () => this.config.features.backlinks,
            (value) => {
                this.config.features.backlinks = value;
                this.saveConfig();
            },
            'Show backlinks for each note'
        );

        createToggle(advancedSection, 'Tags',
            () => this.config.features.tags,
            (value) => {
                this.config.features.tags = value;
                this.saveConfig();
            },
            'Display and filter by tags'
        );

        createToggle(advancedSection, 'Document Outline',
            () => this.config.features.outline,
            (value) => {
                this.config.features.outline = value;
                this.saveConfig();
            },
            'Show document outline/table of contents'
        );

        createDivider(container);

        // Web Optimization Settings
        createToggle(advancedSection, 'Slugify URLs',
            () => this.config.advanced.slugifyPaths,
            (value) => {
                this.config.advanced.slugifyPaths = value;
                this.saveConfig();
            },
            'Convert file paths to web-friendly URLs'
        );

        createToggle(advancedSection, 'Image Optimization',
            () => this.config.advanced.imageOptimization,
            (value) => {
                this.config.advanced.imageOptimization = value;
                this.saveConfig();
            },
            'Automatically optimize and compress images'
        );

        // Exclude Patterns
        const excludeSection = advancedSection.createEl('div', { cls: 'setting-item' });
        const excludeLabel = excludeSection.createEl('div', { cls: 'setting-item-info' });
        excludeLabel.createEl('div', { text: 'Exclude Patterns', cls: 'setting-item-name' });
        excludeLabel.createEl('div', { 
            text: 'File patterns to exclude from export (one per line)',
            cls: 'setting-item-description'
        });

        const excludeControl = excludeSection.createEl('div', { cls: 'setting-item-control' });
        const excludeTextarea = excludeControl.createEl('textarea');
        excludeTextarea.value = this.config.advanced.excludePatterns.join('\n');
        excludeTextarea.style.width = '100%';
        excludeTextarea.style.minHeight = '80px';
        excludeTextarea.addEventListener('input', () => {
            this.config.advanced.excludePatterns = excludeTextarea.value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            this.saveConfig();
        });
    }

    private createMetaTagsList(container: HTMLElement): void {
        const metaContainer = container.createEl('div', { cls: 'meta-tags-container' });
        
        // Display existing meta tags
        this.config.seo.customMetaTags?.forEach((tag, index) => {
            this.createMetaTagItem(metaContainer, tag, index);
        });

        // Add new meta tag button
        const addButton = container.createEl('button', { 
            text: 'Add Meta Tag',
            cls: 'mod-cta'
        });
        addButton.addEventListener('click', () => {
            if (!this.config.seo.customMetaTags) {
                this.config.seo.customMetaTags = [];
            }
            this.config.seo.customMetaTags.push({ name: '', content: '' });
            this.createMetaTagItem(metaContainer, this.config.seo.customMetaTags[this.config.seo.customMetaTags.length - 1], this.config.seo.customMetaTags.length - 1);
            this.saveConfig();
        });
    }

    private createMetaTagItem(container: HTMLElement, tag: MetaTag, index: number): void {
        const tagItem = container.createEl('div', { cls: 'meta-tag-item' });
        
        // Name input
        const nameInput = tagItem.createEl('input', { type: 'text', placeholder: 'Meta tag name' });
        nameInput.value = tag.name;
        nameInput.addEventListener('input', () => {
            tag.name = nameInput.value;
            this.saveConfig();
        });

        // Content input
        const contentInput = tagItem.createEl('input', { type: 'text', placeholder: 'Meta tag content' });
        contentInput.value = tag.content;
        contentInput.addEventListener('input', () => {
            tag.content = contentInput.value;
            this.saveConfig();
        });

        // Property input (for Open Graph tags)
        const propertyInput = tagItem.createEl('input', { type: 'text', placeholder: 'Property (optional)' });
        propertyInput.value = tag.property || '';
        propertyInput.addEventListener('input', () => {
            tag.property = propertyInput.value || undefined;
            this.saveConfig();
        });

        // Remove button
        const removeButton = tagItem.createEl('button', { text: '×', cls: 'meta-tag-remove' });
        removeButton.addEventListener('click', () => {
            if (this.config.seo.customMetaTags) {
                this.config.seo.customMetaTags.splice(index, 1);
                tagItem.remove();
                this.saveConfig();
            }
        });
    }

    private addTabStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            .web-settings-tabs {
                display: flex;
                border-bottom: 1px solid var(--background-modifier-border);
                margin-bottom: 20px;
            }
            
            .web-settings-tab {
                padding: 10px 20px;
                background: none;
                border: none;
                cursor: pointer;
                color: var(--text-muted);
                border-bottom: 2px solid transparent;
                transition: all 0.2s ease;
            }
            
            .web-settings-tab:hover {
                color: var(--text-normal);
                background: var(--background-modifier-hover);
            }
            
            .web-settings-tab.active {
                color: var(--interactive-accent);
                border-bottom-color: var(--interactive-accent);
            }
            
            .web-settings-tab-content {
                display: none;
            }
            
            .web-settings-tab-content.active {
                display: block;
            }
            
            .settings-section {
                margin-bottom: 30px;
            }
            
            .meta-tags-container {
                margin-bottom: 15px;
            }
            
            .meta-tag-item {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr auto;
                gap: 10px;
                margin-bottom: 10px;
                align-items: center;
            }
            
            .meta-tag-item input {
                padding: 5px 10px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 3px;
                background: var(--background-primary);
                color: var(--text-normal);
            }
            
            .meta-tag-remove {
                background: var(--background-modifier-error);
                color: var(--text-on-accent);
                border: none;
                border-radius: 3px;
                width: 25px;
                height: 25px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .meta-tag-remove:hover {
                background: var(--background-modifier-error-hover);
            }
        `;
        document.head.appendChild(style);
    }

    private async saveConfig(): Promise<void> {
        // Validate configuration
        const errors = validateWebConfig(this.config);
        if (errors.length > 0) {
            console.warn('Web config validation errors:', errors);
            // Don't prevent saving, just warn
        }

        try {
            await this.plugin.saveData({ webConfig: this.config });
        } catch (error) {
            new Notice('Failed to save settings: ' + error.message);
            console.error('Failed to save web config:', error);
        }
    }

    async loadConfig(): Promise<void> {
        try {
            const data = await this.plugin.loadData();
            if (data?.webConfig) {
                this.config = { ...DEFAULT_WEB_CONFIG, ...data.webConfig };
            } else if (data?.exportOptions) {
                // Migrate from legacy settings
                this.config = migrateFromLegacyConfig(data.exportOptions);
                await this.saveConfig(); // Save migrated config
            } else {
                this.config = JSON.parse(JSON.stringify(DEFAULT_WEB_CONFIG));
                // Set default site name from vault name
                if (app?.vault?.getName()) {
                    this.config.site.name = app.vault.getName();
                }
            }
        } catch (error) {
            console.error('Failed to load web config:', error);
            this.config = JSON.parse(JSON.stringify(DEFAULT_WEB_CONFIG));
        }
    }

    getConfig(): WebConfig {
        return this.config;
    }
}