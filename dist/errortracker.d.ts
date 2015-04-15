interface errorTrackerStorageOptions {
    maxSize: number;
    type: string;
}

interface errorTrackerExcludeFilter {
	[s: string]: any;
}

interface errorTrackerInitOptions {
    storage: errorTrackerStorageOptions;
    addToServerDbUrl: string;
    exclude: Array<errorTrackerExcludeFilter>;
}

interface errortrackerStatic {
    config(opts: errorTrackerInitOptions): void;
    enableDebugMode(): void;
    disableDebugMode(): void;
    report(reporter: string, Array): void;
    reporters: string;
    getNamespace: string;
    clearStack: void;
    printStack: void;
    syncStorage: void;
    resetProperties: void;
}

declare var errorTracker : errortrackerStatic;