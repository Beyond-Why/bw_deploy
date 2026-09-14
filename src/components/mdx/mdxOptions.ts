import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { MDXRemoteProps } from "next-mdx-remote/rsc";

/**
 * Shared MDX compile options — pass as the `options` prop to every
 * `<MDXRemote>` call so $inline$ and $$block$$ LaTeX renders consistently
 * across insight cards, deep dives, and builder log entries.
 */
export const mdxOptions: MDXRemoteProps["options"] = {
  mdxOptions: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
};
