"""Protected Hybrid OS gates: execute real project tests with bounded process ownership."""
from pathlib import Path
import json,subprocess,tempfile,unittest,shutil
ROOT=Path(__file__).resolve().parents[1]
class Checks(unittest.TestCase):
 def invoke(self,args,seconds=300,marker=None):
  with tempfile.TemporaryDirectory(prefix="hsyncad-hybrid-") as temp:
   base=Path(temp);job=dict(executable=shutil.which("node"),args=args,cwd=str(ROOT),timeoutMs=seconds*1000,outputDir=str(base/"result"))
   (base/"job.json").write_text(json.dumps(job),encoding="utf8")
   run=subprocess.run([shutil.which("node"),str(ROOT/"scripts/hsyncad/run-owned-command.mjs"),str(base/"job.json")],cwd=ROOT,capture_output=True,timeout=seconds+20)
   result=json.loads((base/"result/result.json").read_text(encoding="utf8"));out=(base/"result/stdout.log").read_text(encoding="utf8");err=(base/"result/stderr.log").read_text(encoding="utf8")
   print(out[-7000:]);print(err[-3000:]);self.assertEqual(result["exitCode"],0);self.assertIsNone(result["terminationReason"])
   if marker:self.assertIn(marker,out)
 def scope(self,stage):
  files=list((ROOT/"tests/hsyncad-hybrid-acceptance").glob(stage+".test.ts"));self.assertTrue(files,"missing actual stage acceptance tests")
  self.invoke(["--import","tsx","--test",*[str(f) for f in files]],300,"fail 0")
 def test_p12(self): self.scope("p12")
 def test_p13(self): self.scope("p13")
 def test_p14(self): self.scope("p14")
 def test_p15(self): self.scope("p15")
 def test_p16(self): self.scope("p16")
 def test_p17(self): self.scope("p17")
 def test_p18(self): self.scope("p18")
 def test_p19(self): self.scope("p19")
 def test_project(self):
  files=sorted((ROOT/"tests/hsyncad-structural").glob("*.test.ts"))+sorted((ROOT/"tests/hsyncad-hybrid-acceptance").glob("*.test.ts"))
  self.assertTrue(files);self.invoke(["--import","tsx","--test","--test-concurrency=1",*[str(p) for p in files]],500,"fail 0")
 def test_types(self): self.invoke(["node_modules/typescript/bin/tsc","--noEmit","--incremental","false","-p","tsconfig.next.json"],180)
