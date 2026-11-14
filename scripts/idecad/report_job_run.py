"""Private subprocess entry point, invoked only by the local Hsyncad host."""
from pathlib import Path
import json
import os
import shutil
import sys
from report_job import run_job


def main() -> int:
    if len(sys.argv) != 4:
        return 2
    job_id, root, staged_source = sys.argv[1:]
    exe = Path(r"C:\Program Files\ideCAD\ideCAD Statik 11 Deneme\ideCAD_Statik_11_Deneme.exe")
    try:
        receipt = run_job(job_id, Path(root), Path(staged_source), exe)
        print(json.dumps(receipt, ensure_ascii=False))
        return 0
    except Exception as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1
    finally:
        source = Path(staged_source)
        staging = Path(os.environ.get("LOCALAPPDATA", "")) / "Hsyncad" / "idecad-report" / "staging"
        if (source.name == "source.ide10" and source.parent.name.startswith("upload-")
                and source.parent.parent.resolve() == staging.resolve() and not source.parent.is_symlink()):
            shutil.rmtree(source.parent, ignore_errors=True)

if __name__ == "__main__":
    raise SystemExit(main())
