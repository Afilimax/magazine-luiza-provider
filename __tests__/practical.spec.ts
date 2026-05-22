import { describe, it, expect } from "vitest"
import { MagazineLuizaProvider } from "../src/index"
import fs from "node:fs"
import path from "node:path"

const AUTH_PATH = path.join(__dirname, "auth.json")

let AUTH_DATA = {
    cookies: [],
    affiliateSlug: ""
}

if (fs.existsSync(AUTH_PATH)) {
    try {
        AUTH_DATA = JSON.parse(fs.readFileSync(AUTH_PATH, "utf-8"))
    } catch (error: any) {
        console.error("❌ Erro ao ler auth.json:", error.message)
    }
}

describe("MagazineLuizaProvider Practical Test", () => {
    it("should create a real affiliate URL (integration)", async () => {
        if (!AUTH_DATA.affiliateSlug || AUTH_DATA.cookies.length === 0) {
            console.warn(`⚠️ Pulando teste prático: Arquivo auth.json não configurado corretamente em: ${AUTH_PATH}`)
            return
        }

        const provider = new MagazineLuizaProvider(AUTH_DATA)

        const testUrl = "https://www.magazineluiza.com.br/smartphone-samsung-a07-128gb-preto-4gb-ram-tela-67-cam-dupla-selfie-8mp/p/240466500/te/ga07/?seller_id=magazineluiza"

        try {
            console.log(`Gerando link para: ${testUrl}`)
            const affiliateUrl = await provider.createAffiliateUrl(testUrl)

            expect(affiliateUrl).toMatch(/https:\/\/magazineluiza\.onelink\.me\/.*/)
            
            console.log("✅ Sucesso!")
            console.log(`🔗 Link gerado: ${affiliateUrl}`)
        } catch (error: any) {
            console.error("❌ Falha no teste prático:")
            console.error(error.message)
            throw error
        }
    }, 60000) // Timeout maior para automação de navegador
})
