import { Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder, getIcon } from 'obsidian';
import { Path } from 'src/plugin/utils/path';
import pluginStylesBlacklist from 'src/assets/third-party-styles-blacklist.txt';
import { ExportLog } from 'src/plugin/render-api/render-api';
import { createDivider, createDropdown, createFeatureSetting, createFileInput, createSection, createText, createToggle, generateSettingsFromObject }  from './settings-components';
import { ExportPipelineOptions } from "src/plugin/website/pipeline-options.js";
import { FlowList } from 'src/plugin/features/flow-list';
import { i18n } from '../translations/language';
import { error } from 'console';
import { EmojiStyle } from 'src/shared/website-data';
import supportedStyleIds from "src/assets/plugin-style-ids.json";
import { SupportedPluginStyles } from '../asset-loaders/supported-plugin-styles';
import postcss from 'postcss';
import safeParser from 'postcss-safe-parser';

// #region Settings Definition

// Export presets removed - using single web-optimized mode

export enum LogLevel
{
	All = "all",
	Warning = "warning",
	Error = "error",
	Fatal = "fatal",
	None = "none",
}

export class Settings
{
	public static settingsVersion: string = "0.0.0";

	public static exportOptions: ExportPipelineOptions = new ExportPipelineOptions();

	public static logLevel: LogLevel = LogLevel.Warning;
	public static titleProperty: string = "title";
	public static rssDateProperty: string = "date";
	public static onlyExportModified: boolean = true;
	public static deleteOldFiles: boolean = true;
	// exportPreset removed - using single web-optimized mode
	public static openAfterExport: boolean = true;

	// Graph View Settings
	public static filePickerBlacklist: string[] = ["(^|\\/)node_modules\\/","(^|\\/)dist\\/","(^|\\/)dist-ssr\\/","(^|\\/)\\.vscode\\/"]; // ignore node_modules, dist, and .vscode
	public static filePickerWhitelist: string[] = ["\\.\\w+$"]; // only include files with extensions

	/**
	 * Apply web-optimized defaults for streamlined deployment
	 * Removes complex asset inlining options and uses web-friendly defaults
	 */
	public static async applyWebOptimizedDefaults()
	{
		// External assets for web deployment (CDN-ready structure)
		// Asset inlining options removed - always use external assets for web optimization
		Settings.exportOptions.inlineCSS = false;
		Settings.exportOptions.inlineFonts = false;
		Settings.exportOptions.inlineHTML = false;
		Settings.exportOptions.inlineJS = false;
		Settings.exportOptions.inlineMedia = false;
		Settings.exportOptions.inlineOther = false;

		// Web-friendly URLs and structure
		Settings.exportOptions.slugifyPaths = true;
		Settings.exportOptions.combineAsSingleFile = false;
		Settings.exportOptions.fixLinks = true;
		Settings.exportOptions.flattenExportPaths = false;

		// Include essential web assets (no longer configurable - always enabled for web)
		Settings.exportOptions.includeJS = true;
		Settings.exportOptions.includeCSS = true;
		Settings.exportOptions.addHeadTag = true;
		Settings.exportOptions.addBodyClasses = true;
		Settings.exportOptions.addMathjaxStyles = true;

		// Enable all interactive features by default for rich web experience
		Settings.exportOptions.graphViewOptions.setAvailable(true);
		Settings.exportOptions.fileNavigationOptions.setAvailable(true);
		Settings.exportOptions.searchOptions.setAvailable(true);
		Settings.exportOptions.rssOptions.setAvailable(true);
		Settings.exportOptions.themeToggleOptions.setAvailable(true);
		Settings.exportOptions.outlineOptions.setAvailable(true);
		Settings.exportOptions.backlinkOptions.setAvailable(true);
		Settings.exportOptions.tagOptions.setAvailable(true);
		Settings.exportOptions.aliasOptions.setAvailable(true);
		Settings.exportOptions.sidebarOptions.setAvailable(true);
		Settings.exportOptions.linkPreviewOptions.setAvailable(true);

		// Enable all features by default (not just available, but enabled)
		Settings.exportOptions.graphViewOptions.enabled = true;
		Settings.exportOptions.fileNavigationOptions.enabled = true;
		Settings.exportOptions.searchOptions.enabled = true;
		Settings.exportOptions.themeToggleOptions.enabled = true;
		Settings.exportOptions.outlineOptions.enabled = true;
		Settings.exportOptions.backlinkOptions.enabled = true;
		Settings.exportOptions.tagOptions.enabled = true;
		Settings.exportOptions.sidebarOptions.enabled = true;

		// Web optimization settings
		Settings.exportOptions.relativeHeaderLinks = false; // Use absolute links for better web compatibility
		Settings.exportOptions.offlineResources = false; // Allow external resources for web deployment

		// Set default site name if not already set
		if (!Settings.exportOptions.siteName || Settings.exportOptions.siteName === '') {
			Settings.exportOptions.siteName = app?.vault?.getName() ?? 'My Digital Garden';
		}

		// Mark deprecated settings as hidden from main interface
		// Plugin-specific CSS inclusion is now handled automatically
		// Complex asset processing options are removed from user control

		await SettingsPage.saveSettings();
	}

	static getAllFilesFromPaths(paths: string[]): string[]
	{
		const files: string[] = [];

		const allFilePaths = app.vault.getFiles().map(f => f.path);
		if (!paths || paths.length == 0) return allFilePaths;

		for (const path of paths)
		{
			const file = app.vault.getAbstractFileByPath(path);
			if (file instanceof TFile) files.push(file.path);
			else if (file instanceof TFolder)
			{
				const newFiles = allFilePaths.filter((f) => f.startsWith(file?.path ?? "*"));
				files.push(...newFiles);
			}
		};

		return files;
	}

	static getFilesToExport(): TFile[]
	{
		return this.getAllFilesFromPaths(Settings.exportOptions.filesToExport).map(p => app.vault.getFileByPath(p)).filter(f => f) as TFile[];
	}

	
}

// #endregion

export class SettingsPage extends PluginSettingTab
{

	display() 
	{
		const { containerEl: container } = this;

		const lang = i18n.settings;

		// #region Settings Header

		container.empty();
		container.classList.add('webpage-html-settings');

		const header = container.createEl('h2', { text: lang.title });
		header.style.display = 'block';
		header.style.marginBottom = '15px';

		// Migration notice for existing users
		const migrationNotice = container.createEl('div', { cls: 'setting-item-description' });
		migrationNotice.style.marginBottom = '20px';
		migrationNotice.style.padding = '15px';
		migrationNotice.style.backgroundColor = 'var(--background-secondary)';
		migrationNotice.style.borderRadius = '5px';
		migrationNotice.style.border = '1px solid var(--interactive-accent)';
		migrationNotice.innerHTML = `
			<strong>🚀 Simplified Web Export</strong><br>
			This plugin has been streamlined for web deployment. Complex export modes and technical options have been removed in favor of web-optimized defaults.
			<br><br>
			<strong>What's changed:</strong>
			<ul style="margin: 10px 0; padding-left: 20px;">
				<li>Single web-optimized export mode (no more Online/Local/Raw Documents)</li>
				<li>All interactive features enabled by default</li>
				<li>Simplified settings with essential options only</li>
				<li>Advanced options moved to separate sections</li>
			</ul>
		`;

		const supportContainer = container.createDiv();
		supportContainer.style.marginBottom = '15px';
		const supportLink = container.createEl('a');
		const buttonColor = "3ebba4";
		const buttonTextColor = "ffffff";
		// @ts-ignore
		supportLink.href = `https://www.buymeacoffee.com/nathangeorge`;
		supportLink.style.height = "40px"
		supportLink.innerHTML = `<img style="height:40px;" src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=nathangeorge&button_colour=${buttonColor}&font_colour=${buttonTextColor}&font_family=Poppins&outline_colour=${buttonTextColor}&coffee_colour=FFDD00">`;
		const supportHeader = container.createDiv({ text: lang.support, cls: "setting-item-description" });
		supportHeader.style.display = 'block';

		supportContainer.style.display = 'grid';
		supportContainer.style.gridTemplateColumns = "0.5fr 0.5fr";
		supportContainer.style.gridTemplateRows = "40px 20px";
		supportContainer.appendChild(supportLink); 

		// debug info button
		const debugInfoButton = container.createEl('button');
		const bugIcon = getIcon('bug');
		if (bugIcon) debugInfoButton.appendChild(bugIcon);
		debugInfoButton.style.height = '100%';
		debugInfoButton.style.aspectRatio = '1/1';
		debugInfoButton.style.justifySelf = 'end';
		const debugHeader = container.createDiv({ text: lang.debug, cls: "setting-item-description" });
		debugHeader.style.display = 'block';
		debugHeader.style.justifySelf = 'end';
		debugInfoButton.addEventListener('click', () => {
			navigator.clipboard.writeText(ExportLog.getDebugInfo());
			new Notice("Debug info copied to clipboard!");
		});
		supportContainer.appendChild(debugInfoButton);
		supportContainer.appendChild(supportHeader);
		supportContainer.appendChild(debugHeader);

		// #endregion

		// #region Web-Optimized Features (Simplified Interface)

		createDivider(container);
		
		let section = createSection(container, "Web Features", "All interactive features are enabled by default for optimal web experience.");
		
		// Show a simple summary of enabled features instead of individual toggles
		const enabledFeatures = [
			"🔍 Full-text search",
			"🗂️ File navigation",
			"📋 Document outline", 
			"🕸️ Interactive graph view",
			"🎨 Theme toggle",
			"🔗 Backlinks",
			"🏷️ Tags",
			"📄 Sidebars"
		];

		const featuresList = section.createEl('div', { cls: 'setting-item-description' });
		featuresList.style.marginBottom = '1em';
		featuresList.style.padding = '10px';
		featuresList.style.backgroundColor = 'var(--background-secondary)';
		featuresList.style.borderRadius = '5px';
		featuresList.innerHTML = `<strong>Enabled Features:</strong><br>${enabledFeatures.join('<br>')}`;

		// Note about advanced configuration
		const advancedNote = section.createEl('div', { cls: 'setting-item-description' });
		advancedNote.style.marginTop = '1em';
		advancedNote.style.fontStyle = 'italic';
		advancedNote.innerHTML = `<strong>Need more control?</strong> Individual feature toggles and advanced options are available in the sections below.`;

		// #endregion

		// #region Essential Site Settings (Simplified)

		createDivider(container);
		section = createSection(container, "Site Information", "Essential information for your published website.");
		
		createText(section, lang.siteName.title, 
			() => Settings.exportOptions.siteName,
			(value) => Settings.exportOptions.siteName = value,
			lang.siteName.description);

		createFileInput(section,
			() => Settings.exportOptions.faviconPath,
			(value) => Settings.exportOptions.faviconPath = value,
			{
				name: lang.favicon.title,
				description: lang.favicon.description,
				placeholder: i18n.pathInputPlaceholder,
				makeRelativeToVault: true,
				pickFolder: false,
				validation: (path) => path.validate(
					{
						allowEmpty: true,
						allowAbsolute: true,
						allowRelative: true,
						allowFiles: true,
						requireExists: true,
						requireExtentions: ["png", "ico", "jpg", "jpeg", "svg"]
					}),
				browseButton: true,
			});

		// #endregion

		// #region Essential Export Settings (Simplified)

		createDivider(container);
		section = createSection(container, "Web Optimization", "Pre-configured settings for optimal web deployment.");

		createToggle(section, lang.slugifyPaths.title,
			() => Settings.exportOptions.slugifyPaths,
			(value) => Settings.exportOptions.slugifyPaths = value,
			lang.slugifyPaths.description);

		// #endregion

		// #region Advanced Feature Configuration (Collapsed by default)

		createDivider(container);
		const advancedSection = createSection(container, "Advanced Feature Configuration", "Individual feature toggles for fine-tuning. Most users can skip this section.");
		
		// Make this section collapsed by default
		const advancedDetails = advancedSection as HTMLDetailsElement;
		advancedDetails.open = false;

		createFeatureSetting(advancedSection, lang.search.title, Settings.exportOptions.searchOptions, lang.search.description);
		createFeatureSetting(advancedSection, lang.fileNavigation.title, Settings.exportOptions.fileNavigationOptions, lang.fileNavigation.description);
		createFeatureSetting(advancedSection, lang.outline.title, Settings.exportOptions.outlineOptions, lang.outline.description);
		createFeatureSetting(advancedSection, lang.graphView.title, Settings.exportOptions.graphViewOptions, lang.graphView.description);
		createFeatureSetting(advancedSection, lang.themeToggle.title, Settings.exportOptions.themeToggleOptions, lang.themeToggle.description);
		createFeatureSetting(advancedSection, lang.backlinks.title, Settings.exportOptions.backlinkOptions, lang.backlinks.description);
		createFeatureSetting(advancedSection, lang.tags.title, Settings.exportOptions.tagOptions, lang.tags.description);
		createFeatureSetting(advancedSection, lang.sidebars.title, Settings.exportOptions.sidebarOptions, lang.sidebars.description);

		// #endregion

		// #region Advanced Technical Settings (Collapsed by default)

		createDivider(container);
		const technicalSection = createSection(container, "Advanced Technical Settings", "Technical options for advanced users. Default values are optimized for web deployment.");
		
		// Make this section collapsed by default
		const technicalDetails = technicalSection as HTMLDetailsElement;
		technicalDetails.open = false;

		// Theme selection (moved to advanced)
		createDropdown(technicalSection, lang.themeName.title,
			// @ts-ignore
			() => Settings.exportOptions.themeName || app.vault?.config?.cssTheme || "Default",
			(value) => Settings.exportOptions.themeName = value,
			this.getInstalledThemesRecord(),
			lang.themeName.description);

		createToggle(technicalSection, lang.relativeHeaderLinks.title, 
			() => Settings.exportOptions.relativeHeaderLinks, 
			(value) => Settings.exportOptions.relativeHeaderLinks = value, 
			lang.relativeHeaderLinks.description);

		createToggle(technicalSection, lang.makeOfflineCompatible.title,
			() => Settings.exportOptions.offlineResources,
			(value) => Settings.exportOptions.offlineResources = value,
			lang.makeOfflineCompatible.description);

		createDropdown(technicalSection, lang.logLevel.title,
			() => Settings.logLevel,
			(value) => Settings.logLevel = value as LogLevel,
			LogLevel,
			lang.logLevel.description);

		createText(technicalSection, lang.titleProperty.title,
			() => Settings.titleProperty,
			(value) => Settings.titleProperty = value,
			lang.titleProperty.description);

		// #endregion

		// #region Legacy Style Settings (Collapsed and marked as deprecated)

		createDivider(container);
		const legacySection = createSection(container, "Legacy Style Settings (Deprecated)", "These settings are deprecated and will be removed in future versions. They are hidden by default.");
		
		// Make this section collapsed by default
		const legacyDetails = legacySection as HTMLDetailsElement;
		legacyDetails.open = false;

		// Add deprecation warning
		const deprecationWarning = legacySection.createEl('div', { cls: 'setting-item-description' });
		deprecationWarning.style.marginBottom = '15px';
		deprecationWarning.style.padding = '10px';
		deprecationWarning.style.backgroundColor = 'var(--background-modifier-error)';
		deprecationWarning.style.borderRadius = '5px';
		deprecationWarning.style.color = 'var(--text-on-accent)';
		deprecationWarning.innerHTML = `
			<strong>⚠️ Deprecated Settings</strong><br>
			These settings are no longer recommended and may be removed in future versions. 
			The plugin now uses web-optimized defaults for better performance and compatibility.
		`;

		createDropdown(legacySection, lang.iconEmojiStyle.title,
			() => Settings.exportOptions.iconEmojiStyle,
			(value) => Settings.exportOptions.iconEmojiStyle = value as EmojiStyle,
			EmojiStyle, 
			lang.iconEmojiStyle.description + " (Deprecated)");

		// Simplified style settings (removed complex plugin CSS management)
		const styleNote = legacySection.createEl('div', { cls: 'setting-item-description' });
		styleNote.style.marginTop = '15px';
		styleNote.style.fontStyle = 'italic';
		styleNote.innerHTML = `
			<strong>Note:</strong> Complex plugin CSS and style ID management has been removed. 
			The plugin now automatically includes essential styles for web deployment.
		`;

		// #endregion
	}

	// #region Class Functions and Variables
	static plugin: Plugin;
	static loaded = false;

	private blacklistedPluginIDs: string[] = [];
	public async getBlacklistedPluginIDs(): Promise<string[]> 
	{
		if (this.blacklistedPluginIDs.length > 0) return this.blacklistedPluginIDs;
		this.blacklistedPluginIDs = pluginStylesBlacklist.replaceAll("\r", "").split("\n");

		return this.blacklistedPluginIDs;
	}

	constructor(plugin: Plugin) {
		super(app, plugin);
		SettingsPage.plugin = plugin;
	}

	getPluginIDs(): string[]
	{
		/*@ts-ignore*/
		const pluginsArray: string[] = Array.from(app.plugins.enabledPlugins.values()) as string[];
		for (let i = 0; i < pluginsArray.length; i++)
		{
			/*@ts-ignore*/
			if (app.plugins.manifests[pluginsArray[i]] == undefined)
			{
				pluginsArray.splice(i, 1);
				i--;
			}
		}

		return pluginsArray;
	}

	public static nameStylesheet(stylesheet: string): string {
		const words: string[] = [];
		const commentWords: string[] = [];
		const commonWords = new Set([
			'svelte', 'wrapper', 'container', 'item', 'button', 'input', 'text', 'style',
			'color', 'background', 'margin', 'padding', 'width', 'height', 'display', 'position', 'font', "cm", "pcr", "app", "workspace"
		]);

		const root = safeParser(stylesheet);

		// Extract words from top comments
		root.nodes.forEach(node => {
			if (node.type === 'comment') {
				const commentText = node.text.toLowerCase();
				const extractedWords = commentText.match(/\b\w+\b/g) || [];
				commentWords.push(...extractedWords);
			} else {
				// Stop processing after encountering the first non-comment node
				return false;
			}
		});

		// Extract words from selectors
		root.walkRules((rule) => {
			const selectors = rule.selector.match(/[.#][\w-]+/g) || [];
			selectors.forEach(selector => {
				const parts = selector.slice(1).split('-');
				words.push(...parts);
			});
		});

		// Filter and count occurrences
		const wordCounts = words
			.filter(word => word.length > 1 && !commonWords.has(word.toLowerCase()))
			.reduce((acc, word) => {
				acc[word.toLowerCase()] = (acc[word.toLowerCase()] || 0) + 1;
				return acc;
			}, {} as Record<string, number>);

		// Add comment words that appear in styles
		commentWords.forEach(word => {
			if (wordCounts.hasOwnProperty(word)) {
				wordCounts[word] += 1;
			}
		});

		// Sort words by frequency
		const sortedWords = Object.entries(wordCounts)
			.sort((a, b) => b[1] - a[1]);

		if (sortedWords.length === 0) {
			return "generic-stylesheet";
		}

		if (sortedWords.length > 1 && sortedWords[0][1] === sortedWords[1][1]) {
			return `${sortedWords[0][0]}-${sortedWords[1][0]}-stylesheet`;
		} else {
			return `${sortedWords[0][0]}-stylesheet`;
		}
	}

	public static nameStyles() {
		// name all stylesheets and add the name as their id
		const stylesheets = document.styleSheets;
		for (let i = 1; i < stylesheets.length; i++) {
			// @ts-ignore
			const styleID = stylesheets[i].ownerNode?.id;

			if (!styleID || styleID == "")
			{
				// first check if it has any non-statandard attributes that can be used to uniquely identify it
                // @ts-ignore
                const attributes = stylesheets[i].ownerNode?.attributes;
                if (attributes) {
                    // First try to find most meaningful data attribute
                    const priorityPrefixes = ['source-plugin', 'type', 'name', 'source'];
                    let foundPriorityAttr = false;
                    
                    for (const prefix of priorityPrefixes) {
                        const attr = Array.from(attributes).find((a: Attr) => a.name === `data-${prefix}`);
                        if (attr) {
                            // @ts-ignore
                            stylesheets[i].ownerNode.id = `${prefix}-${attr.value}-stylesheet`;
                            foundPriorityAttr = true;
                            break;
                        }
                    }

                    if (!foundPriorityAttr) {
                        // Collect all data attributes
                        const dataAttrs = Array.from(attributes)
                            .filter((attr: Attr) => attr.name.startsWith('data-'))
                            .map((attr: Attr) => ({
                                name: attr.name.substring(5),
                                value: attr.value
                            }));
                        
                        if (dataAttrs.length > 0) {
                            // Combine all data attributes into ID
                            const id = dataAttrs
                                .map(attr => `${attr.name}${attr.value ? `-${attr.value}` : ''}`)
                                .join('-');
                            // @ts-ignore
                            stylesheets[i].ownerNode.id = `${id}-stylesheet`;
                            continue;
                        }
                    } else {
                        continue;
                    }
                }

                // Check for other unique attributes if no data- attributes found
                let hasUniqueAttr = false;
                if (attributes) {
                    for (const attr of attributes) {
                        if (!["type", "id"].contains(attr.name) && !attr.name.startsWith("data-")) {
                            // check if the attribute is unique
                            const elements = document.querySelectorAll(`[${attr.name}]`);
                            if (elements.length == 1) {
                                // @ts-ignore
                                stylesheets[i].ownerNode.id = `${attr.name}-stylesheet`;
                                hasUniqueAttr = true;
                                break;
                            }
                        }
                    }
                }

                if (hasUniqueAttr) continue;

				if (!stylesheets[i].ownerNode?.textContent?.contains("svelte-")) 
					continue;

				// @ts-ignore
				stylesheets[i].ownerNode.id = this.nameStylesheet(stylesheets[i].ownerNode.textContent);
			}
		}
	}

	getStyleTagIds(): string[]
	{
		SettingsPage.nameStyles();
		let ids: string[] = [];
		document.querySelectorAll('style').forEach((style) => {
			if (style.id) ids.push(style.id);
		});
		return ids;
	}

	getInstalledThemesRecord(): Record<string, string>
	{
		// @ts-ignore
		const themes = Object.values(app.customCss.themes) as { name: string, author: string }[];

		const themeRecord: Record<string, string> = 
		{
			// @ts-ignore
			"Current": "obsidian-current-theme",
			"Default": "Default",
		};

		for (const theme of themes)
		{
			themeRecord[theme.name] = theme.name;
		}

		return themeRecord;
	}
	static deepAssign(truth: any, source: any)
	{
		if (!source) return;
		let objects = Object.values(truth);
		let keys = Object.keys(truth);
		for (let i = 0; i < objects.length; i++)
		{
			let key = keys[i];
			let type = typeof objects[i];
			if (type == "object" && source[key] != undefined)
			{
				if (Array.isArray(objects[i]))
				{
					truth[key] = source[key];
				}
				else
				{
					SettingsPage.deepAssign(objects[i], source[key]);
				}
			}
			else if (source[key] != undefined)
			{
				truth[key] = source[key];
			}
		}

		return truth;
	}

	static deepCopy(truth: any): any
	{
		return JSON.parse(JSON.stringify(truth));
	}

	static deepRemoveStartingWith(truth: any, prefix: string): any
	{
		const keys = Object.keys(truth);
		for (let i = 0; i < keys.length; i++)
		{
			if (keys[i].startsWith(prefix))
			{
				delete truth[keys[i]];
			}

			let type = typeof truth[keys[i]];
			if (type == "object")
			{
				SettingsPage.deepRemoveStartingWith(truth[keys[i]], prefix);
			}
		}
		return truth;
	}

	static async loadSettings() 
	{
		const loadedSettings = await SettingsPage.plugin.loadData();
		// do a deep object assign so any non exisant values anywhere in the default settings are preserved
		SettingsPage.deepAssign(Settings, loadedSettings);
		// Reconstruct feature option instances to preserve constructor-set properties
		Settings.exportOptions.reconstructFeatureOptions();
		
		// Apply web-optimized defaults for new installations or when upgrading
		const isNewInstallation = !loadedSettings || Object.keys(loadedSettings).length === 0;
		const needsWebOptimization = isNewInstallation || !loadedSettings.webOptimizedApplied;
		
		if (needsWebOptimization) {
			await Settings.applyWebOptimizedDefaults();
			// Mark that web optimization has been applied
			(Settings as any).webOptimizedApplied = true;
		}
		
		SettingsPage.saveSettings();
		SettingsPage.loaded = true;
	}

	static async saveSettings() 
	{
		let copy = SettingsPage.deepCopy({...Settings});
		copy = SettingsPage.deepRemoveStartingWith(copy, "info_");
		await SettingsPage.plugin.saveData(copy);
	}

	static renameFile(file: TFile, oldPath: string)
	{
		const oldPathParsed = new Path(oldPath).path;
		let fileList = Settings.exportOptions.filesToExport;
		const index = fileList.indexOf(oldPathParsed);
		if (index >= 0)
		{
			fileList[index] = file.path;
		}

		SettingsPage.saveSettings();
	}

	// #endregion
}
