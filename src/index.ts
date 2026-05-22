import { PuppeteerExtra } from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { Page, Cookie } from "puppeteer-core"

import { AffiliateProvider } from "@afilimax/core"
import { requireVanillaPuppeteer, getBrowserPath } from "./utils"

export type MagazineLuizaProviderOptions = {
    cookies: Cookie[]
    affiliateSlug: string
    puppeteer?: any
}

export class MagazineLuizaProvider extends AffiliateProvider<MagazineLuizaProviderOptions> {
    readonly name = "Magazine Luiza"
    readonly domains = ["magazineluiza.com.br", "magazinevoce.com.br", "magazineluiza.onelink.me"]

    private readonly puppeteer: PuppeteerExtra

    constructor(options: MagazineLuizaProviderOptions) {
        super(options)
        this.puppeteer = new PuppeteerExtra(...requireVanillaPuppeteer())
        this.puppeteer.use(StealthPlugin())
    }

    supportsUrl(url: string): boolean {
        return this.domains.some(domain => url.includes(domain))
    }

    private async resolveProductUrl(page: Page, url: string): Promise<string> {
        const urlObj = new URL(url)
        const isMainDomain = urlObj.hostname.includes("magazineluiza.com.br")
        const isAffiliateUrl = urlObj.hostname.includes("magazinevoce.com.br")
        const isShortAffiliateUrl = urlObj.hostname.includes("magazineluiza.onelink.me")

        if (isMainDomain) {
            return url.replace("magazineluiza.com.br", `magazinevoce.com.br/${this.options.affiliateSlug}`)
        } else if (isAffiliateUrl) {
            // Se já for uma URL de afiliado, garante que o slug esteja correto
            return url.replace(/(magazinevoce\.com\.br)\/[^/]+/, `$1/${this.options.affiliateSlug}`)
        } else if (isShortAffiliateUrl) {
            await page.goto(url, { waitUntil: "load" })
            return await this.resolveProductUrl(page, page.url())
        } else {
            throw new Error(`URL inválida para o provedor Magazine Luiza: ${url}`)
        }
    }

    private async clickOnGenerateLinkButton(page: Page) {
        // Usa seletores mais robustos e aguarda visibilidade
        const generateButtonSelector = "xpath///button[label[contains(., \"Gerar link\")]]"
        await page.waitForSelector(generateButtonSelector, { timeout: 15000, visible: true })
        await page.click(generateButtonSelector)
    }

    private async tryWaitForAffiliateApiResponse(page: Page) {
        try {
            await page.waitForResponse(
                (request) => request.url().includes("magazinevoce.com.br/azion-rochelle-proxy/v1/shortenlink/onelink"),
                { timeout: 10000 }
            )
        } catch {
            // Silently ignore timeout if the response doesn't come or isn't needed
        }
    }

    private async getAffiliateUrlFromPage(page: Page) {
        const inputSelector = "input[data-testid=\"copy-to-clipboard-input\"]"
        await page.waitForSelector(inputSelector, { timeout: 15000, visible: true })
        return await page.evaluate((sel) => {
            const el = document.querySelector(sel) as HTMLInputElement
            return el ? el.value : null
        }, inputSelector)
    }

    async createAffiliateUrl(url: string): Promise<string> {
        const browser = await this.puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--disable-gpu",
                "--start-maximized",
            ],
            defaultViewport: null,
            executablePath: getBrowserPath(),
            ...this.options.puppeteer,
        })

        try {
            const page = await browser.newPage()

            if (this.options.cookies && this.options.cookies.length > 0) {
                await page.setCookie(...this.options.cookies)
            }

            const productUrl = await this.resolveProductUrl(page, url)

            await page.goto(productUrl, { waitUntil: "domcontentloaded" })

            await this.clickOnGenerateLinkButton(page)
            await this.tryWaitForAffiliateApiResponse(page)

            const affiliateUrl = await this.getAffiliateUrlFromPage(page)

            if (!affiliateUrl) {
                throw new Error("Não foi possível encontrar a URL de afiliado na página.")
            }

            return affiliateUrl
        } catch (error) {
            throw error
        } finally {
            await browser.close()
        }
    }
}
