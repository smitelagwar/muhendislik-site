import {
  Activity,
  Building2,
  CircleGauge,
  Compass,
  HardHat,
  ListChecks,
  Map,
  PanelsTopLeft,
  Ruler,
  Shield,
  Snowflake,
  Target,
  Scissors,
  Link,
  Timer,
  MoveHorizontal,
  Box,
  Layers,
  TrendingDown,
  Wrench,
  Zap,
  Trees,
  Calculator,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolIconKey } from "@/lib/tools-data";

interface ToolIconProps {
  iconKey: ToolIconKey;
  className: string;
}

export function ToolIcon({ iconKey, className }: ToolIconProps) {
  switch (iconKey) {
    case "rebar":
      return <CircleGauge className={cn("h-5 w-5", className)} />;
    case "column":
      return <Building2 className={cn("h-5 w-5", className)} />;
    case "beam":
      return <Ruler className={cn("h-5 w-5", className)} />;
    case "slab":
      return <PanelsTopLeft className={cn("h-5 w-5", className)} />;
    case "cover":
      return <Shield className={cn("h-5 w-5", className)} />;
    case "site":
      return <HardHat className={cn("h-5 w-5", className)} />;
    case "insulation":
      return <Snowflake className={cn("h-5 w-5", className)} />;
    case "plot":
      return <Map className={cn("h-5 w-5", className)} />;
    case "earthquake":
      return <Activity className={cn("h-5 w-5", className)} />;
    case "check":
      return <ListChecks className={cn("h-5 w-5", className)} />;
    case "soil":
      return <Compass className={cn("h-5 w-5", className)} />;
    case "punching":
      return <Target className={cn("h-5 w-5", className)} />;
    case "shear":
      return <Scissors className={cn("h-5 w-5", className)} />;
    case "splice":
      return <Link className={cn("h-5 w-5", className)} />;
    case "period":
      return <Timer className={cn("h-5 w-5", className)} />;
    case "drift":
      return <MoveHorizontal className={cn("h-5 w-5", className)} />;
    case "foundation":
      return <Box className={cn("h-5 w-5", className)} />;
    case "retaining":
      return <Layers className={cn("h-5 w-5", className)} />;
    case "slope":
      return <TrendingDown className={cn("h-5 w-5", className)} />;
    case "steel":
      return <Wrench className={cn("h-5 w-5", className)} />;
    case "bolt":
      return <Zap className={cn("h-5 w-5", className)} />;
    case "timber":
      return <Trees className={cn("h-5 w-5", className)} />;
    case "quantity":
      return <Calculator className={cn("h-5 w-5", className)} />;
    case "earthwork":
      return <Truck className={cn("h-5 w-5", className)} />;
    default:
      return <CircleGauge className={cn("h-5 w-5", className)} />;
  }
}
