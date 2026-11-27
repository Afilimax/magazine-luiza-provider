<a href="https://afilimax.net"><img src="https://raw.githubusercontent.com/Afilimax/.github/main/assets/npm-banner.svg" alt="Afilimax — Encontre a oferta. Gere o link. Divulgue sozinho." width="100%" /></a>

[![npm version](https://img.shields.io/npm/v/%40afilimax%2Fmagazine-luiza-provider?logo=npm)](https://www.npmjs.com/package/@afilimax/magazine-luiza-provider)
[![npm downloads](https://img.shields.io/npm/dm/%40afilimax%2Fmagazine-luiza-provider?logo=npm)](https://www.npmjs.com/package/@afilimax/magazine-luiza-provider)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/Afilimax/magazine-luiza-provider/blob/HEAD/LICENSE)
[![Website](https://img.shields.io/badge/website-afilimax.net-7857FF)](https://afilimax.net)

# @afilimax/magazine-luiza-provider

Provedor de afiliação para Magazine Luiza. Desenvolvido para Afilimax.

Este pacote utiliza automação de navegador (Puppeteer) para gerar links de afiliado do Magazine Luiza, integrando-se ao portal de afiliados.

## Instalação

```bash
npm install @afilimax/magazine-luiza-provider
```

## Uso

```typescript
import { MagazineLuizaProvider } from "@afilimax/magazine-luiza-provider";

const provider = new MagazineLuizaProvider({
  affiliateSlug: "seu-slug",
  cookies: [
    // Seus cookies de autenticação do portal Magalu
  ]
});

const affiliateUrl = await provider.createAffiliateUrl("https://www.magazineluiza.com.br/produto/123");
console.log(affiliateUrl);
```

## Requisitos

- Node.js 18+
- Puppeteer instalado (o pacote já inclui como dependência)

## Licença

MIT

---

## Automatize sua operação de afiliados

> Use este pacote para automatizar sua operação de afiliados. Conheça a plataforma Afilimax e transforme ofertas em links e divulgação automática.

[Conheça a Afilimax](https://afilimax.net) · [Pacote no npm](https://www.npmjs.com/package/@afilimax/magazine-luiza-provider) · [Repositório no GitHub](https://github.com/Afilimax/magazine-luiza-provider)
