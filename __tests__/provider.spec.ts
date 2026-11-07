import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { MagazineLuizaProvider } from "../src/index"

const mocks = vi.hoisted(() => ({
    constructed: [] as unknown[][],
    use: vi.fn(),
    launch: vi.fn(),
}))

vi.mock("puppeteer-extra", () => ({
    PuppeteerExtra: class {
        constructor(...args: unknown[]) {
            mocks.constructed.push(args)
        }
        use = mocks.use
        launch = mocks.launch
    },
}))
vi.mock("puppeteer-extra-plugin-stealth", () => ({ default: () => "stealth-plugin" }))
vi.mock("../src/utils/require-vanilla-puppeteer.util", () => ({
    requireVanillaPuppeteer: () => ["vanilla", undefined],
}))
vi.mock("../src/utils/browser.util", () => ({ getBrowserPath: () => "/fake/chrome" }))

const SLUG = "meu-slug"
const INPUT_SELECTOR = 'input[data-testid="copy-to-clipboard-input"]'
const BUTTON_SELECTOR = 'xpath///button[label[contains(., "Gerar link")]]'

function makePage(overrides: Record<string, unknown> = {}) {
    return {
        goto: vi.fn().mockResolvedValue(undefined),
        click: vi.fn().mockResolvedValue(undefined),
        setCookie: vi.fn().mockResolvedValue(undefined),
        url: vi.fn(),
        waitForSelector: vi.fn().mockResolvedValue(undefined),
        waitForResponse: vi.fn().mockResolvedValue(undefined),
        evaluate: vi.fn(async (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => fn(...args)) as ReturnType<
            typeof vi.fn
        >,
        ...overrides,
    }
}

function setup(options: Partial<ConstructorParameters<typeof MagazineLuizaProvider>[0]> = {}) {
    const page = makePage()
    const browser = { newPage: vi.fn().mockResolvedValue(page), close: vi.fn() }
    mocks.launch.mockResolvedValue(browser)
    const provider = new MagazineLuizaProvider({ cookies: [], affiliateSlug: SLUG, ...options })
    return { provider, page, browser }
}

function stubInput(value: string | null) {
    vi.stubGlobal("document", { querySelector: vi.fn(() => (value === null ? null : { value })) })
}

beforeEach(() => {
    mocks.constructed.length = 0
    mocks.use.mockReset()
    mocks.launch.mockReset()
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe("MagazineLuizaProvider setup", () => {
    it("registers the stealth plugin", () => {
        setup()

        expect(mocks.constructed[0]).toEqual(["vanilla", undefined])
        expect(mocks.use).toHaveBeenCalledWith("stealth-plugin")
    })

    it("supportsUrl matches known domains anywhere in the url", () => {
        const { provider } = setup()

        expect(provider.supportsUrl("https://www.magazineluiza.com.br/p/1")).toBe(true)
        expect(provider.supportsUrl("https://www.magazinevoce.com.br/slug/p/1")).toBe(true)
        expect(provider.supportsUrl("https://magazineluiza.onelink.me/abc")).toBe(true)
        expect(provider.supportsUrl("https://example.com")).toBe(false)
    })
})

describe("resolveProductUrl", () => {
    it("rewrites the main domain to the affiliate domain", async () => {
        const { provider, page } = setup()

        await expect(
            (provider as any).resolveProductUrl(page, "https://www.magazineluiza.com.br/produto/p/123/"),
        ).resolves.toBe(`https://www.magazinevoce.com.br/${SLUG}/produto/p/123/`)
    })

    it("replaces the slug of an affiliate url", async () => {
        const { provider, page } = setup()

        await expect(
            (provider as any).resolveProductUrl(page, "https://www.magazinevoce.com.br/outro/produto/p/123/"),
        ).resolves.toBe(`https://www.magazinevoce.com.br/${SLUG}/produto/p/123/`)
    })

    it("follows short links and resolves the final url", async () => {
        const { provider, page } = setup()
        page.url.mockReturnValue("https://www.magazineluiza.com.br/produto/p/123/")

        await expect((provider as any).resolveProductUrl(page, "https://magazineluiza.onelink.me/abc")).resolves.toBe(
            `https://www.magazinevoce.com.br/${SLUG}/produto/p/123/`,
        )
        expect(page.goto).toHaveBeenCalledWith("https://magazineluiza.onelink.me/abc", { waitUntil: "load" })
    })

    it("rejects unsupported urls", async () => {
        const { provider, page } = setup()

        await expect((provider as any).resolveProductUrl(page, "https://example.com/x")).rejects.toThrow(
            "URL inválida para o provedor Magazine Luiza: https://example.com/x",
        )
    })
})

describe("page helpers", () => {
    it("clickOnGenerateLinkButton waits for the button and clicks it", async () => {
        const { provider, page } = setup()

        await (provider as any).clickOnGenerateLinkButton(page)

        expect(page.waitForSelector).toHaveBeenCalledWith(BUTTON_SELECTOR, { timeout: 15000, visible: true })
        expect(page.click).toHaveBeenCalledWith(BUTTON_SELECTOR)
    })

    it("tryWaitForAffiliateApiResponse filters by url and swallows timeouts", async () => {
        const { provider, page } = setup()

        await (provider as any).tryWaitForAffiliateApiResponse(page)
        const predicate = page.waitForResponse.mock.calls[0][0] as (r: { url: () => string }) => boolean
        expect(
            predicate({ url: () => "https://x.magazinevoce.com.br/azion-rochelle-proxy/v1/shortenlink/onelink" }),
        ).toBe(true)
        expect(predicate({ url: () => "https://other" })).toBe(false)

        page.waitForResponse.mockRejectedValueOnce(new Error("timeout"))
        await expect((provider as any).tryWaitForAffiliateApiResponse(page)).resolves.toBeUndefined()
    })

    it("getAffiliateUrlFromPage reads the input value or null", async () => {
        const { provider, page } = setup()

        stubInput("https://divulgador.magalu.com/abc")
        await expect((provider as any).getAffiliateUrlFromPage(page)).resolves.toBe("https://divulgador.magalu.com/abc")
        expect(page.waitForSelector).toHaveBeenCalledWith(INPUT_SELECTOR, { timeout: 15000, visible: true })

        stubInput(null)
        await expect((provider as any).getAffiliateUrlFromPage(page)).resolves.toBeNull()
    })
})

describe("createAffiliateUrl", () => {
    const URL = "https://www.magazineluiza.com.br/produto/p/123/"

    it("generates the affiliate url and merges the launch options", async () => {
        const { provider, page, browser } = setup({ puppeteer: { headless: false } })
        stubInput("https://divulgador.magalu.com/abc")

        await expect(provider.createAffiliateUrl(URL)).resolves.toBe("https://divulgador.magalu.com/abc")

        expect(mocks.launch.mock.calls[0][0]).toMatchObject({
            headless: false,
            executablePath: "/fake/chrome",
            defaultViewport: null,
        })
        expect(page.goto).toHaveBeenCalledWith(`https://www.magazinevoce.com.br/${SLUG}/produto/p/123/`, {
            waitUntil: "domcontentloaded",
        })
        expect(browser.close).toHaveBeenCalled()
    })

    it("sets cookies only when provided", async () => {
        const cookies = [{ name: "session", value: "1" }] as any[]
        stubInput("https://divulgador.magalu.com/abc")

        const withCookies = setup({ cookies })
        await withCookies.provider.createAffiliateUrl(URL)
        expect(withCookies.page.setCookie).toHaveBeenCalledWith(...cookies)

        const withoutCookies = setup({ cookies: [] })
        await withoutCookies.provider.createAffiliateUrl(URL)
        expect(withoutCookies.page.setCookie).not.toHaveBeenCalled()

        const undefinedCookies = setup({ cookies: undefined as any })
        await undefinedCookies.provider.createAffiliateUrl(URL)
        expect(undefinedCookies.page.setCookie).not.toHaveBeenCalled()
    })

    it("throws when the affiliate url is not on the page", async () => {
        const { provider, browser } = setup()
        stubInput(null)

        await expect(provider.createAffiliateUrl(URL)).rejects.toThrow(
            "Não foi possível encontrar a URL de afiliado na página.",
        )
        expect(browser.close).toHaveBeenCalled()
    })

    it("closes the browser and rethrows invalid url errors", async () => {
        const { provider, browser } = setup()

        await expect(provider.createAffiliateUrl("https://example.com/x")).rejects.toThrow("URL inválida")
        expect(browser.close).toHaveBeenCalled()
    })
})
