import { ButtonComponent, Modal, Setting, TFile, Notice } from 'obsidian';
import { Utils } from 'src/plugin/utils/utils';
import HTMLExportPlugin from 'src/plugin/main';
import { Settings, SettingsPage } from './settings';
import { FilePickerTree } from 'src/plugin/features/file-picker';
import { Path } from 'src/plugin/utils/path';
import { FileDialogs } from 'src/plugin/utils/file-dialogs';
import { createFileInput, createToggle } from './settings-components';
import { Website } from 'src/plugin/website/website';
import { Index } from 'src/plugin/website';
import { i18n } from '../translations/language';
import { app } from 'electron';

export interface ExportInfo {
	canceled: boolean;
	pickedFiles: TFile[];
	exportPath: Path;
	validPath: boolean;
}

export class ExportModal extends Modal {
	private isClosed: boolean = true;
	private canceled: boolean = true;
	private filePickerModalEl: HTMLElement | undefined;
	private filePicker: FilePickerTree;
	private pickedFiles: TFile[] = [];
	private validPath: boolean = true;
	public exportInfo: ExportInfo;

	constructor() {
		super(app);
	}

	overridePickedFiles(files: TFile[]) {
		this.pickedFiles = files;
	}

	/**
	 * Opens the simplified export modal focused on essential options
	 * @returns ExportInfo with user selections
	 */
	async open(): Promise<ExportInfo> {
		this.isClosed = false;
		this.canceled = true;

		super.open();

		// Initialize file picker if not already created
		if (!this.filePickerModalEl) {
			await this.initializeFilePicker();
		}

		const { contentEl } = this;
		contentEl.empty();

		this.titleEl.setText("Export as Website");

		// Simple, clear description
		const description = contentEl.createEl('div', { 
			text: 'Create a web-ready website from your Obsidian notes with search, navigation, and interactive features.',
			cls: 'setting-item-description'
		});
		description.style.marginBottom = "1.5em";
		description.style.fontSize = "var(--font-ui-medium)";
		description.style.color = "var(--text-muted)";

		// Show update notice if available
		this.showUpdateNoticeIfAvailable(contentEl);

		// Export path selection with validation
		const { exportButton, exportDescription } = this.createExportPathSection(contentEl);

		// Essential options only
		this.createEssentialOptions(contentEl);

		// Link to advanced settings
		this.createAdvancedSettingsLink(contentEl);

		// Wait for modal to close
		await Utils.waitUntil(() => this.isClosed, 60 * 60 * 1000, 10);

		// Cleanup and return results
		this.pickedFiles = this.filePicker.getSelectedFiles();
		if (this.filePickerModalEl) {
			this.filePickerModalEl.remove();
		}
		
		this.exportInfo = { 
			canceled: this.canceled, 
			pickedFiles: this.pickedFiles, 
			exportPath: new Path(Settings.exportOptions.exportPath), 
			validPath: this.validPath 
		};

		return this.exportInfo;
	}

	/**
	 * Initialize the file picker component
	 */
	private async initializeFilePicker(): Promise<void> {
		this.filePickerModalEl = this.containerEl.createDiv({ cls: 'modal' });
		this.containerEl.insertBefore(this.filePickerModalEl, this.modalEl);
		
		// Style the file picker container
		Object.assign(this.filePickerModalEl.style, {
			position: 'relative',
			zIndex: "1",
			width: "25em",
			padding: "0",
			margin: "10px",
			maxHeight: "80%",
			boxShadow: "0 0 7px 1px inset #00000060"
		});

		const scrollArea = this.filePickerModalEl.createDiv({ cls: 'tree-scroll-area' });
		Object.assign(scrollArea.style, {
			height: "100%",
			width: "100%",
			overflowY: "auto",
			overflowX: "hidden",
			padding: "1em",
			boxShadow: "0 0 7px 1px inset #00000060"
		});

		// Create and configure file picker
		const paths = this.app.vault.getFiles().map(file => new Path(file.path));
		this.filePicker = new FilePickerTree(paths, true, true);
		this.filePicker.regexBlacklist.push(...Settings.filePickerBlacklist);
		this.filePicker.regexWhitelist.push(...Settings.filePickerWhitelist);
		this.filePicker.generateWithItemsClosed = true;
		this.filePicker.showFileExtentionTags = true;
		this.filePicker.hideFileExtentionTags = ["md"];
		this.filePicker.title = "Select Files to Export";
		this.filePicker.class = "file-picker";
		
		await this.filePicker.generate(scrollArea);

		// Restore previous selection
		if (Settings.exportOptions.filesToExport.length > 0) {
			this.filePicker.setSelectedFiles(Settings.exportOptions.filesToExport);
		}

		// Add helpful instructions
		const instructions = this.filePickerModalEl.createEl('div', {
			cls: 'setting-item-description',
			text: 'Select files and folders to include in your website. Use Ctrl/Cmd+click for multiple selections.'
		});
		Object.assign(instructions.style, {
			padding: "0 1em 1em 1em",
			fontSize: "var(--font-ui-smaller)",
			color: "var(--text-muted)"
		});

		// Save selection button
		new Setting(this.filePickerModalEl)
			.addButton((button) => {
				button.setButtonText("Save Selection").onClick(async () => {
					const selectedCount = this.filePicker.getSelectedFiles().length;
					Settings.exportOptions.filesToExport = this.filePicker.getSelectedFilesSavePaths();
					await SettingsPage.saveSettings();
					new Notice(`Saved selection: ${selectedCount} files`, 2000);
				});
			});
	}

	/**
	 * Show update notice if available
	 */
	private showUpdateNoticeIfAvailable(contentEl: HTMLElement): void {
		if (!HTMLExportPlugin.updateInfo.updateAvailable) return;

		const updateNotice = contentEl.createEl('div', { 
			text: `Update available: ${HTMLExportPlugin.updateInfo.currentVersion} → ${HTMLExportPlugin.updateInfo.latestVersion}`,
			cls: 'setting-item-description'
		});
		Object.assign(updateNotice.style, {
			backgroundColor: "var(--interactive-normal)",
			padding: "8px 12px",
			color: "var(--color-red)",
			borderRadius: "5px",
			marginBottom: "1em",
			fontWeight: "bold"
		});

		if (HTMLExportPlugin.updateInfo.updateNote) {
			const updateNotes = contentEl.createEl('div', { 
				text: HTMLExportPlugin.updateInfo.updateNote,
				cls: 'setting-item-description'
			});
			Object.assign(updateNotes.style, {
				backgroundColor: "var(--background-secondary-alt)",
				padding: "8px 12px",
				color: "var(--text-normal)",
				fontSize: "var(--font-ui-smaller)",
				borderRadius: "5px",
				marginBottom: "1em",
				whiteSpace: "pre-wrap"
			});
		}
	}

	/**
	 * Create export path selection section with validation
	 */
	private createExportPathSection(contentEl: HTMLElement): { exportButton: ButtonComponent, exportDescription: HTMLElement } {
		let exportButton: ButtonComponent | undefined;
		
		const validatePath = (path: Path) => {
			const validation = path.validate({
				allowEmpty: false,
				allowRelative: false,
				allowAbsolute: true,
				allowDirectories: true,
				allowTildeHomeDirectory: true,
				requireExists: false
			});

			if (validation.valid && path.exists && !path.isDirectory) {
				return { valid: false, isEmpty: false, error: "Export path must be a directory, not a file." };
			}

			return validation;
		};

		const exportDescription = contentEl.createEl('div', { 
			text: 'Loading site information...', 
			cls: 'setting-item-description' 
		});
		exportDescription.style.marginBottom = "1em";

		const onChanged = async (path: Path) => {
			const validation = validatePath(path);
			this.validPath = validation.valid;
			
			if (exportButton) {
				exportButton.setDisabled(!validation.valid);
				exportButton.buttonEl.style.opacity = validation.valid ? "1" : "0.5";
			}

			if (!validation.valid) {
				exportDescription.setText(`❌ ${validation.error}`);
				exportDescription.style.color = "var(--color-red)";
				return;
			}

			try {
				if (!path.exists) {
					exportDescription.setText(`📁 Directory will be created: ${path.path}`);
					exportDescription.style.color = "var(--color-blue)";
					return;
				}

				const website = new Website(path);
				const index = new Index();
				await index.load(website, website.exportOptions);

				if (!index.oldWebsiteData) {
					exportDescription.setText("✨ New website will be created");
					exportDescription.style.color = "var(--color-green)";
				} else {
					const lastExportDate = new Date(index.oldWebsiteData.modifiedTime).toLocaleDateString();
					const fileCount = index.oldWebsiteData.allFiles?.length || 0;
					exportDescription.setText(`🔄 Update existing website (${fileCount} files, last updated ${lastExportDate})`);
					exportDescription.style.color = "var(--text-muted)";
				}
			} catch (error) {
				exportDescription.setText(`⚠️ Could not read existing website data`);
				exportDescription.style.color = "var(--color-orange)";
			}
		};

		const exportPathInput = createFileInput(contentEl, 
			() => Settings.exportOptions.exportPath, 
			(value) => Settings.exportOptions.exportPath = value,
			{
				name: 'Export Destination',
				description: 'Choose where to save your website files',
				placeholder: 'Select folder for website export...',
				defaultPath: FileDialogs.idealDefaultPath(),
				pickFolder: true,
				validation: validatePath,
				onChanged: onChanged
			}
		);

		exportPathInput.fileInput.addButton((button) => {
			exportButton = button;
			button.setButtonText("Export Website")
				.setClass("mod-cta")
				.onClick(async () => {
					if (!this.validateAndExport()) return;
					this.canceled = false;
					this.close();
				});
		});

		// Initialize path validation
		onChanged(new Path(Settings.exportOptions.exportPath));

		return { exportButton: exportButton!, exportDescription };
	}

	/**
	 * Validate selections and show appropriate error messages
	 */
	private validateAndExport(): boolean {
		const selectedFiles = this.filePicker.getSelectedFiles();
		if (selectedFiles.length === 0) {
			new Notice("Please select at least one file to export.", 5000);
			return false;
		}

		const exportPath = new Path(Settings.exportOptions.exportPath);
		const validation = exportPath.validate({
			allowEmpty: false,
			allowRelative: false,
			allowAbsolute: true,
			allowDirectories: true,
			allowTildeHomeDirectory: true,
			requireExists: false
		});

		if (!validation.valid) {
			const errorMsg = validation.error || "Please check the export path and try again.";
			new Notice(`Invalid export path: ${errorMsg}`, 5000);
			return false;
		}

		return true;
	}

	/**
	 * Create essential options section
	 */
	private createEssentialOptions(contentEl: HTMLElement): void {
		createToggle(contentEl, 
			"Open after export", 
			() => Settings.openAfterExport, 
			(value) => Settings.openAfterExport = value
		);
	}

	/**
	 * Create link to advanced settings
	 */
	private createAdvancedSettingsLink(contentEl: HTMLElement): void {
		new Setting(contentEl)
			.setName("Need more options?")
			.setDesc("Access advanced settings, themes, and customization options in the plugin settings.")
			.addExtraButton((button) => button
				.setIcon("settings")
				.setTooltip('Open plugin settings')
				.onClick(() => {
					// @ts-ignore
					this.app.setting.open();
					// @ts-ignore
					this.app.setting.openTabById('webpage-html-export');
				}));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
		this.isClosed = true;
	}
}
