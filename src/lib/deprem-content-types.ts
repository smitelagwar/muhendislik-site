export type DepremSeriesId =
  | "tbdy"
  | "tbdy-betonarme"
  | "ts500"
  | "mevcut-guclendirme"
  | "yapi-denetimi"
  | "yangin"
  | "otopark"
  | "imar"
  | "bep"
  | "su-zemin"
  | "engelsiz"
  | "eurocode"
  | "akustik"
  | "asansor"
  | "isg"
  | "cevre";

export type RegulationStatus = "in-force" | "standard" | "draft";

export interface RegulationStatusItem {
  id: string;
  title: string;
  status: RegulationStatus;
  statusLabel: string;
  verifiedAt: string;
  href: string;
  note: string;
}
