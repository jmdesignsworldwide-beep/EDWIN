# Constructora Edwin — Sistema de gestión de obras

Sistema de gestión para la **Constructora Edwin Espaillat** (Santiago, RD).
Este repositorio contiene la **Tanda 1: Cimientos** — el setup del proyecto, el
sistema de diseño premium, los primitivos animados reutilizables, el login y el
layout (shell). Los módulos de negocio llegan en olas posteriores.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (tokens de diseño centralizados)
- **Framer Motion** (toda la animación)
- **lucide-react** (iconos)
- **next-themes** (tema recordado)
- **Supabase** — estructura preparada, **sin conexión real todavía**

## Requisitos

- Node.js 20+
- npm 10+

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # rellena cuando conectes Supabase
npm run dev                  # http://localhost:3000
```

Scripts:

| Script            | Descripción                       |
| ----------------- | --------------------------------- |
| `npm run dev`     | Servidor de desarrollo            |
| `npm run build`   | Build de producción               |
| `npm run start`   | Sirve el build                    |
| `npm run lint`    | ESLint (next/core-web-vitals)     |
| `npm run typecheck` | Comprobación de tipos           |

## Seguridad (Fort Knox desde línea uno)

- `.env.local` está en `.gitignore` — **jamás** se sube.
- El acceso `service_role` vive en `src/lib/supabase/server.ts` con
  `import "server-only"`: si un componente cliente lo importa, el build falla.
- Sin secretos hardcodeados ni llaves en commits.
- Cabeceras de seguridad configuradas en `next.config.mjs`.

## Sistema de diseño

- **Dos temas premium**: oscuro (near-black con auroras que respiran) y claro
  (crema cálido elegante, no una inversión). Toggle sol/luna en el header,
  preferencia recordada.
- **Marca**: dark premium + dorado casco de obra `#f0b429` + acento esmeralda.
- Glassmorphism sutil, sombras en capas, glow en elementos activos.
- **Tokens centralizados**: variables CSS por tema en
  `src/app/globals.css`, expuestas a Tailwind en `tailwind.config.ts` y a
  TypeScript en `src/lib/design-tokens.ts`.
- **Contraste cuidado en tema claro**: el dorado se oscurece a ámbar en crema
  para que nunca quede texto invisible.

## Primitivos animados

En `src/components/primitives/` (todos respetan `prefers-reduced-motion`):

- **`Reveal` / `Stagger`** — entrada en cascada con stagger + spring.
- **`MagneticCard`** — hover con elevación + tilt magnético.
- **`CountUp`** — números que animan al entrar en vista.
- **`ProgressBar`** — barra que se llena animándose.
- **`KPI`** — tarjeta base de métrica (compone los anteriores).

## Estructura

```
src/
  app/
    layout.tsx            # root: temas + aurora + fuente
    page.tsx              # raíz → /login
    login/                # pantalla de ingreso
    (app)/                # shell autenticado
      layout.tsx          # Sidebar + Header
      template.tsx        # transición de sección
      dashboard/          # panel (vitrina de primitivos)
      <módulos>/          # placeholders navegables (16 módulos)
  components/
    primitives/           # Reveal, MagneticCard, CountUp, ProgressBar, KPI
    layout/               # Sidebar, Header, Shell, Aurora, Logo…
    theme/                # ThemeProvider, ThemeToggle
    login/                # LoginForm
  lib/
    design-tokens.ts      # tokens en TS
    navigation.ts         # módulos del sidebar
    supabase/             # server-only + client (estructura, sin conexión)
    utils.ts
```

## Alcance

Este sistema gestiona las **obras** de Edwin. **No** maneja precios de
contrato, cobros de JM Design ni datos de pago del cliente — eso queda fuera de
la herramienta.

---

_JM Design · Santiago, RD · Tanda 1 de arranque._
