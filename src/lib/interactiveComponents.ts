import dynamic from "next/dynamic";

/**
 * Interactive component registry for MDX deep-dive articles.
 *
 * To add a new interactive element:
 * 1. Drop the .tsx file into the relevant series' interactive/ folder
 *    e.g. src/content/deep-dives/{series-slug}/interactive/MyComponent.tsx
 *    (mark that file "use client" — it should own any browser-only work
 *    itself, guarded behind refs/effects so it renders safely on the server too)
 * 2. Add one line here:
 *    MyComponent: dynamic(() => import('@/content/deep-dives/{series-slug}/interactive/MyComponent')),
 * 3. Use <MyComponent /> anywhere in that series' .mdx files
 *
 * This file is consumed from a Server Component (MDXComponents.tsx), so
 * `dynamic(..., { ssr: false })` can't be used here — Next.js only allows
 * that option inside a Client Component. `dynamic()` without it still
 * code-splits each component; browser-only work (canvas, pointer events)
 * belongs inside the component's own effects/handlers, not at module scope.
 */

export const interactiveComponents = {
  FieldSlider: dynamic(() =>
    import(
      "@/content/deep-dives/the-field-that-powers-the-world/interactive/FieldSlider"
    )
  ),
  LoopVideo: dynamic(() =>
    import(
      "@/content/deep-dives/the-field-that-powers-the-world/interactive/LoopVideo"
    )
  ),
};
