// KaTeX stylesheet plus the site's overrides, imported only by routes that
// render MDX through mdxOptions (rehype-katex). Overrides come second so
// they win over katex.min.css's equal-specificity rules.
import "katex/dist/katex.min.css";
import "./katex-overrides.css";
