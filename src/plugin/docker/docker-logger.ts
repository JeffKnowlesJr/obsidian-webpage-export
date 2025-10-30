/**
 * Structured logging system for Docker exports
 * Provides different log levels and CI/CD-friendly output
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
    error?: Error;
    duration?: number;
    progress?: ProgressInfo;
}

export interface ProgressInfo {
    current: number;
    total: number;
    stage: string;
    percentage: number;
}

export interface TroubleshootingInfo {
    errorCode: string;
    description: string;
    possibleCauses: string[];
    solutions: string[];
    documentationLinks?: string[];
}

export class DockerLogger {
    private static instance: DockerLogger;
    private logLevel: LogLevel;
    private isCI: boolean;
    private startTime: number;
    private logEntries: LogEntry[] = [];
    
    private constructor() {
        this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'INFO');
        this.isCI = this.detectCIEnvironment();
        this.startTime = Date.now();
    }
    
    static getInstance(): DockerLogger {
        if (!DockerLogger.instance) {
            DockerLogger.instance = new DockerLogger();
        }
        return DockerLogger.instance;
    }
    
    /**
     * Log debug information (verbose details)
     */
    debug(message: string, context?: Record<string, any>): void {
        this.log(LogLevel.DEBUG, message, context);
    }
    
    /**
     * Log general information
     */
    info(message: string, context?: Record<string, any>): void {
        this.log(LogLevel.INFO, message, context);
    }
    
    /**
     * Log warnings (non-fatal issues)
     */
    warn(message: string, context?: Record<string, any>): void {
        this.log(LogLevel.WARN, message, context);
    }
    
    /**
     * Log errors (fatal issues)
     */
    error(message: string, error?: Error, context?: Record<string, any>): void {
        this.log(LogLevel.ERROR, message, context, error);
    }
    
    /**
     * Log progress information for long-running operations
     */
    progress(stage: string, current: number, total: number, message?: string): void {
        const percentage = Math.round((current / total) * 100);
        const progressInfo: ProgressInfo = {
            current,
            total,
            stage,
            percentage
        };
        
        const progressMessage = message || `${stage}: ${current}/${total} (${percentage}%)`;
        this.log(LogLevel.INFO, progressMessage, undefined, undefined, progressInfo);
    }
    
    /**
     * Log operation start with timing
     */
    startOperation(operation: string, context?: Record<string, any>): number {
        const operationId = Date.now();
        this.info(`Starting: ${operation}`, { ...context, operationId });
        return operationId;
    }
    
    /**
     * Log operation completion with duration
     */
    endOperation(operation: string, operationId: number, context?: Record<string, any>): void {
        const duration = Date.now() - operationId;
        this.log(LogLevel.INFO, `Completed: ${operation}`, { ...context, operationId }, undefined, undefined, duration);
    }
    
    /**
     * Log structured error with troubleshooting information
     */
    errorWithTroubleshooting(message: string, troubleshooting: TroubleshootingInfo, error?: Error): void {
        this.error(message, error, { troubleshooting });
        
        // Output troubleshooting information in a CI-friendly format
        if (this.isCI) {
            console.error('\n=== TROUBLESHOOTING INFORMATION ===');
            console.error(`Error Code: ${troubleshooting.errorCode}`);
            console.error(`Description: ${troubleshooting.description}`);
            
            if (troubleshooting.possibleCauses.length > 0) {
                console.error('\nPossible Causes:');
                troubleshooting.possibleCauses.forEach((cause, index) => {
                    console.error(`  ${index + 1}. ${cause}`);
                });
            }
            
            if (troubleshooting.solutions.length > 0) {
                console.error('\nSolutions:');
                troubleshooting.solutions.forEach((solution, index) => {
                    console.error(`  ${index + 1}. ${solution}`);
                });
            }
            
            if (troubleshooting.documentationLinks && troubleshooting.documentationLinks.length > 0) {
                console.error('\nDocumentation:');
                troubleshooting.documentationLinks.forEach(link => {
                    console.error(`  - ${link}`);
                });
            }
            console.error('=====================================\n');
        }
    }
    
    /**
     * Generate export summary report
     */
    generateSummaryReport(): string {
        const totalDuration = Date.now() - this.startTime;
        const errors = this.logEntries.filter(entry => entry.level === LogLevel.ERROR);
        const warnings = this.logEntries.filter(entry => entry.level === LogLevel.WARN);
        
        const lines: string[] = [];
        lines.push('=== Export Summary Report ===');
        lines.push(`Total Duration: ${this.formatDuration(totalDuration)}`);
        lines.push(`Errors: ${errors.length}`);
        lines.push(`Warnings: ${warnings.length}`);
        lines.push(`Status: ${errors.length === 0 ? 'SUCCESS' : 'FAILED'}`);
        
        if (errors.length > 0) {
            lines.push('\nErrors:');
            errors.forEach((error, index) => {
                lines.push(`  ${index + 1}. ${error.message}`);
                if (error.error) {
                    lines.push(`     ${error.error.message}`);
                }
            });
        }
        
        if (warnings.length > 0) {
            lines.push('\nWarnings:');
            warnings.forEach((warning, index) => {
                lines.push(`  ${index + 1}. ${warning.message}`);
            });
        }
        
        lines.push('==============================');
        return lines.join('\n');
    }
    
    /**
     * Export logs in JSON format for CI/CD processing
     */
    exportLogsAsJSON(): string {
        const summary = {
            startTime: new Date(this.startTime).toISOString(),
            endTime: new Date().toISOString(),
            duration: Date.now() - this.startTime,
            totalEntries: this.logEntries.length,
            errorCount: this.logEntries.filter(e => e.level === LogLevel.ERROR).length,
            warningCount: this.logEntries.filter(e => e.level === LogLevel.WARN).length,
            success: this.logEntries.filter(e => e.level === LogLevel.ERROR).length === 0,
            entries: this.logEntries
        };
        
        return JSON.stringify(summary, null, 2);
    }
    
    /**
     * Core logging method
     */
    private log(
        level: LogLevel, 
        message: string, 
        context?: Record<string, any>, 
        error?: Error,
        progress?: ProgressInfo,
        duration?: number
    ): void {
        if (level < this.logLevel) {
            return;
        }
        
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            error,
            progress,
            duration
        };
        
        this.logEntries.push(entry);
        this.outputLog(entry);
    }
    
    /**
     * Output log entry to console with appropriate formatting
     */
    private outputLog(entry: LogEntry): void {
        const levelStr = LogLevel[entry.level];
        const timestamp = this.isCI ? entry.timestamp : new Date(entry.timestamp).toLocaleTimeString();
        
        let output = `[${timestamp}] ${levelStr}: ${entry.message}`;
        
        // Add progress information
        if (entry.progress) {
            const progressBar = this.generateProgressBar(entry.progress.percentage);
            output += ` ${progressBar}`;
        }
        
        // Add duration if available
        if (entry.duration !== undefined) {
            output += ` (${this.formatDuration(entry.duration)})`;
        }
        
        // Output to appropriate stream
        switch (entry.level) {
            case LogLevel.ERROR:
                console.error(output);
                if (entry.error && this.logLevel <= LogLevel.DEBUG) {
                    console.error(entry.error.stack);
                }
                break;
            case LogLevel.WARN:
                console.warn(output);
                break;
            default:
                console.log(output);
                break;
        }
        
        // Output context in debug mode
        if (entry.context && this.logLevel <= LogLevel.DEBUG) {
            console.log('  Context:', JSON.stringify(entry.context, null, 2));
        }
        
        // Output structured JSON in CI mode for machine processing
        if (this.isCI && entry.level >= LogLevel.WARN) {
            console.log(`::${levelStr.toLowerCase()}::${JSON.stringify(entry)}`);
        }
    }
    
    /**
     * Parse log level from string
     */
    private parseLogLevel(level: string): LogLevel {
        switch (level.toUpperCase()) {
            case 'DEBUG': return LogLevel.DEBUG;
            case 'INFO': return LogLevel.INFO;
            case 'WARN': return LogLevel.WARN;
            case 'ERROR': return LogLevel.ERROR;
            default: return LogLevel.INFO;
        }
    }
    
    /**
     * Detect if running in CI environment
     */
    private detectCIEnvironment(): boolean {
        return !!(
            process.env.CI ||
            process.env.GITHUB_ACTIONS ||
            process.env.GITLAB_CI ||
            process.env.JENKINS_URL ||
            process.env.BUILDKITE ||
            process.env.CIRCLECI
        );
    }
    
    /**
     * Generate ASCII progress bar
     */
    private generateProgressBar(percentage: number, width: number = 20): string {
        const filled = Math.round((percentage / 100) * width);
        const empty = width - filled;
        return `[${'█'.repeat(filled)}${' '.repeat(empty)}] ${percentage}%`;
    }
    
    /**
     * Format duration in human-readable format
     */
    private formatDuration(ms: number): string {
        if (ms < 1000) {
            return `${ms}ms`;
        } else if (ms < 60000) {
            return `${(ms / 1000).toFixed(1)}s`;
        } else {
            const minutes = Math.floor(ms / 60000);
            const seconds = Math.floor((ms % 60000) / 1000);
            return `${minutes}m ${seconds}s`;
        }
    }
}

/**
 * Common troubleshooting scenarios for Docker exports
 */
export class DockerTroubleshooting {
    static readonly VAULT_NOT_FOUND: TroubleshootingInfo = {
        errorCode: 'VAULT_NOT_FOUND',
        description: 'The specified vault directory could not be found',
        possibleCauses: [
            'Incorrect vault path specified',
            'Vault directory not mounted in Docker container',
            'Permission issues accessing the vault directory'
        ],
        solutions: [
            'Verify the vault path is correct',
            'Ensure the vault directory is properly mounted with -v flag',
            'Check file permissions and ownership',
            'Use absolute paths when mounting volumes'
        ],
        documentationLinks: [
            'https://docs.docker.com/storage/volumes/',
            'https://github.com/KosmosisDire/obsidian-webpage-export/blob/master/docs/docker-automation-guide.md'
        ]
    };
    
    static readonly INVALID_OBSIDIAN_VAULT: TroubleshootingInfo = {
        errorCode: 'INVALID_OBSIDIAN_VAULT',
        description: 'The directory does not appear to be a valid Obsidian vault',
        possibleCauses: [
            'Missing .obsidian configuration directory',
            'Vault has never been opened in Obsidian',
            'Corrupted vault configuration'
        ],
        solutions: [
            'Open the vault in Obsidian to initialize configuration',
            'Check that .obsidian directory exists and contains app.json',
            'Create a new vault and copy content if configuration is corrupted'
        ]
    };
    
    static readonly PERMISSION_DENIED: TroubleshootingInfo = {
        errorCode: 'PERMISSION_DENIED',
        description: 'Permission denied when accessing vault files',
        possibleCauses: [
            'Docker container running with insufficient permissions',
            'File ownership issues between host and container',
            'SELinux or AppArmor restrictions'
        ],
        solutions: [
            'Run Docker with --user flag matching host user',
            'Use chown to fix file ownership issues',
            'Add :Z flag to volume mounts for SELinux systems',
            'Check Docker daemon permissions'
        ]
    };
    
    static readonly OUT_OF_MEMORY: TroubleshootingInfo = {
        errorCode: 'OUT_OF_MEMORY',
        description: 'Export process ran out of memory',
        possibleCauses: [
            'Vault is very large with many files',
            'Large images or attachments consuming memory',
            'Docker container memory limit too low'
        ],
        solutions: [
            'Increase Docker container memory limit with --memory flag',
            'Use exclude patterns to reduce export scope',
            'Enable image optimization to reduce memory usage',
            'Process vault in smaller batches'
        ]
    };
    
    static readonly NETWORK_ERROR: TroubleshootingInfo = {
        errorCode: 'NETWORK_ERROR',
        description: 'Network error during export process',
        possibleCauses: [
            'External resources could not be downloaded',
            'CDN or external service unavailable',
            'Firewall blocking outbound connections'
        ],
        solutions: [
            'Check internet connectivity',
            'Use offline resources mode',
            'Configure proxy settings if behind corporate firewall',
            'Retry export after network issues are resolved'
        ]
    };
}

/**
 * Convenience function to get logger instance
 */
export function getLogger(): DockerLogger {
    return DockerLogger.getInstance();
}