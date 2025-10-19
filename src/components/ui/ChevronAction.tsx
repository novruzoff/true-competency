// src/components/ui/ChevronAction.tsx
"use client";

import Link from "next/link";
import React from "react";

function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

export function IconChevronRight(props: React.SVGProps<SVGSVGElement>) {
  const { className, ...rest } = props;
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      aria-hidden
      className={className}
      {...rest}
    >
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Variant = "neutral" | "accent";

type Props = {
  href?: string;
  onClick?: () => void;
  title?: string;
  variant?: Variant;
  className?: string;
};

/** Fixed 32×32, rounded-xl (same as your old <Link />), no size changes on hover */
export function ChevronAction({
  href,
  onClick,
  title,
  variant = "neutral",
  className,
}: Props) {
  const base =
    "inline-flex items-center justify-center w-8 h-8 rounded-xl transition focus:outline-none";

  const style =
    variant === "accent"
      ? "bg-[var(--accent)] text-white hover:opacity-90"
      : "border border-[var(--border)] bg-[var(--field)] text-[var(--foreground)] hover:bg-[var(--surface)]";

  const classes = cx(base, style, className);

  const content = <IconChevronRight />;

  return href ? (
    <Link href={href} className={classes} title={title ?? "Open"}>
      {content}
    </Link>
  ) : (
    <button
      type="button"
      onClick={onClick}
      className={classes}
      title={title ?? "Action"}
    >
      {content}
    </button>
  );
}
