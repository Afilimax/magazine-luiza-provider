import { executablePath } from "puppeteer-core"

import { existsSync } from "node:fs"
import path from "node:path"

export function getBrowserPath(): string {
    let defaultPath = ""

    try {
        defaultPath = executablePath()
    } catch (e) {
        // ignore
    }

    if (defaultPath && existsSync(defaultPath)) {
        return defaultPath
    }

    const commonPaths = [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
        "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    ]

    for (const p of commonPaths) {
        if (existsSync(p)) {
            return p
        }
    }

    return defaultPath || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" // Fallback
}
