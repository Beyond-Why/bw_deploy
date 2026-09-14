import styles from "./MDXComponents.module.css";
import type { ComponentProps } from "react";

import React from "react";
import { interactiveComponents } from "@/lib/interactiveComponents";

/* ──────────────────────────────────────────────────────────────
   Custom MDX component map.
   Maps standard HTML elements to styled versions that use
   the design system tokens. Keeps things semantic and simple.
   ────────────────────────────────────────────────────────────── */

// Helper to extract text from ReactNode and create a slug for heading IDs
const generateSlug = (children: React.ReactNode): string => {
  if (typeof children === "string") {
    return children
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  if (Array.isArray(children)) {
    return children.map(generateSlug).join("-");
  }
  if (React.isValidElement(children)) {
    return generateSlug(children.props.children);
  }
  return "";
};

export const mdxComponents = {
  h1: (props: ComponentProps<"h1">) => (
    <h1 className={styles.h1} {...props} />
  ),
  h2: (props: ComponentProps<"h2">) => {
    const id = props.id || generateSlug(props.children);
    return <h2 id={id} className={styles.h2} {...props} />;
  },
  h3: (props: ComponentProps<"h3">) => {
    const id = props.id || generateSlug(props.children);
    return <h3 id={id} className={styles.h3} {...props} />;
  },
  h4: (props: ComponentProps<"h4">) => {
    const id = props.id || generateSlug(props.children);
    return <h4 id={id} className={styles.h4} {...props} />;
  },
  p: (props: ComponentProps<"p">) => (
    <p className={styles.p} {...props} />
  ),
  a: (props: ComponentProps<"a">) => (
    <a className={styles.a} {...props} />
  ),
  blockquote: (props: ComponentProps<"blockquote">) => (
    <blockquote className={styles.blockquote} {...props} />
  ),
  ul: (props: ComponentProps<"ul">) => (
    <ul className={styles.ul} {...props} />
  ),
  ol: (props: ComponentProps<"ol">) => (
    <ol className={styles.ol} {...props} />
  ),
  li: (props: ComponentProps<"li">) => (
    <li className={styles.li} {...props} />
  ),
  code: (props: ComponentProps<"code">) => {
    // Inline code vs code blocks
    const isBlock =
      typeof props.children === "string" && props.children.includes("\n");
    if (isBlock) {
      return <code className={styles.codeBlock} {...props} />;
    }
    return <code className={styles.codeInline} {...props} />;
  },
  pre: (props: ComponentProps<"pre">) => (
    <pre className={styles.pre} {...props} />
  ),
  hr: () => <hr className={styles.hr} />,
  img: (props: ComponentProps<"img">) => (
    <figure className={styles.figure}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.img} alt={props.alt || ""} {...props} />
      {props.alt && (
        <figcaption className={styles.figcaption}>{props.alt}</figcaption>
      )}
    </figure>
  ),
  strong: (props: ComponentProps<"strong">) => (
    <strong className={styles.strong} {...props} />
  ),
  em: (props: ComponentProps<"em">) => (
    <em className={styles.em} {...props} />
  ),
  ...interactiveComponents,
};
