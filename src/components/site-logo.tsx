import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site-config";
import { cn } from "@/lib/utils";

interface SiteLogoProps {
  href?: string;
  className?: string;
  lightClassName?: string;
  darkClassName?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function SiteLogo({
  href = "/",
  className,
  lightClassName,
  darkClassName,
  width = 216,
  height = 72,
  priority = false,
}: SiteLogoProps) {
  const content = (
    <>
      <Image
        src="/logos/logo-light.svg"
        alt={SITE_NAME}
        width={width}
        height={height}
        priority={priority}
        className={cn("h-auto w-auto dark:hidden", lightClassName)}
      />
      <Image
        src="/logos/logo-dark.svg"
        alt={SITE_NAME}
        width={width}
        height={height}
        priority={priority}
        className={cn("hidden h-auto w-auto dark:block", darkClassName)}
      />
    </>
  );

  if (!href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
