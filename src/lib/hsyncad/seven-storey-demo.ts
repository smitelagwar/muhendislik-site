import type { CadModel, Floor, AxisElement, ColumnElement, BeamElement, WallElement, SlabElement, Point } from "./model";
import { DEFAULT_LAYERS, DEFAULT_SNAP } from "./definitions";

/**
 * 7 Katlı, her kat alanı ~1500 m² (48 m × 32 m = 1536 m²)
 * Perdeli, kirişli döşemeli, radye temelli tam betonarme yapı modeli.
 * Çatı parapet perdeleri, asansör/merdiven perde çekirdeği, radye temel ve aks sistemi dahil.
 */
export function createSevenStoreyCommercialBuilding(): CadModel {
  const floorHeights = [3.5, 3.2, 3.2, 3.2, 3.2, 3.2, 3.2]; // 7 kat, toplam 22.7 m yükseklik
  let currentElev = 0;

  const floors: Floor[] = floorHeights.map((h, i) => {
    const f: Floor = {
      id: `floor-${i}`,
      name: i === 0 ? "Zemin Kat (±0.00)" : `${i}. Normal Kat (+${currentElev.toFixed(2)})`,
      elevation: currentElev,
      height: h,
    };
    currentElev += h;
    return f;
  });

  const materials = [
    { id: "concrete-c35", name: "C35/45 Beton" },
    { id: "rebar-b420c", name: "B420C Donatı Çeliği" },
  ];

  const elements: CadModel["elements"] = [];

  // Aks Koordinatları:
  // X yönünde 6 açıklık (8 m'lik): 0, 8, 16, 24, 32, 40, 48 m (Akslar: 1, 2, 3, 4, 5, 6, 7)
  // Y yönünde 4 açıklık (8 m'lik): 0, 8, 16, 24, 32 m (Akslar: A, B, C, D, E)
  const xGrid = [0, 8, 16, 24, 32, 40, 48];
  const yGrid = [0, 8, 16, 24, 32];
  const xLabels = ["1", "2", "3", "4", "5", "6", "7"];
  const yLabels = ["A", "B", "C", "D", "E"];

  // 1. Zemin Katta Aksları Oluştur (Akslar Zemin Katta tanımlanır)
  for (let i = 0; i < xGrid.length; i++) {
    const x = xGrid[i];
    elements.push({
      id: `axis-x-${i}`,
      name: xLabels[i],
      type: "axis",
      layer: "Akslar",
      floorId: "floor-0",
      materialId: "concrete-c35",
      start: { x, y: -2 },
      end: { x, y: 34 },
      orientation: "vertical",
      labelSide: "both",
      extension: 2,
    } as AxisElement);
  }

  for (let j = 0; j < yGrid.length; j++) {
    const y = yGrid[j];
    elements.push({
      id: `axis-y-${j}`,
      name: yLabels[j],
      type: "axis",
      layer: "Akslar",
      floorId: "floor-0",
      materialId: "concrete-c35",
      start: { x: -2, y },
      end: { x: 50, y },
      orientation: "horizontal",
      labelSide: "both",
      extension: 2,
    } as AxisElement);
  }

  // Çekirdek (Merdiven ve Asansör Şaftı) Konumu:
  // X: 24m, Y: 16m merkezinde
  // Perde koordinatları:
  // P-C1: (20, 12) -> (28, 12) (8m yatay perde)
  // P-C2: (20, 20) -> (28, 20) (8m yatay perde)
  // P-C3: (20, 12) -> (20, 20) (8m düşey perde)
  // P-C4: (28, 12) -> (28, 20) (8m düşey perde)
  const shearWallSpans = [
    { start: { x: 20, y: 12 }, end: { x: 28, y: 12 }, name: "P-C1" },
    { start: { x: 20, y: 20 }, end: { x: 28, y: 20 }, name: "P-C2" },
    { start: { x: 20, y: 12 }, end: { x: 20, y: 20 }, name: "P-C3" },
    { start: { x: 28, y: 12 }, end: { x: 28, y: 20 }, name: "P-C4" },
    // Dış cephe rijitlik perdeleri (TBDY 2018 burulma dengesi için)
    { start: { x: 0, y: 8 }, end: { x: 0, y: 16 }, name: "P-W1" },
    { start: { x: 0, y: 16 }, end: { x: 0, y: 24 }, name: "P-W2" },
    { start: { x: 48, y: 8 }, end: { x: 48, y: 16 }, name: "P-E1" },
    { start: { x: 48, y: 16 }, end: { x: 48, y: 24 }, name: "P-E2" },
  ];

  // 2. Her Kat İçin Elemanları Yerleştir (7 Kat)
  for (let fIdx = 0; fIdx < floors.length; fIdx++) {
    const fId = floors[fIdx].id;
    const fHeight = floors[fIdx].height;
    const isTopFloor = fIdx === floors.length - 1;

    // A) Kolonlar
    let colCounter = 1;
    for (let i = 0; i < xGrid.length; i++) {
      for (let j = 0; j < yGrid.length; j++) {
        const x = xGrid[i];
        const y = yGrid[j];

        // Çekirdek merkezindeki kolonları atlayalım veya güçlü kolon koyalım
        // Alt katlarda daha büyük (70x70), üst katlarda (50x50)
        const colSize = fIdx < 3 ? 0.70 : 0.60;

        elements.push({
          id: `col-F${fIdx}-${i}-${j}`,
          name: `S${fIdx + 1}${colCounter < 10 ? "0" + colCounter : colCounter}`,
          type: "column",
          layer: "Kolonlar",
          floorId: fId,
          materialId: "concrete-c35",
          position: { x, y },
          width: colSize,
          depth: colSize,
          height: fHeight,
          anchorMode: "center",
        } as ColumnElement);
        colCounter++;
      }
    }

    // B) Kirişler (X ve Y yönünde tüm akslar boyunca çerçeve kirişleri)
    let beamCounter = 1;
    // X yönü kirişleri
    for (let j = 0; j < yGrid.length; j++) {
      const y = yGrid[j];
      for (let i = 0; i < xGrid.length - 1; i++) {
        const x1 = xGrid[i];
        const x2 = xGrid[i + 1];
        elements.push({
          id: `beam-x-F${fIdx}-${i}-${j}`,
          name: `K${fIdx + 1}${beamCounter < 10 ? "0" + beamCounter : beamCounter}`,
          type: "beam",
          layer: "Kirişler",
          floorId: fId,
          materialId: "concrete-c35",
          start: { x: x1, y },
          end: { x: x2, y },
          width: 0.30,
          height: 0.60, // 30/60 cm çerçeve kirişleri
          alignment: "center",
        } as BeamElement);
        beamCounter++;
      }
    }

    // Y yönü kirişleri
    for (let i = 0; i < xGrid.length; i++) {
      const x = xGrid[i];
      for (let j = 0; j < yGrid.length - 1; j++) {
        const y1 = yGrid[j];
        const y2 = yGrid[j + 1];
        elements.push({
          id: `beam-y-F${fIdx}-${i}-${j}`,
          name: `K${fIdx + 1}${beamCounter < 10 ? "0" + beamCounter : beamCounter}`,
          type: "beam",
          layer: "Kirişler",
          floorId: fId,
          materialId: "concrete-c35",
          start: { x, y: y1 },
          end: { x, y: y2 },
          width: 0.30,
          height: 0.60,
          alignment: "center",
        } as BeamElement);
        beamCounter++;
      }
    }

    // C) Perdeler (Shear Walls)
    for (let wIdx = 0; wIdx < shearWallSpans.length; wIdx++) {
      const wall = shearWallSpans[wIdx];
      elements.push({
        id: `wall-F${fIdx}-${wIdx}`,
        name: `${wall.name}-K${fIdx + 1}`,
        type: "wall",
        layer: "Perdeler",
        floorId: fId,
        materialId: "concrete-c35",
        start: { ...wall.start },
        end: { ...wall.end },
        thickness: 0.30, // 30 cm perde kalınlığı
        height: fHeight,
        alignment: "center",
      } as WallElement);
    }

    // D) Döşemeler (Slabs - 24 açıklık: 6x4 ızgara)
    // Her açıklık 8x8 = 64 m², 24 açıklık = 1536 m²
    let slabCounter = 1;
    for (let i = 0; i < xGrid.length - 1; i++) {
      for (let j = 0; j < yGrid.length - 1; j++) {
        const x1 = xGrid[i];
        const x2 = xGrid[i + 1];
        const y1 = yGrid[j];
        const y2 = yGrid[j + 1];

        // Asansör/merdiven boşluğu olan gözü (x: 24..32, y: 16..24) boş bırakabilir veya sahanlık yapabiliriz
        const isCoreVoid = (x1 === 24 && y1 === 16);

        if (!isCoreVoid) {
          const corners: Point[] = [
            { x: x1, y: y1 },
            { x: x2, y: y1 },
            { x: x2, y: y2 },
            { x: x1, y: y2 },
          ];

          elements.push({
            id: `slab-F${fIdx}-${i}-${j}`,
            name: `D${fIdx + 1}${slabCounter < 10 ? "0" + slabCounter : slabCounter}`,
            type: "slab",
            layer: "Döşemeler",
            floorId: fId,
            materialId: "concrete-c35",
            points: corners,
            thickness: isTopFloor ? 0.18 : 0.15, // 15 cm ara kat, 18 cm çatı plağı
            liveLoad: isTopFloor ? 1.5 : 3.5, // 3.5 kN/m² ticari hareketli yük
            finishLoad: 2.0, // 2.0 kN/m² kaplama + sıva
            labelPosition: { x: (x1 + x2) / 2 - 1.5, y: (y1 + y2) / 2 - 1 },
          } as SlabElement);
          slabCounter++;
        }
      }
    }

    // E) Çatıda Parapet / Kalkan Duvarları (Son Katta ilave çevre parapeti)
    if (isTopFloor) {
      const parapetHeight = 1.0;
      elements.push(
        {
          id: `parapet-south`,
          name: "PAR-G",
          type: "wall",
          layer: "Perdeler",
          floorId: fId,
          materialId: "concrete-c35",
          start: { x: 0, y: 0 },
          end: { x: 48, y: 0 },
          thickness: 0.20,
          height: parapetHeight,
          baseOffset: fHeight,
          heightMode: "fixed",
        } as WallElement,
        {
          id: `parapet-north`,
          name: "PAR-K",
          type: "wall",
          layer: "Perdeler",
          floorId: fId,
          materialId: "concrete-c35",
          start: { x: 0, y: 32 },
          end: { x: 48, y: 32 },
          thickness: 0.20,
          height: parapetHeight,
          baseOffset: fHeight,
          heightMode: "fixed",
        } as WallElement,
        {
          id: `parapet-west`,
          name: "PAR-B",
          type: "wall",
          layer: "Perdeler",
          floorId: fId,
          materialId: "concrete-c35",
          start: { x: 0, y: 0 },
          end: { x: 0, y: 32 },
          thickness: 0.20,
          height: parapetHeight,
          baseOffset: fHeight,
          heightMode: "fixed",
        } as WallElement,
        {
          id: `parapet-east`,
          name: "PAR-D",
          type: "wall",
          layer: "Perdeler",
          floorId: fId,
          materialId: "concrete-c35",
          start: { x: 48, y: 0 },
          end: { x: 48, y: 32 },
          thickness: 0.20,
          height: parapetHeight,
          baseOffset: fHeight,
          heightMode: "fixed",
        } as WallElement
      );
    }
  }

  // 3. Radye Temel Plağı (Zemin Kat tabanında, bina sınırından 1.5 m ampatmanlı)
  // Bina: 0..48 m, 0..32 m -> Radye: -1.5..49.5 m, -1.5..33.5 m (51 m × 35 m = 1785 m²)
  const raftCorners: Point[] = [
    { x: -1.5, y: -1.5 },
    { x: 49.5, y: -1.5 },
    { x: 49.5, y: 33.5 },
    { x: -1.5, y: 33.5 },
  ];

  elements.push({
    id: "raft-foundation-main",
    name: "RAD-01 (h=100cm)",
    type: "slab",
    layer: "Temeller",
    floorId: "floor-0",
    materialId: "concrete-c35",
    points: raftCorners,
    thickness: 1.00, // 100 cm kalınlığında masif radye temel
    topOffset: 0,
    labelPosition: { x: 22, y: 2 },
  } as SlabElement);

  return {
    schemaVersion: 1,
    name: "7 Katlı Plaza & İş Merkezi (1536 m² / Kat) - Perdeli & Radye Temelli",
    floors,
    materials,
    elements,
    layers: DEFAULT_LAYERS.concat(["Temeller", "Merdivenler"]).map(name => ({
      name,
      visible: true,
      locked: false,
    })),
    snap: { ...DEFAULT_SNAP },
  };
}
