// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AUTODESK APS CAD GÖRÜNTÜLEYİCİ (CAD VIEWER)
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import {
  Compass,
  Download,
  AlertCircle,
  Loader2,
  Box,
  FileCode2,
  Info,
  ExternalLink,
  ShieldAlert,
  HardDrive,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "../ui-helpers";
import { StudioCommandButton } from "../studio/studio-command-button";

interface DokCadViewerProps {
  accessUrl: string;
  displayName: string;
  fileId: string;
  extension: string;
  sizeBytes: number;
}

export function DokCadViewer({
  accessUrl,
  displayName,
  fileId,
  extension,
  sizeBytes,
}: DokCadViewerProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [cadStatus, setCadStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. CAD Durumunu API'den Sorgula
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/dokumantasyon/files/${fileId}/cad`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          setCadStatus(data);
        } else {
          setError(data.error || "CAD önizleme durumu alınamadı.");
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("CAD durumu alma hatası:", err);
        setError("CAD durumu sorgulanırken sunucu ile iletişim kurulamadı.");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fileId]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = accessUrl;
    link.download = displayName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isConfigured = cadStatus?.status === "ready" && !!cadStatus?.viewerToken;

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950 text-zinc-100 select-none">
      {/* CAD Stüdyo Araç Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs backdrop-blur-md z-30">
        {/* Sol Alan: CAD Format Rozeti */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-400">
            <Compass className="h-4 w-4 text-amber-500" />
            <span>CAD {extension.replace(".", "").toUpperCase()}</span>
          </span>

          <div className="h-4 w-px bg-zinc-700 mx-1" />

          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
              isConfigured
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
          >
            <Box className="h-3 w-3" />
            <span>
              {isConfigured ? "Autodesk APS (Canlı)" : "APS Lisans Yapılandırması Bekleniyor"}
            </span>
          </span>
        </div>

        {/* Sağ Alan: İndirme Butonu */}
        <div className="flex items-center gap-2">
          <StudioCommandButton
            commandId="cad.download"
            onClick={handleDownload}
            className="h-7 gap-1.5 bg-amber-500 px-3 text-[11px] font-bold text-zinc-950 hover:bg-amber-400 shadow-sm"
            icon={<Download className="h-3.5 w-3.5" />}
            label={`${extension.replace(".", "").toUpperCase()} İndir`}
          />
        </div>
      </div>

      {/* Ana CAD Çalışma Alanı */}
      <div className="relative flex flex-1 overflow-auto items-center justify-center p-4 sm:p-8 bg-radial from-zinc-900 to-zinc-950">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <Loader2 className="h-9 w-9 animate-spin text-amber-500 mb-3" />
            <span className="text-sm font-medium">CAD model durumu denetleniyor...</span>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-md rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center text-red-400 shadow-xl backdrop-blur-md">
            <AlertCircle className="mx-auto h-9 w-9 text-red-500 mb-2" />
            <h3 className="text-sm font-bold text-red-300">CAD Sunucu Hatası</h3>
            <p className="mt-1 text-xs text-zinc-400">{error}</p>
          </div>
        )}

        {!loading && !error && !isConfigured && (
          <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-500/30 bg-amber-500/10 text-amber-500 shadow-inner">
              <Compass className="h-10 w-10 text-amber-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-zinc-100 sm:text-xl">{displayName}</h2>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Bu dosya orijinal formatında saklanmaktadır. Web tabanlı 2D/3D model görüntüleme için Autodesk Platform Services (APS) ortam anahtarları gereklidir.
              </p>
            </div>

            {/* Dosya Metadata İstatistikleri */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">Format</span>
                <span className="text-xs font-semibold text-amber-400">
                  AutoCAD ({extension.toUpperCase()})
                </span>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">Boyut</span>
                <span className="text-xs font-semibold text-zinc-200">{formatBytes(sizeBytes)}</span>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">Durum</span>
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  <span>İndirmeye Hazır</span>
                </span>
              </div>
            </div>

            {/* Birincil İndirme Butonu */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={handleDownload}
                className="w-full sm:w-auto gap-2 bg-amber-500 px-6 py-2.5 font-bold text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/10"
              >
                <Download className="h-4 w-4" />
                <span>Dosyayı İndir ve AutoCAD ile Aç</span>
              </Button>
            </div>

            {/* Teknik Bilgilendirme Notu */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4 text-left text-[11px] text-zinc-400 leading-relaxed">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-300 mb-1">
                <Info className="h-3.5 w-3.5 text-blue-400" />
                <span>Web CAD Önizleme Entegrasyonu Hakkında</span>
              </div>
              <p>
                Tarayıcı içinde interaktif 2D/3D model incelemesi, katman yönetimi ve ölçülendirme için sunucuda <code className="text-amber-400 font-mono">APS_CLIENT_ID</code> ve <code className="text-amber-400 font-mono">APS_CLIENT_SECRET</code> ortam değişkenlerinin yapılandırılması gerekmektedir.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && isConfigured && (
          <div className="flex flex-1 flex-col items-center justify-center h-full w-full">
            <div className="text-xs text-zinc-400">
              Autodesk APS Model Görüntüleyici Yükleniyor...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
