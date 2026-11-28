<a href="https://afilimax.net"><img src="https://raw.githubusercontent.com/Afilimax/.github/main/assets/npm-banner.svg" alt="Afilimax — Encontre a oferta. Gere o link. Divulgue sozinho." width="100%" /></a>

[![npm version](https://img.shields.io/npm/v/%40afilimax%2Fmagazine-luiza-provider?logo=npm)](https://www.npmjs.com/package/@afilimax/magazine-luiza-provider)
[![npm downloads](https://img.shields.io/npm/dm/%40afilimax%2Fmagazine-luiza-provider?logo=npm)](https://www.npmjs.com/package/@afilimax/magazine-luiza-provider)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/Afilimax/magazine-luiza-provider/blob/HEAD/LICENSE)
[![Website](https://img.shields.io/badge/website-afilimax.net-7857FF)](https://afilimax.net)

# @afilimax/magazine-luiza-provider

Provedor de links de afiliado da Magazine Luiza para o ecossistema Afilimax. O pacote automatiza o portal Magazine Você com Puppeteer e uma sessão autenticada para converter URLs de produtos em links de divulgação.

## Recursos

- Geração de links pelo portal de afiliados Magazine Você.
- Automação de navegador com Puppeteer e plugin stealth.
- Conversão de URLs do domínio principal para o slug do afiliado.
- Correção do slug em URLs de afiliado já existentes.
- Expansão de links curtos `magazineluiza.onelink.me` antes da conversão.
- Uso de cookies exportados de uma sessão autenticada.
- Fechamento do navegador após cada chamada, inclusive em caso de erro.
- Compatibilidade com `AffiliateProvider` e `AffiliateManager`.

## Instalação

```bash
npm install @afilimax/magazine-luiza-provider @afilimax/core
```

O `@afilimax/core` fornece a classe `AffiliateProvider` usada pelo pacote. O Puppeteer e os componentes de automação são instalados como dependências.

## Como usar

Carregue os cookies de um arquivo local fora do controle de versão e informe o slug da sua loja de afiliado:

```typescript
import { readFileSync } from "node:fs"
import { MagazineLuizaProvider } from "@afilimax/magazine-luiza-provider"

const provider = new MagazineLuizaProvider({
    affiliateSlug: process.env.MAGAZINE_LUIZA_AFFILIATE_SLUG!,
    cookies: JSON.parse(readFileSync("cookies.json", "utf8")),
})

async function main() {
    const productUrl = "https://www.magazineluiza.com.br/produto/123"

    try {
        const affiliateUrl = await provider.createAffiliateUrl(productUrl)
        console.log("Affiliate URL:", affiliateUrl)
    } catch (error) {
        console.error("Failed to create affiliate URL:", error)
    }
}

main()
```

Cada chamada abre uma instância do navegador, gera o link e fecha o navegador automaticamente.

### Uso com AffiliateManager

```typescript
import { AffiliateManager } from "@afilimax/core"
import { MagazineLuizaProvider } from "@afilimax/magazine-luiza-provider"

const manager = new AffiliateManager([
    new MagazineLuizaProvider({
        affiliateSlug: process.env.MAGAZINE_LUIZA_AFFILIATE_SLUG!,
        cookies: JSON.parse(readFileSync("cookies.json", "utf8")),
    }),
])

const affiliateUrl = await manager.createAffiliateUrl("https://www.magazineluiza.com.br/produto/123")

console.log("Affiliate URL:", affiliateUrl)
```

O gerenciador retorna `null` quando nenhum provedor registrado aceita a URL.

## Configuração

A interface `MagazineLuizaProviderOptions` aceita:

| Opção | Tipo | Obrigatória | Descrição |
| :--- | :--- | :--- | :--- |
| `cookies` | `Cookie[]` | Sim | Cookies da sessão autenticada no portal de afiliados. |
| `affiliateSlug` | `string` | Sim | Slug da loja usado nas URLs do Magazine Você. |
| `puppeteer` | `any` | Não | Opções adicionais repassadas a `puppeteer.launch`. |

As opções de `puppeteer` são aplicadas sobre os valores padrão. O provedor procura uma instalação local de Chrome nos caminhos conhecidos e, quando não a encontra, usa a resolução padrão do Puppeteer.

### Como obter os cookies

1. Faça login na conta participante do programa de afiliados da Magazine Luiza.
2. Abra o portal Magazine Você e confirme que a página de geração de links está acessível.
3. Exporte os cookies da sessão em JSON com uma extensão de navegador.
4. Salve o conteúdo em `cookies.json` e mantenha o arquivo fora do controle de versão.

Os cookies representam acesso à sua conta. Não os compartilhe nem os inclua no código.

## Referência da API

### `new MagazineLuizaProvider(options)`

Cria o provedor e prepara a instância do Puppeteer com o plugin stealth.

### `createAffiliateUrl(url: string): Promise<string>`

Resolve a URL de origem, aplica o slug configurado, abre a página de afiliado e retorna o endereço exibido no campo de cópia. O método lança um erro quando a navegação, os seletores ou a geração do link falham.

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `url` | `string` | URL do produto, página de afiliado ou link curto suportado. |

### `supportsUrl(url: string): boolean`

Verifica se a URL contém um dos domínios suportados.

### Domínios suportados

- `magazineluiza.com.br`
- `magazinevoce.com.br`
- `magazineluiza.onelink.me`

## Desenvolvimento

Instale as dependências com `npm install`. Os scripts disponíveis são:

| Comando | Finalidade |
| :--- | :--- |
| `npm run dev` | Executa `src/index.ts` com `ts-node`. |
| `npm run build` | Compila o TypeScript para `dist/`. |
| `npm test` | Executa os testes uma vez com Vitest. |
| `npm run test:watch` | Executa os testes em modo de observação. |
| `npm run test:cov` | Executa os testes com cobertura. |
| `npm run lint` | Executa o ESLint com correção automática. |
| `npm run format` | Formata os arquivos de `src/` com Prettier. |

O teste prático incluído em `npm test` lê `__tests__/auth.json`. Ele é ignorado quando o arquivo não existe ou está incompleto:

```json
{
    "cookies": [
        {
            "name": "session",
            "value": "your-session-cookie",
            "domain": ".magazinevoce.com.br",
            "path": "/"
        }
    ],
    "affiliateSlug": "your-affiliate-slug"
}
```

Não versione esse arquivo nem credenciais reais.

## Licença

Distribuído sob a licença [MIT](./LICENSE).

---

## Automatize sua operação de afiliados

> Use este pacote para automatizar sua operação de afiliados. Conheça a plataforma Afilimax e transforme ofertas em links e divulgação automática.

[Conheça a Afilimax](https://afilimax.net) · [Pacote no npm](https://www.npmjs.com/package/@afilimax/magazine-luiza-provider) · [Repositório no GitHub](https://github.com/Afilimax/magazine-luiza-provider)
