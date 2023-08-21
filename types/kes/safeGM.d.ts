//#region ============== SAFEGM FUNCTIONS ==============

declare namespace safeGMUnderscore {
	// Taken from https://www.tampermonkey.net/documentation.php?locale=en#api:GM_info
	export type ScriptGetInfo = {
		downloadMode: string,
		isFirstPartyIsolation?: boolean,
		isIncognito: boolean,
		sandboxMode: SandboxMode,
		scriptHandler: string,
		scriptMetaStr: string | null,
		scriptUpdateURL: string | null,
		scriptWillUpdate: boolean,
		version?: string,
		script: {
			antifeatures: { [antifeature: string]: { [locale: string]: string } },
			author: string | null,
			blockers: string[],
			connects: string[],
			copyright: string | null,
			deleted?: number | undefined,
			description_i18n: { [locale: string]: string } | null,
			description: string,
			downloadURL: string | null,
			excludes: string[],
			fileURL: string | null,
			grant: string[],
			header: string | null,
			homepage: string | null,
			icon: string | null,
			icon64: string | null,
			includes: string[],
			lastModified: number,
			matches: string[],
			name_i18n: { [locale: string]: string } | null,
			name: string,
			namespace: string | null,
			position: number,
			resources: Resource[],
			supportURL: string | null,
			system?: boolean | undefined,
			"run-at": string | null,
			unwrap: boolean | null,
			updateURL: string | null,
			version: string,
			webRequest: WebRequestRule[] | null,
			options: {
				check_for_updates: boolean,
				comment: string | null,
				compatopts_for_requires: boolean,
				compat_wrappedjsobject: boolean,
				compat_metadata: boolean,
				compat_foreach: boolean,
				compat_powerful_this: boolean | null,
				sandbox: string | null,
				noframes: boolean | null,
				unwrap: boolean | null,
				run_at: string | null,
				tab_types: string | null,
				override: {
					use_includes: string[],
					orig_includes: string[],
					merge_includes: boolean,
					use_matches: string[],
					orig_matches: string[],
					merge_matches: boolean,
					use_excludes: string[],
					orig_excludes: string[],
					merge_excludes: boolean,
					use_connects: string[],
					orig_connects: string[],
					merge_connects: boolean,
					use_blockers: string[],
					orig_run_at: string | null,
					orig_noframes: boolean | null
				}
			}
		}
	};
	
	type SandboxMode = "js" | "raw" | "dom";
	
	type Resource = {
		name: string,
		url: string,
		error?: string,
		content?: string,
		meta?: string
	};
	
	type WebRequestRule = {
		selector: { 
			include?: string | string[], 
			match?: string | string[], 
			exclude?: string | string[] 
		} | string,
		action: string | {
			cancel?: boolean,
			redirect?: {
				url: string,
				from?: string,
				to?: string
			} | string
		}
	};
}

declare namespace safeGMDot {
	export interface ScriptGetInfo {
		script: {
			description: string,
			excludes: string[],
			includes: string[],
			matches: string[],
			name: string,
			namespace: string,
			resources: Resource,
			"run-at": string,
			version: string
		},
		scriptMetaStr: string,
		scriptHandler: string,
		version: string
	}

	interface Resource {
		name: string,
		mimetype: string,
		url: string
	}
}

declare namespace safeGMData {
	export interface XMLRequestDetails {
		binary?: boolean
		context?: object,
		data?: string,
		headers?: Record<string, string>,
		method: "GET" | "HEAD" | "POST",
		overrideMimeType?: string,
		password?: string,
		responseType?: XMLHttpRequestResponseType,
		timeout?: number,
		url: string,
		user?: string,

		onabort: (res: safeGMData.XMLRequestResponse) => void,
		onerror: (res: safeGMData.XMLRequestResponse) => void,
		onload: (res: safeGMData.XMLRequestResponse) => void,
		onprogress: (res: safeGMData.XMLRequestResponse) => void,
		onreadystatechange: (res: safeGMData.XMLRequestResponse) => void,
		ontimeout: (res: safeGMData.XMLRequestResponse) => void,
	}

	export interface XMLRequestResponse {
		finalUrl: string,
		readyState: number,
		status: number,
		statusText: string,
		responseHeaders: string,
		response: string,
		responseXML: XMLDocument,
		responseText: string
	}

	/**
	 * Sets the value of a specific key in the KES's storage.
	 * 
	 * Part of the 
	 * {@link https://aclist.github.io/kes/kes_dark.html#_compatibility_api | KES Compatibility API}
	 */
	export function setValue(key: string, value: unknown): Promise<void>;

	/**
	 * Retrieves the value of a specific key in the KES's storage.
	 * If the key is not set, the default value will be returned, if defined.
	 * 
	 * Part of the 
	 * {@link https://aclist.github.io/kes/kes_dark.html#_compatibility_api | KES Compatibility API}
	 */
	export function getValue<D>(key: string, defaultValue?: D): Promise<unknown | D>;
	
	/**
	 * Adds the given style to the document.
	 * 
	 * Use `safeGM.addStyle` to access this function.
	 * 
	 * Part of the 
	 * {@link https://aclist.github.io/kes/kes_dark.html#_compatibility_api | KES Compatibility API}
	 */
	export function addCustomCSS (css: string, id: string): void;

	/**
	 * Removes the given style from the document.
	 * 
	 * Use `safeGM.removeStyle` to access this function.
	 * 
	 * Part of the 
	 * {@link https://aclist.github.io/kes/kes_dark.html#_compatibility_api | KES Compatibility API}
	 */
	export function removeCustomCSS (id: string): void;

	/**
	 * Performs an HTTP request and handles the response.
	 * 
	 * Part of the 
	 * {@link https://aclist.github.io/kes/kes_dark.html#_compatibility_api | KES Compatibility API}
	 */
	export function xmlhttpRequest (details: XMLRequestDetails): void

	/**
	 * Sets the text of the clipboard to a specified value.
	 * 
	 * Part of the 
	 * {@link https://aclist.github.io/kes/kes_dark.html#_compatibility_api | KES Compatibility API}
	 */
	export function setClipboard (text: string): void

	interface baseSafeGMFunction {
		setValue: typeof setValue,
		getValue: typeof getValue,
		addStyle: typeof addCustomCSS,
		removeStyle: typeof removeCustomCSS,
		xmlhttpRequest: typeof xmlhttpRequest,
        setClipboard: typeof setClipboard
	}

	interface underscoreSafeGMFunction extends baseSafeGMFunction {
        getResourceText: (name: string) => string,
		info: () => safeGMUnderscore.ScriptGetInfo
	}

	interface dotSafeGMFunction extends baseSafeGMFunction {
		info: () => safeGMDot.ScriptGetInfo
	}

	export type safeGMFunction = underscoreSafeGMFunction & dotSafeGMFunction
}

/**
 * This is a shim function into which GM API commands can be passed. 
 * This function accepts the name of a GM API function and its respective arguments.
 * 
 * Part of the 
 * {@link https://aclist.github.io/kes/kes_dark.html#_compatibility_api | KES Compatibility API}
 */
export function safeGM<K extends keyof safeGMData.safeGMFunction>
	(key: K, ...args: Parameters<safeGMData.safeGMFunction[K]>)
		: ReturnType<safeGMData.safeGMFunction[K]>

//#endregion


//#region ============== UTILITY FUNCTIONS ==============
export function getHex (value: string): string;

export function genericXMLRequest (
	url: string, 
	callback: (res: safeGMData.XMLRequestResponse) => void
): void
//#endregion