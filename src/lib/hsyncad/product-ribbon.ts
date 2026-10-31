import { NATIVE_RIBBON_TABS, type NativeRibbonCommand } from "./ribbon-layout";

/** Product scope is independent of the preserved native research manifest.
 * User decision, 28 October 2026: reinforced concrete structural elements only.
 * Steel, piles, domes, vaults, purlins, and scaffolding are pruned out.
 * Beam-column joint safety checks (12260, 11910) are strictly preserved.
 */
function isBeamColumnJoint(command: NativeRibbonCommand): boolean {
  if (command.commandId === 12260 || command.commandId === 11910) return true;
  if (/kolon-kiriş\s+birleşim/i.test(command.label)) return true;
  if (/COLBEAM_JOIN/i.test(command.symbol)) return true;
  return false;
}

/**
 * Milestone 4: Preserves analysis visualization commands:
 * 11820 (Structure / Wireframe), 11836 (Modal), 11837 (1.4G+1.6Q),
 * 11838 (Frame Axial Force N), 11839 (Frame Shear V2), 11840 (Frame Moment M3),
 * 11841, 11842, 11845 (Shear wall forces), 12109 (Capacity DCR), 12078 (Failures), 12194 (Solid model).
 */
export function isAnalysisVisualizationCommand(commandId: number | null | undefined): boolean {
  if (commandId == null) return false;
  return [11820, 11836, 11837, 11838, 11839, 11840, 11841, 11842, 11845, 12109, 12078, 12194].includes(commandId);
}

const inScope = (command: NativeRibbonCommand): boolean => {
  if (isBeamColumnJoint(command)) return true;
  if (isAnalysisVisualizationCommand(command.commandId)) return true;
  const label = (command.label || "").toLocaleLowerCase("tr-TR");
  const symbol = command.symbol || "";
  if (label.includes("çelik") || /STEEL/i.test(symbol)) return false;
  if (label.includes("kazık") || /PILE/i.test(symbol)) return false;
  if (label.includes("kubbe") || /DOME/i.test(symbol)) return false;
  if (label.includes("tonoz") || /VAULT/i.test(symbol)) return false;
  if (label.includes("aşık") || /PURLIN/i.test(symbol)) return false;
  if (label.includes("iskele") || /SCAFFOLD/i.test(symbol)) return false;
  return true;
};

const commandsInScope = (commands: NativeRibbonCommand[]): NativeRibbonCommand[] =>
  commands.filter(inScope).map(command => ({ ...command, children: commandsInScope(command.children) }));

export const PRODUCT_RIBBON_TABS = NATIVE_RIBBON_TABS
  .filter(tab => !["Çelik", "Birleşim"].includes(tab.label))
  .map(tab => ({
    ...tab,
    panels: tab.panels
      .filter(panel => !/çelik/i.test(panel.label))
      .map(panel => ({ ...panel, commands: commandsInScope(panel.commands) }))
  }));
