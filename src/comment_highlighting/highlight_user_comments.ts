/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseModSettings, getModSettings } from "@kes/index";
import { safeGM } from "@kes/safeGM";

//#region ============== TYPES ==============
interface HCModSettings extends BaseModSettings {
    border_color: unknown,
    border_size: number,
    highlight_bg_color: unknown
}
//#endregion

//#region ============== IMPLEMENTATION ==============

//#region ======= VARIABLES =======
const hcStyleId = "hc_style";
let hcCurrent = "";
//#endregion

function highlight_comment (id: string) {
    const comment = document.getElementById(`entry-comment-${id}`);

    if (comment) {
        comment.classList.add("highlight_comment");
        hcCurrent = id;
    }
}

function highlight_applyStyle () {
    if (document.getElementById(hcStyleId)) safeGM("removeStyle", hcStyleId);

    const settings = getModSettings<HCModSettings>("highlight_user_comments");

    safeGM(
        "addStyle", 
        `
        .highlight_comment {       
            border-top: ${settings.border_size}px solid ${settings.border_color} !important;
            border-right: ${settings.border_size}px solid ${settings.border_color} !important;
            border-bottom: ${settings.border_size}px solid ${settings.border_color} !important;
            background-color: ${settings.highlight_bg_color} !important;
        }
        `, 
        hcStyleId
    );
}

//#endregion


//#region ============== ENTRY POINT ==============
function highlight_comments_cleanup () {
    safeGM("removeStyle", hcStyleId);

    const comment = document.getElementById(`entry-comment-${hcCurrent}`);

    if (comment) {
        comment.classList.remove("highlight_comment");
        hcCurrent = "";
    }
}

function highlight_comments (toggle: boolean) {
    if (toggle) {
        try {
            const settings = getModSettings<HCModSettings>("highlight_user_comments");
            console.log("[HCL] SETTINGS:", settings);

            highlight_applyStyle();

            const hash = window.location.hash;
    
            if (hash.startsWith("#entry-comment-")) {
                const commentId = hash.replace("#entry-comment-", "");

                highlight_comment(commentId);
            }
        } catch (e) {
            console.error("[CORRECT COMMENTS] Caught error:", e);
        }
    } else {
        highlight_comments_cleanup();
    }
}
//#endregion