import { DokWorkspaceSessionProvider } from "@/components/dokumantasyon/drive-v3/workspace-session";
export default function DokumantasyonLayout({ children }: { children: React.ReactNode }) {
  return <DokWorkspaceSessionProvider>{children}</DokWorkspaceSessionProvider>;
}
