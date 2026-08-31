import * as React from "react";

export function CadLineWeightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}>
      <path d="M4 6h16" strokeWidth="1" strokeLinecap="round" />
      <path d="M4 12h16" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 18h16" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
