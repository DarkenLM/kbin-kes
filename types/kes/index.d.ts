/**
 * Represents the base settings for any namespace.
 */
export interface BaseModSettings {
    /**
     * The current state of the mod (Enabled/Disabled).
     */
    state: boolean
}

// /**
//  * Represents the settings for a given namespace.
//  */
// export interface ModSettings extends BaseModSettings {
//     [key: string]: unknown
// }

/**
 * This function returns the settings for a particular namespace.
 * Returns an empty object if the namespace has no settings defined.
 */
export function getModSettings<T extends BaseModSettings>(namespace: string): T