// imports from obsidian API
import { Notice, Plugin, TFile, TFolder, requestUrl,moment, MarkdownPreviewRenderer, MarkdownPreviewView, MarkdownRenderer, Component} from 'obsidian';

// modules that are part of the plugin
import { AssetHandler } from 'src/plugin/asset-loaders/asset-handler';
import { Settings, SettingsPage } from 'src/plugin/settings/settings';
import { WebExportManager } from 'src/plugin/web-export/web-export-manager';
import { Path } from 'src/plugin/utils/path';
import { Utils } from 'src/plugin/utils/utils';
import { ExportModal } from 'src/plugin/settings/export-modal';
import { _MarkdownRendererInternal, ExportLog, MarkdownRendererAPI } from 'src/plugin/render-api/render-api';
import { DataviewRenderer } from './render-api/dataview-renderer';
import { Website } from './website/website';
import { i18n } from './translations/language';



export default class HTMLExportPlugin extends Plugin {
	static updateInfo: {
		updateAvailable: boolean;
		latestVersion: string;
		currentVersion: string;
		updateNote: string;
	} = {
		updateAvailable: false,
		latestVersion: "0",
		currentVersion: "0",
		updateNote: "",
	};
	static pluginVersion: string = "0.0.0";
	public api = MarkdownRendererAPI;
	public internalAPI = _MarkdownRendererInternal;
	public settings = Settings;
	public assetHandler = AssetHandler;
	public Path = Path;
	public dv = DataviewRenderer;
	public Website = Website;

	public async exportDocker() {
		await WebExportManager.exportVault(new Path("/output"), true, true);
	}

	public async exportVault(path: string) {
		await WebExportManager.exportVault(new Path(path), true, false);
	}

	/**
	 * Open the simplified web export modal
	 */
	private async openWebExportModal() {
		const modal = new ExportModal();
		const result = await modal.open();
		
		if (!result.canceled && result.validPath) {
			const website = await WebExportManager.exportFiles(
				result.pickedFiles, 
				result.exportPath, 
				true, 
				Settings.deleteOldFiles
			);
			
			if (website && Settings.openAfterExport) {
				Utils.openPath(result.exportPath);
			}
		}
	}

	/**
	 * Export entire vault using web-optimized settings
	 */
	private async exportEntireVault() {
		const exportPath = new Path(Settings.exportOptions.exportPath);
		
		if (!exportPath.exists || !exportPath.isAbsolute || !exportPath.isDirectory) {
			new Notice("Please set a valid export path in settings first.", 5000);
			this.openWebExportModal();
			return;
		}

		const website = await WebExportManager.exportVault(exportPath, true, Settings.deleteOldFiles);
		
		if (website && Settings.openAfterExport) {
			Utils.openPath(exportPath);
		}
	}

	/**
	 * Export specific files using web-optimized settings
	 */
	private async exportSpecificFiles(files: TFile[]) {
		const exportPath = new Path(Settings.exportOptions.exportPath);
		
		if (!exportPath.exists || !exportPath.isAbsolute || !exportPath.isDirectory) {
			new Notice("Please set a valid export path in settings first.", 5000);
			this.openWebExportModal();
			return;
		}

		const website = await WebExportManager.exportFiles(files, exportPath, true, Settings.deleteOldFiles);
		
		if (website && Settings.openAfterExport) {
			Utils.openPath(exportPath);
		}
	}

	async onload() {
		console.log("Loading webpage-html-export plugin");
		this.checkForUpdates();
		HTMLExportPlugin.pluginVersion = this.manifest.version;

		// @ts-ignore
		window.WebpageHTMLExport = this;

		this.addSettingTab(new SettingsPage(this));
		await SettingsPage.loadSettings();
		await AssetHandler.initialize();

		this.addRibbonIcon("globe", "Export as Website", () => {
			this.openWebExportModal();
		});

		// register callback for file rename so we can update the saved files to export
		this.registerEvent(
			this.app.vault.on("rename", SettingsPage.renameFile)
		);

		this.addCommand({
			id: "export-website",
			name: "Export as Website",
			callback: () => {
				this.openWebExportModal();
			},
		});

		this.addCommand({
			id: "export-vault-website",
			name: "Export Entire Vault as Website",
			callback: () => {
				this.exportEntireVault();
			},
		});

		this.addCommand({
			id: "export-current-website",
			name: "Export Current File as Website",
			callback: () => {
				const file = this.app.workspace.getActiveFile();

				if (!file) {
					new Notice("No file is currently open!", 5000);
					return;
				}

				this.exportSpecificFiles([file]);
			},
		});

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				menu.addItem((item) => {
					item.setTitle("Export as Website")
						.setIcon("globe")
						.setSection("export")
						.onClick(() => {
							if (file instanceof TFile) {
								this.exportSpecificFiles([file]);
							} else if (file instanceof TFolder) {
								const filesInFolder = this.app.vault
									.getFiles()
									.filter((f) =>
										new Path(
											f.path
										).directory.path.startsWith(file.path)
									);
								this.exportSpecificFiles(filesInFolder);
							} else {
								ExportLog.error(
									"File is not a TFile or TFolder! Invalid type: " +
										typeof file +
										""
								);
								new Notice(
									"File is not a File or Folder! Invalid type: " +
										typeof file +
										"",
									5000
								);
							}
						});
				});
			})
		);
	}

	async checkForUpdates(): Promise<{
		updateAvailable: boolean;
		latestVersion: string;
		currentVersion: string;
		updateNote: string;
	}> {
		const currentVersion = this.manifest.version;

		try {
			let url =
				"https://raw.githubusercontent.com/KosmosisDire/obsidian-webpage-export/master/manifest.json?cache=" +
				Date.now() +
				"";
			if (this.manifest.version.endsWith("b"))
				url =
					"https://raw.githubusercontent.com/KosmosisDire/obsidian-webpage-export/master/manifest-beta.json?cache=" +
					Date.now() +
					"";
			const manifestResp = await requestUrl(url);
			if (manifestResp.status != 200)
				throw new Error("Could not fetch manifest");
			const manifest = manifestResp.json;
			const latestVersion = manifest.version ?? currentVersion;
			const updateAvailable = currentVersion < latestVersion;
			const updateNote = manifest.updateNote ?? "";

			HTMLExportPlugin.updateInfo = {
				updateAvailable: updateAvailable,
				latestVersion: latestVersion,
				currentVersion: currentVersion,
				updateNote: updateNote,
			};

			if (updateAvailable)
				ExportLog.log(
					`${i18n.updateAvailable}: ${currentVersion} ⟶ ${latestVersion}`
				);

			return HTMLExportPlugin.updateInfo;
		} catch {
			ExportLog.log("Could not check for update");
			HTMLExportPlugin.updateInfo = {
				updateAvailable: false,
				latestVersion: currentVersion,
				currentVersion: currentVersion,
				updateNote: "",
			};
			return HTMLExportPlugin.updateInfo;
		}
	}

	onunload() {
		ExportLog.log("unloading webpage-html-export plugin");
	}
}
