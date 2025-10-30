import { Notice, TFile } from "obsidian";
import { Path } from "src/plugin/utils/path";
import { Utils } from "src/plugin/utils/utils";
import { Website } from "src/plugin/website/website";
import { ExportLog, MarkdownRendererAPI } from "src/plugin/render-api/render-api";
import { Webpage } from "../website/webpage";

/**
 * Simplified export manager focused on web deployment
 * Replaces the complex HTMLExporter with opinionated defaults
 */
export class WebExportManager {
    
    /**
     * Export files using web-optimized settings
     * @param files Files to export
     * @param destination Export destination path
     * @param saveFiles Whether to save files to disk
     * @param deleteOld Whether to delete old files before export
     * @returns Promise<Website | undefined>
     */
    public static async exportFiles(
        files: TFile[], 
        destination: Path, 
        saveFiles: boolean = true, 
        deleteOld: boolean = true
    ): Promise<Website | undefined> {
        
        // Validate inputs
        const validationResult = await this.validateExportInputs(files, destination);
        if (!validationResult.isValid) {
            new Notice(`❌ Export validation failed: ${validationResult.error}`, 5000);
            ExportLog.error(validationResult.error, "Export Validation Failed", true);
            return undefined;
        }

        MarkdownRendererAPI.beginBatch();
        let website: Website | undefined = undefined;
        
        try {
            ExportLog.log("Starting web-optimized export...");
            
            // Create and build website with web-optimized defaults
            website = await (await new Website(destination).load(files)).build();

            if (!website) {
                new Notice("❌ Export Cancelled", 5000);
                return undefined;
            }

            // Clean up old files if requested
            if (deleteOld) {
                await this.cleanupOldFiles(website, destination);
            }
            
            // Save files to disk
            if (saveFiles) {
                await this.saveWebsiteFiles(website);
            }

            ExportLog.log("Web export completed successfully");
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            new Notice(`❌ Export Failed: ${errorMessage}`, 5000);
            ExportLog.error(error, "Export Failed", true);
            return undefined;
        } finally {
            MarkdownRendererAPI.endBatch();
        }

        return website;
    }

    /**
     * Export entire vault with web-optimized settings
     * @param destination Export destination path
     * @param saveFiles Whether to save files to disk
     * @param deleteOld Whether to delete old files before export
     * @returns Promise<Website | undefined>
     */
    public static async exportVault(
        destination: Path, 
        saveFiles: boolean = true, 
        deleteOld: boolean = true
    ): Promise<Website | undefined> {
        const files = app.vault.getFiles();
        return await this.exportFiles(files, destination, saveFiles, deleteOld);
    }

    /**
     * Validate export inputs before processing
     * @param files Files to export
     * @param destination Export destination
     * @returns Validation result
     */
    private static async validateExportInputs(
        files: TFile[], 
        destination: Path
    ): Promise<{ isValid: boolean; error?: string }> {
        
        // Check if files array is valid
        if (!files || files.length === 0) {
            return { isValid: false, error: "No files selected for export" };
        }

        // Validate destination path
        if (!destination.isAbsolute) {
            return { isValid: false, error: "Export path must be absolute" };
        }

        if (!destination.isDirectory) {
            return { isValid: false, error: "Export path must be a directory" };
        }

        // Check if destination exists or can be created
        if (!destination.exists) {
            try {
                await destination.createDirectory();
            } catch (error) {
                return { 
                    isValid: false, 
                    error: `Cannot create export directory: ${error instanceof Error ? error.message : String(error)}` 
                };
            }
        }

        // Validate vault structure
        const vaultValidation = await this.validateVaultStructure();
        if (!vaultValidation.isValid) {
            return vaultValidation;
        }

        return { isValid: true };
    }

    /**
     * Validate vault structure for export compatibility
     * @returns Validation result
     */
    private static async validateVaultStructure(): Promise<{ isValid: boolean; error?: string }> {
        
        // Check if .obsidian directory exists
        const obsidianConfigPath = new Path(".obsidian");
        if (!obsidianConfigPath.exists) {
            return { 
                isValid: false, 
                error: "Invalid vault: .obsidian directory not found. Please ensure you're exporting from a valid Obsidian vault." 
            };
        }

        // Check for basic vault configuration
        const appConfigPath = obsidianConfigPath.joinString("app.json");
        if (!appConfigPath.exists) {
            ExportLog.log("Warning: app.json not found in .obsidian directory. Some features may not work correctly.");
        }

        return { isValid: true };
    }

    /**
     * Clean up old files from previous exports
     * @param website Website instance with file tracking
     * @param destination Export destination
     */
    private static async cleanupOldFiles(website: Website, destination: Path): Promise<void> {
        if (!website.index.deletedFiles || website.index.deletedFiles.length === 0) {
            return;
        }

        ExportLog.addToProgressCap(website.index.deletedFiles.length / 2);
        
        for (const deletedFile of website.index.deletedFiles) {
            const filePath = new Path(deletedFile, destination.path);
            
            // Skip font files to prevent deletion of shared resources
            if (this.isFontFile(filePath)) {
                ExportLog.progress(0.5, "Deleting Old Files", `Skipping: ${filePath.path}`, "var(--color-yellow)");
                continue;
            }

            try {
                await filePath.delete();
                ExportLog.progress(0.5, "Deleting Old Files", `Deleting: ${filePath.path}`, "var(--color-red)");
            } catch (error) {
                ExportLog.log(`Warning: Could not delete file ${filePath.path}: ${error}`);
            }
        }

        // Remove empty directories
        try {
            await Path.removeEmptyDirectories(destination.path);
        } catch (error) {
            ExportLog.log(`Warning: Could not remove empty directories: ${error}`);
        }
    }

    /**
     * Check if a file is a font file that should be preserved
     * @param filePath Path to check
     * @returns True if file is a font file
     */
    private static isFontFile(filePath: Path): boolean {
        const fontExtensions = ["woff", "woff2", "ttf", "otf"];
        return fontExtensions.includes(filePath.extension.toLowerCase());
    }

    /**
     * Save website files to disk with web-optimized structure
     * @param website Website instance to save
     */
    private static async saveWebsiteFiles(website: Website): Promise<void> {
        try {
            // Download and save asset files
            const assetFiles = [
                ...website.index.newFiles.filter((f) => !(f instanceof Webpage)),
                ...website.index.updatedFiles.filter((f) => !(f instanceof Webpage))
            ];

            if (assetFiles.length > 0) {
                await Utils.downloadAttachments(assetFiles);
            }

            // Save website data and index files for web functionality
            const websiteDataFiles = [
                website.index.websiteDataAttachment(),
                website.index.indexDataAttachment()
            ];

            await Utils.downloadAttachments(websiteDataFiles);

            ExportLog.log(`Saved ${assetFiles.length} asset files and website data`);
            
        } catch (error) {
            throw new Error(`Failed to save website files: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Export with web-optimized defaults and user-friendly interface
     * @param files Optional files to export (defaults to all vault files)
     * @param destination Optional destination path
     * @returns Promise<Website | undefined>
     */
    public static async exportForWeb(
        files?: TFile[], 
        destination?: Path
    ): Promise<Website | undefined> {
        
        // Use all vault files if none specified
        const filesToExport = files || app.vault.getFiles();
        
        // Use default export path if none specified
        const exportPath = destination || new Path("/output");

        const website = await this.exportFiles(filesToExport, exportPath, true, true);

        if (website) {
            new Notice(`✅ Web export completed successfully!\n\nFiles saved to: ${exportPath.path}`, 5000);
            ExportLog.log(`Web export completed: ${filesToExport.length} files exported to ${exportPath.path}`);
        }

        return website;
    }
}