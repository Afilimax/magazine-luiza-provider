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