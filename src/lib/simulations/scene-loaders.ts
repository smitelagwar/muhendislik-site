import type { SimulationSceneSlug } from "./catalog";
import type { ColumnPresetId, DetailModel } from "./core/types";

type SceneLoader = (presetId?: ColumnPresetId) => Promise<DetailModel>;

const SCENE_LOADERS: Readonly<Record<SimulationSceneSlug, SceneLoader>> = {
  "kolon-detayi": async (presetId: ColumnPresetId = "c1-referans") => {
    const mod = await import("./scenes/column-c1");
    const spec = mod.getColumnSceneSpec(
      presetId === "c1-cirozlu-ogretim" ? "c1-cirozlu-ogretim" : "c1-referans",
    );
    return mod.buildColumnDetailModel(spec);
  },
  "kiris-detayi": async () => {
    const mod = await import("./scenes/beam-k1");
    return mod.buildBeamDetailModel(mod.K1_BEAM_SPEC);
  },
  "kolon-kiris-birlesimi": async () => {
    const mod = await import("./scenes/joint-exterior");
    return mod.buildExteriorJointDetailModel(mod.D1_EXTERIOR_JOINT_SPEC);
  },
  "tekil-temel": async () => {
    const mod = await import("./scenes/footing-pad");
    return mod.buildPadFootingDetailModel(mod.T1_PAD_FOOTING_SPEC);
  },
  "perde-detayi": async () => {
    const mod = await import("./scenes/wall-p1");
    return mod.buildShearWallDetailModel(mod.P1_SHEAR_WALL_SPEC);
  },
  "radye-temel": async () => {
    const mod = await import("./scenes/foundation-mat");
    return mod.buildMatFoundationDetailModel(mod.R1_MAT_FOUNDATION_SPEC);
  },
};

export async function loadSimulationSceneModel(
  slug: SimulationSceneSlug,
  presetId: ColumnPresetId = "c1-referans",
): Promise<DetailModel> {
  const loader = SCENE_LOADERS[slug];
  if (!loader) {
    throw new Error(`Tanimsiz simulasyon sahnesi: ${slug}`);
  }
  return loader(presetId);
}
