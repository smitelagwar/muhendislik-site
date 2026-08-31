import "react";

declare module "react" {
  interface SVGAttributes<T> {
    [key: `data-${string}`]: string | number | boolean | undefined;
  }
}
