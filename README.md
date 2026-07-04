# Flappy Baixinho

Um mini-jogo web em Vite + TypeScript + Canvas inspirado em Flappy Bird, mas com o Luís a tentar voar pelo departamento de quartos da MÓVEA.

## Jogar

- `Espaço`, clique ou toque para bater asas.
- Passa entre roupeiros, camas e placas promocionais.
- O recorde fica guardado no `localStorage`.
- Se existir `public/luis.jpg`, a cara do Luís é usada dentro do personagem; caso contrário há fallback cartoon.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Vercel / StackBlitz

O projeto usa Vite padrão:

- Dev command: `npm run dev`
- Build command: `npm run build`
- Output directory: `dist`
