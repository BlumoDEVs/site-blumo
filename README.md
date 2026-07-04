# LUÍS: O REI DOS QUARTOS

Jogo web arcade 2D em Vite + TypeScript + Canvas, inspirado na fotografia `public/luis.jpg`.

## Como correr

```bash
npm run dev
```

Abrir o URL indicado pelo Vite. O projeto usa Vite, TypeScript e Canvas, sem assets externos obrigatórios.

## StackBlitz e Vercel

- StackBlitz: abrir o projeto e correr `npm run dev`.
- Vercel: importar o repositório; `vercel.json` usa `npm run build` e publica `dist`.

## Build de produção

```bash
npm run build
npm run preview
```

## Controlos

- **WASD** ou **setas** para mover o Luís.
- **Espaço** ou **E** para organizar objetos, ajudar clientes e ativar minijogos.
- No minijogo da cama, carrega repetidamente em **Espaço** antes do tempo acabar.

## Funcionalidades incluídas

- Movimento top-down com colisões de limites.
- Pontuação, temporizador e barra de Caos da Loja.
- Clientes com pedidos absurdos e paciência.
- Objetos para apanhar/organizar: almofadas, camas, etiquetas, roupeiros e power-ups.
- Power-ups cómicos: Café de Máquina, Chave Allen Lendária, Modo Sorriso Profissional, Pausa de 5 Minutos e Crachá Dourado.
- Minijogo jogável de montar cama.
- Ecrã inicial, instruções, ranking cómico local estático e ecrã final.
- Visual premium fictício da loja MÓVEA, sem marcas reais.

> Nota: se `public/luis.jpg` estiver presente, o jogo usa-o como referência/elemento de power-up. O Luís também é desenhado em cartoon diretamente no Canvas para garantir que o jogo funciona sem assets externos.
