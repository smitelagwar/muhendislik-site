import fs from "fs";
import path from "path";
import type { SiteSectionId } from "./site-sections";
import type { DepremSeriesId, RegulationStatus } from "./deprem-content-types";
import { DEPREM_TOPIC_ARTICLES } from "./deprem-topic-articles";
import { TBDY_STAGE2_ARTICLES } from "./tbdy-stage2-articles";
import { normalizeExistingDepremArticle } from "./deprem-existing-overrides";
import { applyDepremPilotOverride, getDepremPilotContentSignature } from "./deprem-pilot-articles";
import { applyDepremPhase3Override, getDepremPhase3ContentSignature } from "./deprem-phase3-articles";
import { applyDepremPhase4Override, DEPREM_PHASE4_SLUGS, getDepremPhase4ContentSignature } from "./deprem-phase4-articles";
import { applyDepremPhase5Override, DEPREM_PHASE5_SLUGS, getDepremPhase5ContentSignature } from "./deprem-phase5-articles";
import { applyDepremPhase6Override, DEPREM_PHASE6_SLUGS, getDepremPhase6ContentSignature } from "./deprem-phase6-articles";
import { applyDepremPhase7Override, DEPREM_PHASE7_SLUGS, getDepremPhase7ContentSignature } from "./deprem-phase7-articles";
import { applyDepremRolloutEnhancement, getDepremRolloutSignature } from "./deprem-rollout";
import { TS500_ARTICLES, TS500_SLUGS } from "./ts500-content";
import { normalizeDepremContentAuthor } from "./content-author";
import { applyTBDYStage1Figures } from "./tbdy-stage1-figures";

export interface ArticleData {
    slug: string;
    title: string;
    description: string;
    seoTitle?: string;
    seoDescri¶»§q«^