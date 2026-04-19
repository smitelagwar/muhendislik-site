export type ConcreteStatusTone = "ok" | "warn" | "fail";

export type ConcreteToolId =
  | "kolon-on-boyutlandirma"
  | "kiris-kesiti"
  | "doseme-kalinligi"
  | "pas-payi"
  | "taban-kesme-kuvveti";

export interface ConcreteStatus {
  tone: ConcreteStatusTone;
  label: string;
}

export interface ConcreteToolNavItem {
  id: ConcreteToolId;
  label: string;
  href: string;
}
