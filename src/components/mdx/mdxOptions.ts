import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import type { MDXRemoteProps } from "next-mdx-remote/rsc";

/**
 * Shared MDX compile options — pass as the `options` prop to every
 * `<MDXRemote>` call so $inline$ and $$block$$ LaTeX and GitHub-flavoured
 * markdown (tables, strikethrough, autolinks) render consistently across
 * insight cards, deep dives, and builder log entries.
 */
export const mdxOptions: MDXRemoteProps["options"] = {
  mdxOptions: {
    remarkPlugins: [remarkMath, remarkGfm],
    rehypePlugins: [rehypeKatex],
  },
};
