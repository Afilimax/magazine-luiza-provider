export function requireVanillaPuppeteer(): [any | undefined, Error | undefined] {
    try {
        return [require("puppeteer"), undefined]
    } catch {}

    try {
        return [require("puppeteer-core"), undefined]
    } catch (err) {
        return [undefined, err as Error]
    }
}
