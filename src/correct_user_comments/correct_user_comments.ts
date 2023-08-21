/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseModSettings, getModSettings } from "@kes/index";
import { genericXMLRequest } from "@kes/safeGM";

//#region ============== TYPES ==============
type CCMode = "Isolated" | "Original"
interface CCModSettings extends BaseModSettings {
    mode: CCMode,
    timeout: number
}

type RegExpGroups = NonNullable<RegExpMatchArray["groups"]>
//#endregion

//#region ============== IMPLEMENTATION ==============

//#region ======= UTILITIES =======
function makeErrorAndAppend (str: string, parent: Element) {
    const errorElement = document.createElement("li");
    errorElement.setAttribute("name", "error");
    errorElement.innerHTML = 
    `<a style="pointer-events: none; background-color: #c73030;">${str}</a>`;

    parent.appendChild(errorElement);
}
//#endregion

//#region ======= VARIABLES =======
const allowedInstances = ["kbin.social", "kbin.cafe"];
const ccListeners: { elem: Element, listener: (e: Event) => void }[] = [];
//#endregion

async function commentCorrector (settings: CCModSettings, comment: Element) {
    const mode = settings.mode;
    const dropdown = comment.querySelector("footer > menu > li.dropdown > ul.dropdown__menu");

    if (!dropdown) {
        return;
    }
    
    const candidates: NodeListOf<HTMLAnchorElement> = dropdown.querySelectorAll(
        `li > a[data-action="clipboard#copy"]`
    );

    for (let j = 0; j < candidates.length; j++) {
        (<NonNullable<HTMLElement>>candidates[j].parentElement).style.display = "none";
    }

    const loaderElement = document.createElement("li");
    loaderElement.setAttribute("data-subject-target", "loader");
    loaderElement.style.cssText = 
        "display: flex; padding: 1.5rem 1rem !important; align-items: center;";
    loaderElement.innerHTML = `
        <div class="loader" role="status" name="cc_loader">
            <span class="visually-hidden">Loading...</span>
        </div>
    `;
    dropdown.appendChild(loaderElement);

    const errorElem = dropdown.querySelector("a[name=\"error\"]");
    if (errorElem) dropdown.removeChild(errorElem);

    for (let j = 0; j < candidates.length; j++) {
        const candidate = candidates[j];
        const url = new URL(candidate.href, window.location.origin);

        if (
            allowedInstances.includes(url.hostname) 
        ) {
            const matchIsolated = url.href.match(
                /(?<threadPath>\/m\/[^/]+\/t\/[^/]+)\/-\/comment\/(?<commentID>\d+)\/?$/
            );
            const matchOriginal = url.href.match(
                // eslint-disable-next-line max-len
                /(?<threadPath>(?<metatp>\/m\/[^/]+\/t\/(?:[^/]+))\/[^#]+)#entry-comment-(?<commentID>\d+)/
            );
            const matchOriginalReduced = url.href.replace(/\?p=\d+/, "").match(
                /(?<threadPath>(?<metatp>\/m\/[^/]+\/t\/(?:[^/]+)))#entry-comment-(?<commentID>\d+)/
            );

            if (mode === "Isolated") {
                if (matchOriginal) {
                    const groups = <RegExpGroups>matchOriginal.groups;

                    candidate.href = `${
                        url.origin
                    }${groups.metatp}/-/comment/${groups.commentID}`;
                } else if (matchOriginalReduced) {
                    const groups = <RegExpGroups>matchOriginalReduced.groups;

                    candidate.href = `${
                        url.origin
                    }${groups.metatp}/-/comment/${groups.commentID}`;
                }
            } else {
                let commentID = "";
                let groups: RegExpGroups | undefined = undefined;

                if (matchIsolated) {
                    commentID = (<RegExpGroups>matchIsolated.groups).commentID;
                    groups = <RegExpGroups>matchIsolated.groups;
                } else if (matchOriginal) {
                    commentID = (<RegExpGroups>matchOriginal.groups).commentID;
                    groups = <RegExpGroups>matchOriginal.groups;
                } else if (matchOriginalReduced) {
                    commentID = (<RegExpGroups>matchOriginalReduced.groups).commentID;
                    groups = <RegExpGroups>matchOriginalReduced.groups;
                } else {
                    dropdown.removeChild(loaderElement);

                    for (let j = 0; j < candidates.length; j++) {
                        (<NonNullable<HTMLElement>>candidates[j].parentElement)
                            .style.display = "unset";
                    }

                    makeErrorAndAppend("Cannot fetch URL", dropdown);
                    return;
                }

                let page = 1;
                let ms = -1;
                let clock: NodeJS.Timer;
                
                settings.timeout = parseInt(<string><unknown>settings.timeout, 10);
                if (settings.timeout !== -1) clock = setInterval(() => ms++, 1);

                // eslint-disable-next-line no-inner-declarations
                function timeout () {
                    (<NonNullable<Element>>dropdown).removeChild(loaderElement);

                    for (let j = 0; j < candidates.length; j++) {
                        (<NonNullable<HTMLElement>>candidates[j].parentElement)
                            .style.display = "unset";
                    }

                    makeErrorAndAppend("Timed out.", (<NonNullable<Element>>dropdown));
                    clearInterval(clock);
                }

                // eslint-disable-next-line no-inner-declarations
                async function recurse (loop: number) {
                    if (settings.timeout !== -1 && ms >= settings.timeout) {
                        timeout();
                        return;
                    }

                    const newUrl = `${
                        url.origin
                    }${groups?.threadPath}?p=${page}#entry-comment-${commentID}`;

                    await new Promise<void>((resolve, reject) => {
                        genericXMLRequest(
                            newUrl, 
                            async (res) => {
                                if (settings.timeout !== -1 && ms >= settings.timeout) {
                                    timeout();
                                    return;
                                }
    
                                if (res.status !== 200) {
                                    return resolve();
                                }
    
                                const html = res.responseText;
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(html, "text/html");
    
                                const comment = doc.getElementById(
                                    `entry-comment-${commentID}`
                                );
    
                                if (comment) {
                                    candidate.href = newUrl;
                                    return resolve();
                                } else {
                                    page++;
                                }
                                    
                                const nl = loop + 1;
                                await recurse(nl);
                                return resolve();
                            }
                        );
                    });
                }

                await recurse(0);
            }
        } else return;
    }

    dropdown.removeChild(loaderElement);
    for (let j = 0; j < candidates.length; j++) {
        (<NonNullable<HTMLElement>>candidates[j].parentElement).style.display = "unset";
    }
}

async function commentListener () {
    const comments = document.querySelectorAll("blockquote.comment > footer > menu > li.dropdown");

    function trigger (elem: Element) {
        const f = function (e: Event) {
            const pendingMark = elem.getAttribute("data-cc-pending");
            if (pendingMark === "true") return;

            const settings = getModSettings<CCModSettings>("correct_user_comments");
            const correctionMark = elem.getAttribute("data-cc");
            const correctionModeMark = elem.getAttribute("data-cc-mode");

            if (correctionMark !== "true" || correctionModeMark !== settings.mode) {
                elem.setAttribute("data-cc-pending", "true");
                commentCorrector(settings, elem);
                elem.removeAttribute("data-cc-pending");
                elem.setAttribute("data-cc", "true");
                elem.setAttribute("data-cc-mode", `${settings.mode}`);
            }
        };

        ccListeners.push({ elem: elem, listener: f });
        return f;
    }

    for (let i = 0; i < comments.length; i++) {
        const comment = comments[i];

        comment.addEventListener("mouseenter", trigger(comment));
    }
}
//#endregion

//#region ============== ENTRY POINT ==============
function correct_comments_cleanup () {
    for (let i = 0; i < ccListeners.length; i++) {
        const { elem, listener } = ccListeners[i];

        elem.removeAttribute("data-cc");
        elem.removeEventListener("mouseenter", listener);
    }

    ccListeners.splice(0, ccListeners.length);
}

function correct_comments (toggle: boolean) {
    if (toggle) {
        try {
            commentListener();
        } catch (e) {
            console.error("[CORRECT COMMENTS] Caught error:", e);
        }
    } else {
        correct_comments_cleanup();
    }
}
//#endregion