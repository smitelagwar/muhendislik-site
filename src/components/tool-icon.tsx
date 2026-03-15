import { Building2, CircleGauge, HardHat, Map, PanelsTopLeft, Ruler, Shield, Snowflake } from "lucide-react";
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
        default:
            return <CircleGauge className={cn("h-5 w-5", className)} />;
    }
}
