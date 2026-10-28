import { NATIVE_RIBBON_TABS, type NativeRibbonCommand } from "./ribbon-layout";

/** Product scope is independent of the preserved native research manifest.
 * User decision, 28 October 2026: no steel or steel connection workflows.
 */
const inScope = (command: NativeRibbonCommand): boolean => !/çelik/i.test(command.label) && !/STEEL/.test(command.symbol);
const commandsInScope = (commands: NativeRibbonCommand[]): NativeRibbonCommand[] => commands.filter(inScope).map(command => ({ ...command, children: commandsInScope(command.children) }));
export const PRODUCT_RIBBON_TABS = NATIVE_RIBBON_TABS
  .filter(tab => !["Çelik", "Birleşim"].includes(tab.label))
  .map(tab => ({ ...tab, panels: tab.panels.filter(panel => !/çelik/i.test(panel.label)).map(panel => ({ ...panel, commands: commandsInScope(panel.commands) })) }));
