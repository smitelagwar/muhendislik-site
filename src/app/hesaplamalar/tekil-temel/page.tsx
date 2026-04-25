import type { Metadata } from "next";
import { IsolatedFootingClient } from "./isolated-footing-client";

export const metadata: Metadata = {
  title: "Tekil Temel Hesabı | TS 500 Betonarme Hesap Araçları",
  description:
    "TS 500 standartlarına göre tekil temel boyutlandırması, zemin emniyet gerilmesi, delme kesme ve donatı hesabını kolayca yapın.",
  alternates: {
    canonical: "/hesaplamalar/tekil-temel",
  },
};

export default function IsolatedFootingPage() {
  return <IsolatedFootingClient />;
}
