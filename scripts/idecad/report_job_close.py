"""Close the ideCAD and viewer processes belonging to one finished job."""
import json
import os
from pathlib import Path
import sys
from report_job import DesktopDriver, atomic_json, cleanup_job_process, desktop_lock


def main() -> int:
    if len(sys.argv) != 3:
        return 2
    job_id, root = sys.argv[1:]
    if len(job_id) != 32 or any(c not in "0123456789abcdef" for c in job_id):
        return 2
    directory = Path(root) / job_id
    receipt_path = directory / "receipt.json"
    receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
    if receipt.get("jobId") != job_id or receipt.get("status") != "ready":
        return 2
    driver = DesktopDriver(Path(__file__).parent / "desktop.py", directory / "session.json", directory / "gui")
    lock = Path(os.environ["LOCALAPPDATA"]) / "Hsyncad" / "idecad-report"
    with desktop_lock(lock):
        cleanup = cleanup_job_process(driver, receipt.get("idecadPid"))
        if any(word in cleanup for word in ("identity_unavailable", "identity_changed", "termination_failed", "unverified")):
            raise RuntimeError("İşe ait süreçler güvenle kapatılamadı")
        receipt.update({"status": "closed", "preview": "closed", "cleanup": cleanup})
        atomic_json(receipt_path, receipt)
    print(json.dumps({"jobId": job_id, "status": "closed"}, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
