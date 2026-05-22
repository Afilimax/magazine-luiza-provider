import { expect, it, describe } from "vitest"
import { MagazineLuizaProvider } from "../src/index"

describe("MagazineLuizaProvider", () => {
    const options = {
        cookies: [],
        affiliateSlug: "test-slug"
    }
    const provider = new MagazineLuizaProvider(options)

    it("should have the correct name", () => {
        expect(provider.name).toBe("Magazine Luiza")
    })

    it("should have valid domains", () => {
        expect(provider.domains).toContain("magazineluiza.com.br")
        expect(provider.domains).toContain("magazinevoce.com.br")
        expect(provider.domains).toContain("magazineluiza.onelink.me")
    })

    it("should support valid urls", () => {
        expect(provider.supportsUrl("https://www.magazineluiza.com.br/smartphone-samsung/p/123")).toBe(true)
        expect(provider.supportsUrl("https://magazinevoce.com.br/test-slug/p/123")).toBe(true)
        expect(provider.supportsUrl("https://magazineluiza.onelink.me/123")).toBe(true)
    })

    it("should not support invalid urls", () => {
        expect(provider.supportsUrl("https://www.google.com")).toBe(false)
    })
})
