import * as fs from "node:fs";
import { LibreDwgConverter } from "@mlightcad/libredwg-converter";

async function main() {
  const buf = fs.readFileSync("C:/Users/hsyn/Desktop/mustafa selvimimariiiii.dwg");
  const { LibreDwg, Dwg_File_Type } = await import("@mlightcad/libredwg-web");
  const dwg = await LibreDwg.create();
  const ptr = dwg.dwg_read_data(buf, Dwg_File_Type.DWG);
  const rawDb = dwg.convert(ptr);
  dwg.dwg_free(ptr);
  console.log("STYLE sample:", rawDb.tables?.STYLE?.slice?.(0, 5) || rawDb.tables?.STYLE);
  console.log("LTYPE sample:", rawDb.tables?.LTYPE?.slice?.(0, 5) || rawDb.tables?.LTYPE);
}

main().catch(console.error);
