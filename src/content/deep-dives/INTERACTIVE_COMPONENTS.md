# Interactive Components in Deep Dive MDX

Deep-dive articles can embed interactive React components (canvas
demos, sliders, simulations) directly inside their `.mdx` files.

## Where files live

Each series gets its own `interactive/` folder:

```
src/content/deep-dives/{series-slug}/interactive/MyComponent.tsx
```

## Registering a component

1. Build the component in the series' `interactive/` folder, marked
   `"use client"`. Guard any browser-only work (canvas, pointer events,
   `window`) behind refs/effects so the component still renders safely
   during the server pass.
2. Register it in `src/lib/interactiveComponents.ts`:

```ts
MyComponent: dynamic(() =>
  import("@/content/deep-dives/{series-slug}/interactive/MyComponent")
),
```

3. That registry is merged into the shared MDX components map in
   `src/components/mdx/MDXComponents.tsx`, so it's available to every
   deep-dive article.

## Using it in MDX

```mdx
<MyComponent />
```

## Why no `ssr: false`

`MDXComponents.tsx` is a Server Component, and Next.js only allows the
`ssr: false` option on `dynamic()` inside a Client Component. `dynamic()`
without it still code-splits each component — it just means the
component's initial (unhydrated) render must be safe on the server,
which is why browser-only work belongs inside effects/handlers.
