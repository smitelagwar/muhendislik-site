"""Read a local receipt and recheck the viewer while claiming it is ready."""
import json
import os
from pathlib import Path
import sys
from report_job import list_viewers, digest


def main() -> int:
    if len(sys.argv) != 3:
        return 2
    job_id, root = sys.argv[1:]
    if len(job_id) != 32 or any(c not in "0123456789abcdef" for c in job_id):
        return 2
    directory = Path(root) / job_id
    receipt = json.loads((directory / "receipt.json").read_text(encoding="utf-8"))
    if receipt.get("jobId") != job_id:
        return 1
    if receipt.get("status") == "ready":
        preview = receipt.get("preview", {})
        try:
            live = [v for v in list_viewers() if v.get("pid") == preview.get("viewerPid")
                    and v.get("parent") == receipt.get("idecadPid") and v.get("startedMs") == preview.get("viewerStartedMs")
                    and v.get("hwnd") and "iderpt.tmp" in v.get("title", "").casefold()]
            report = Path(os.environ["PROGRAMDATA"]) / "ideCAD11Trial" / "iderpt.tmp"
            if len(live) != 1 or not report.is_file() or report.stat().st_mtime_ns // 1_000_000 != preview.get("reportModifiedMs"):
                receipt["status"] = "preview_closed_or_stale"
                preview["status"] = "closed_or_stale"
            elif digest(directory / "source.ide10") != receipt.get("sourceSha256"):
                receipt["status"] = "source_changed"
                preview["status"] = "source_changed"
        except Exception:
            receipt["status"] = "preview_unknown"
            if isinstance(preview, dict): preview["status"] = "unknown"
    # Do not expose raw exceptions: they may contain server-side paths.
    if receipt.get("error"):
        safe = {"ideCAD masaüstü veya ideRAPOR şu anda kullanımda", "Masaüstünde başka bir rapor işi çalışıyor",
                "Merdiven bağlantısı seçimi bekleniyor", "İş kullanıcı tarafından iptal edildi",
                "Analiz 8 dakikalık zaman sınırını aştı", "Rapor önizlemesi 3 dakikada doğrulanamadı",
                "Hedef aktif kat ideCAD içinde bulunamadı", "Kat listesi menüsü açılamadı",
                "Aktif kat kapsamı seçilemedi"}
        err_text = str(receipt["error"])
        if err_text not in safe and not err_text.startswith("Hedef aktif kat ideCAD içinde bulunamadı:"):
            receipt["error"] = "Yerel rapor işi tamamlanamadı; yerel iş kaydını inceleyin."
    print(json.dumps(receipt, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
