/**
 * Comprehensive vault validation for Docker exports
 * Validates .obsidian directory structure and common configuration issues
 */

import { existsSync, statSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: string[];
}

export interface ValidationError {
    code: string;
    message: string;
    path?: string;
    severity: 'error' | 'warning';
}

export interface ValidationWarning {
    code: string;
    message: string;
    path?: string;
    suggestion?: string;
}

export class VaultValidator {
    private vaultPath: string;
    private obsidianPath: string;
    
    constructor(vaultPath: string) {
        this.vaultPath = resolve(vaultPath);
        this.obsidianPath = join(this.vaultPath, '.obsidian');
    }
    
    /**
     * Perform comprehensive vault validation
     */
    async validateVault(): Promise<ValidationResult> {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];
        const suggestions: string[] = [];
        
        // Basic vault structure validation
        this.validateBasicStructure(errors, warnings);
        
        // Obsidian configuration validation
        this.validateObsidianConfig(errors, warnings, suggestions);
        
        // Plugin configuration validation
        this.validatePluginConfig(errors, warnings, suggestions);
        
        // Content validation
        await this.validateContent(errors, warnings, suggestions);
        
        // Performance and optimization checks
        this.validatePerformance(warnings, suggestions);
        
        const isValid = errors.filter(e => e.severity === 'error').length === 0;
        
        return {
            isValid,
            errors,
            warnings,
            suggestions
        };
    }
    
    /**
     * Validate basic vault directory structure
     */
    private validateBasicStructure(errors: ValidationError[], warnings: ValidationWarning[]): void {
        // Check if vault directory exists
        if (!existsSync(this.vaultPath)) {
            errors.push({
                code: 'VAULT_NOT_FOUND',
                message: `Vault directory not found: ${this.vaultPath}`,
                path: this.vaultPath,
                severity: 'error'
            });
            return;
        }
        
        // Check if it's a directory
        if (!statSync(this.vaultPath).isDirectory()) {
            errors.push({
                code: 'VAULT_NOT_DIRECTORY',
                message: `Vault path is not a directory: ${this.vaultPath}`,
                path: this.vaultPath,
                severity: 'error'
            });
            return;
        }
        
        // Check for .obsidian directory
        if (!existsSync(this.obsidianPath)) {
            errors.push({
                code: 'OBSIDIAN_CONFIG_MISSING',
                message: 'Missing .obsidian configuration directory. This does not appear to be a valid Obsidian vault.',
                path: this.obsidianPath,
                severity: 'error'
            });
            return;
        }
        
        // Check if .obsidian is a directory
        if (!statSync(this.obsidianPath).isDirectory()) {
            errors.push({
                code: 'OBSIDIAN_CONFIG_NOT_DIRECTORY',
                message: '.obsidian exists but is not a directory',
                path: this.obsidianPath,
                severity: 'error'
            });
        }
    }
    
    /**
     * Validate Obsidian configuration files
     */
    private validateObsidianConfig(errors: ValidationError[], warnings: ValidationWarning[], suggestions: string[]): void {
        if (!existsSync(this.obsidianPath)) {
            return; // Already handled in basic structure validation
        }
        
        // Check for app.json (main Obsidian configuration)
        const appJsonPath = join(this.obsidianPath, 'app.json');
        if (!existsSync(appJsonPath)) {
            warnings.push({
                code: 'APP_JSON_MISSING',
                message: 'app.json not found. Obsidian may not have been properly initialized.',
                path: appJsonPath,
                suggestion: 'Open the vault in Obsidian to generate the configuration file.'
            });
        } else {
            this.validateJsonFile(appJsonPath, 'app.json', errors, warnings);
        }
        
        // Check for workspace.json (current workspace state)
        const workspaceJsonPath = join(this.obsidianPath, 'workspace.json');
        if (!existsSync(workspaceJsonPath)) {
            warnings.push({
                code: 'WORKSPACE_JSON_MISSING',
                message: 'workspace.json not found. This may indicate the vault has never been opened.',
                path: workspaceJsonPath,
                suggestion: 'Open the vault in Obsidian to generate workspace configuration.'
            });
        } else {
            this.validateJsonFile(workspaceJsonPath, 'workspace.json', errors, warnings);
        }
        
        // Check for community-plugins.json
        const communityPluginsPath = join(this.obsidianPath, 'community-plugins.json');
        if (existsSync(communityPluginsPath)) {
            this.validateJsonFile(communityPluginsPath, 'community-plugins.json', errors, warnings);
            
            // Check if plugins directory exists when community plugins are enabled
            const pluginsDir = join(this.obsidianPath, 'plugins');
            if (!existsSync(pluginsDir)) {
                warnings.push({
                    code: 'PLUGINS_DIRECTORY_MISSING',
                    message: 'Community plugins are configured but plugins directory is missing.',
                    path: pluginsDir,
                    suggestion: 'Install community plugins or disable them in Obsidian settings.'
                });
            }
        }
        
        // Check for core-plugins.json
        const corePluginsPath = join(this.obsidianPath, 'core-plugins.json');
        if (existsSync(corePluginsPath)) {
            this.validateJsonFile(corePluginsPath, 'core-plugins.json', errors, warnings);
        }
    }
    
    /**
     * Validate plugin-specific configuration
     */
    private validatePluginConfig(errors: ValidationError[], warnings: ValidationWarning[], suggestions: string[]): void {
        const pluginsDir = join(this.obsidianPath, 'plugins');
        if (!existsSync(pluginsDir)) {
            return;
        }
        
        // Check for HTML export plugin configuration
        const htmlExportPluginDir = join(pluginsDir, 'webpage-html-export');
        if (existsSync(htmlExportPluginDir)) {
            const dataJsonPath = join(htmlExportPluginDir, 'data.json');
            if (existsSync(dataJsonPath)) {
                this.validateJsonFile(dataJsonPath, 'HTML Export plugin data.json', errors, warnings);
            }
        }
        
        // Check for common problematic plugins that might interfere with export
        const problematicPlugins = [
            'obsidian-git',
            'obsidian-sync'
        ];
        
        problematicPlugins.forEach(pluginId => {
            const pluginDir = join(pluginsDir, pluginId);
            if (existsSync(pluginDir)) {
                warnings.push({
                    code: 'POTENTIALLY_PROBLEMATIC_PLUGIN',
                    message: `Plugin "${pluginId}" detected. This plugin may interfere with Docker exports.`,
                    path: pluginDir,
                    suggestion: 'Consider disabling this plugin for Docker exports or ensure it doesn\'t conflict with the export process.'
                });
            }
        });
    }
    
    /**
     * Validate vault content
     */
    private async validateContent(errors: ValidationError[], warnings: ValidationWarning[], suggestions: string[]): Promise<void> {
        // Check for markdown files
        const hasMarkdownFiles = this.hasFilesWithExtension('.md');
        if (!hasMarkdownFiles) {
            warnings.push({
                code: 'NO_MARKDOWN_FILES',
                message: 'No markdown files found in the vault.',
                suggestion: 'Ensure the vault contains .md files to export.'
            });
        }
        
        // Check for assets directory
        const assetsDir = join(this.vaultPath, 'assets');
        if (existsSync(assetsDir)) {
            const assetCount = this.countFilesInDirectory(assetsDir);
            if (assetCount > 1000) {
                warnings.push({
                    code: 'LARGE_ASSETS_DIRECTORY',
                    message: `Large number of assets detected (${assetCount} files). This may slow down exports.`,
                    path: assetsDir,
                    suggestion: 'Consider optimizing or organizing assets to improve export performance.'
                });
            }
        }
        
        // Check for common attachment directories
        const attachmentDirs = ['attachments', 'files', 'images', 'media'];
        attachmentDirs.forEach(dirName => {
            const dirPath = join(this.vaultPath, dirName);
            if (existsSync(dirPath)) {
                const fileCount = this.countFilesInDirectory(dirPath);
                if (fileCount > 500) {
                    warnings.push({
                        code: 'LARGE_ATTACHMENT_DIRECTORY',
                        message: `Large attachment directory detected: ${dirName} (${fileCount} files)`,
                        path: dirPath,
                        suggestion: 'Consider organizing attachments or using exclude patterns for unused files.'
                    });
                }
            }
        });
        
        // Check for very large individual files
        this.checkForLargeFiles(warnings, suggestions);
    }
    
    /**
     * Validate performance-related aspects
     */
    private validatePerformance(warnings: ValidationWarning[], suggestions: string[]): void {
        // Count total markdown files
        const markdownCount = this.countFilesWithExtension('.md');
        if (markdownCount > 5000) {
            warnings.push({
                code: 'LARGE_VAULT_SIZE',
                message: `Large vault detected (${markdownCount} markdown files). Export may take significant time.`,
                suggestion: 'Consider using exclude patterns to limit the scope of the export or enable incremental exports.'
            });
        }
        
        // Check vault size
        const vaultSizeMB = this.getDirectorySize(this.vaultPath) / (1024 * 1024);
        if (vaultSizeMB > 1000) {
            warnings.push({
                code: 'LARGE_VAULT_DISK_SIZE',
                message: `Large vault size detected (${vaultSizeMB.toFixed(1)} MB).`,
                suggestion: 'Consider excluding large files or directories that are not needed for the web export.'
            });
        }
        
        // Check for nested directory depth
        const maxDepth = this.getMaxDirectoryDepth(this.vaultPath);
        if (maxDepth > 10) {
            warnings.push({
                code: 'DEEP_DIRECTORY_STRUCTURE',
                message: `Deep directory structure detected (${maxDepth} levels deep).`,
                suggestion: 'Consider flattening the directory structure for better web navigation.'
            });
        }
    }
    
    /**
     * Validate JSON file and report parsing errors
     */
    private validateJsonFile(filePath: string, fileName: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
        try {
            const content = readFileSync(filePath, 'utf-8');
            JSON.parse(content);
        } catch (error) {
            errors.push({
                code: 'INVALID_JSON',
                message: `Invalid JSON in ${fileName}: ${error.message}`,
                path: filePath,
                severity: 'error'
            });
        }
    }
    
    /**
     * Check if vault has files with specific extension
     */
    private hasFilesWithExtension(extension: string): boolean {
        return this.countFilesWithExtension(extension) > 0;
    }
    
    /**
     * Count files with specific extension recursively
     */
    private countFilesWithExtension(extension: string, dir: string = this.vaultPath): number {
        if (!existsSync(dir) || !statSync(dir).isDirectory()) {
            return 0;
        }
        
        let count = 0;
        const fs = require('fs');
        
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const itemPath = join(dir, item);
                const stat = statSync(itemPath);
                
                if (stat.isDirectory() && !item.startsWith('.')) {
                    count += this.countFilesWithExtension(extension, itemPath);
                } else if (stat.isFile() && item.endsWith(extension)) {
                    count++;
                }
            }
        } catch (error) {
            // Ignore permission errors
        }
        
        return count;
    }
    
    /**
     * Count files in directory (non-recursive)
     */
    private countFilesInDirectory(dir: string): number {
        if (!existsSync(dir) || !statSync(dir).isDirectory()) {
            return 0;
        }
        
        try {
            const fs = require('fs');
            const items = fs.readdirSync(dir);
            return items.filter(item => {
                const itemPath = join(dir, item);
                return statSync(itemPath).isFile();
            }).length;
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * Get directory size in bytes (recursive)
     */
    private getDirectorySize(dir: string): number {
        if (!existsSync(dir)) {
            return 0;
        }
        
        let size = 0;
        const fs = require('fs');
        
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const itemPath = join(dir, item);
                const stat = statSync(itemPath);
                
                if (stat.isDirectory()) {
                    size += this.getDirectorySize(itemPath);
                } else {
                    size += stat.size;
                }
            }
        } catch (error) {
            // Ignore permission errors
        }
        
        return size;
    }
    
    /**
     * Get maximum directory depth
     */
    private getMaxDirectoryDepth(dir: string, currentDepth: number = 0): number {
        if (!existsSync(dir) || !statSync(dir).isDirectory()) {
            return currentDepth;
        }
        
        let maxDepth = currentDepth;
        const fs = require('fs');
        
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                if (item.startsWith('.')) continue;
                
                const itemPath = join(dir, item);
                const stat = statSync(itemPath);
                
                if (stat.isDirectory()) {
                    const depth = this.getMaxDirectoryDepth(itemPath, currentDepth + 1);
                    maxDepth = Math.max(maxDepth, depth);
                }
            }
        } catch (error) {
            // Ignore permission errors
        }
        
        return maxDepth;
    }
    
    /**
     * Check for large files that might cause issues
     */
    private checkForLargeFiles(warnings: ValidationWarning[], suggestions: string[]): void {
        const largeFiles = this.findLargeFiles(this.vaultPath, 50 * 1024 * 1024); // 50MB threshold
        
        if (largeFiles.length > 0) {
            warnings.push({
                code: 'LARGE_FILES_DETECTED',
                message: `Large files detected (${largeFiles.length} files > 50MB)`,
                suggestion: 'Consider excluding large files from export or optimizing them for web delivery.'
            });
            
            largeFiles.forEach(file => {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                suggestions.push(`Large file: ${file.path} (${sizeMB} MB)`);
            });
        }
    }
    
    /**
     * Find files larger than specified size
     */
    private findLargeFiles(dir: string, sizeThreshold: number): Array<{path: string, size: number}> {
        const largeFiles: Array<{path: string, size: number}> = [];
        
        if (!existsSync(dir) || !statSync(dir).isDirectory()) {
            return largeFiles;
        }
        
        const fs = require('fs');
        
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                if (item.startsWith('.')) continue;
                
                const itemPath = join(dir, item);
                const stat = statSync(itemPath);
                
                if (stat.isDirectory()) {
                    largeFiles.push(...this.findLargeFiles(itemPath, sizeThreshold));
                } else if (stat.size > sizeThreshold) {
                    largeFiles.push({
                        path: itemPath.replace(this.vaultPath, '').replace(/^[/\\]/, ''),
                        size: stat.size
                    });
                }
            }
        } catch (error) {
            // Ignore permission errors
        }
        
        return largeFiles;
    }
    
    /**
     * Generate a validation report as formatted text
     */
    static formatValidationReport(result: ValidationResult): string {
        const lines: string[] = [];
        
        lines.push('=== Vault Validation Report ===');
        lines.push(`Status: ${result.isValid ? '✓ VALID' : '✗ INVALID'}`);
        lines.push('');
        
        if (result.errors.length > 0) {
            lines.push('ERRORS:');
            result.errors.forEach(error => {
                lines.push(`  ✗ [${error.code}] ${error.message}`);
                if (error.path) {
                    lines.push(`    Path: ${error.path}`);
                }
            });
            lines.push('');
        }
        
        if (result.warnings.length > 0) {
            lines.push('WARNINGS:');
            result.warnings.forEach(warning => {
                lines.push(`  ⚠ [${warning.code}] ${warning.message}`);
                if (warning.path) {
                    lines.push(`    Path: ${warning.path}`);
                }
                if (warning.suggestion) {
                    lines.push(`    Suggestion: ${warning.suggestion}`);
                }
            });
            lines.push('');
        }
        
        if (result.suggestions.length > 0) {
            lines.push('SUGGESTIONS:');
            result.suggestions.forEach(suggestion => {
                lines.push(`  💡 ${suggestion}`);
            });
            lines.push('');
        }
        
        if (result.isValid && result.warnings.length === 0) {
            lines.push('✓ Vault is ready for export!');
        } else if (result.isValid) {
            lines.push('✓ Vault is valid but has warnings. Export should work but may have issues.');
        } else {
            lines.push('✗ Vault has errors that must be fixed before export.');
        }
        
        return lines.join('\n');
    }
}