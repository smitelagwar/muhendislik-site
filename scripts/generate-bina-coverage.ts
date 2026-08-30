import fs from "fs";
import path from "path";
import { getAllIndexedBinaNodes } from "../src/lib/bina-asamalari";

const projectRoot = path.resolve(process.cwd());
const canonicalNodes = getAllIndexedBinaNodes().filter((n) => n.id !== "root");

const knownKeep = ["ince-isler", "siva", "alcipan"];

const coverageList = canonicalNodes.map((node) => {
  const isKeep =
    knownKeep.includes(node.id) &&
    (node.slugPath === "ince-isler" ||
      node.slugPath === "ince-isler/siva" ||
      node.slugPath === "ince-isler/alcipan");

  return {
    nodeId: node.id,
    slugPath: node.slugPath,
    label: node.plainLabel,
    phaseId: node.branchId,
    depth: node.depth,
    route: `/kategori/bina-asamalari/${node.slugPath}`,
    primary: {
      status: isKeep ? "keep-existing" : "pending",
      src: `/bina-asamalari/topics/${node.id}.webp`,
      qcScore: isKeep ? 92 : null,
    },
    secondary: {
      status: "pending",
      src: `/bina-asamalari/details/${node.id}.webp`,
      qcScore: null,
    },
    page: {
      twoDistinctVisuals: false,
    },
  };
});

const outPath = path.join(projectRoot, "bina-gorsel-coverage.json");
fs.writeFileSync(outPath, JSON.stringify(coverageList, null, 2), "utf-8");
console.log(`bina-gorsel-coverage.json başarıyla oluşturuldu: ${coverageList.length} kayıt.`);
