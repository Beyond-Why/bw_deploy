import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "solid" | "line";

function cls(variant: Variant, extra?: string) {
  return [styles.btn, styles[variant], extra].filter(Boolean).join(" ");
}

/** v2 button as a link: 44px tall, radius 10, solid (ink fill) or line (hairline border). */
export function ButtonLink({
  variant = "solid",
  className,
  children,
  ...rest
}: { variant?: Variant; children: ReactNode } & ComponentProps<typeof Link>) {
  return (
    <Link className={cls(variant, className)} {...rest}>
      {children}
    </Link>
  );
}

/** v2 button element. */
export function Button({
  variant = "line",
  className,
  type = "button",
  ...rest
}: { variant?: Variant } & ComponentProps<"button">) {
  return <button type={type} className={cls(variant, className)} {...rest} />;
}

/** Square 44px icon-only button. Pass an aria-label. */
export function IconButton({
  className,
  type = "button",
  ...rest
}: ComponentProps<"button"> & { "aria-label": string }) {
  return <button type={type} className={[styles.square, className].filter(Boolean).join(" ")} {...rest} />;
}
