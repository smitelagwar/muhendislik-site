import fs from "node:fs";
import path from "node:path";
import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleList } from "../src/lib/articles-data";
import { DEPREM_CONTENT_AUTHOR, getArticleAuthorPresentation, normalizeDepremContentAuthor } from "../src/lib/content-author";
import { DEPREM_SERIES } from "../src/lib/deprem-series";
import { TOOLS } from "../src/lib/tools-data";
import { TS500_SLUGS } from "../src/lib/ts500-content";

const errors: string[] = [];
const assert = (condition: unknown, message: string) => {
  if (!condition) errors.push(message);
};

const sampleArticle = normalizeDepremContentAuthor({
  sectionId: "deprem-yonetmelik",
  author: "Eski Yazar",
  authorTitle: "Eski Unvan",
});
const samplePresentation = getArticleAuthorPresentation(sampleArticle);
assert(sampleArticle.author === "İnşaat Mühendisi Hüseyin GÜNAYDIN", "Canonical deprem author string yanlış.");
assert(sampleArticle.authorTitle === "", "Canonical author profesyonel unvanı ikinci kez render edilebilir.");
assert(samplePresentation.monogram === "HG", "Canonical monogram HG değil.");

const parsed = parseBlocks(`> [!MÜHENDİSLİK] Tasarım kararı
> Rijitlik kabulleri model davranışını değiştirir.

![Perde ve çerçeve yük aktarımı](/images/test.svg)
*Perde–çerçeve sisteminde yatay yük aktarımının şematik gösterimi.*
{figure: 2 | note: Çizim ölçekli değildir. | source: TBDY 2018 | lightbox: true}

\`\`\`formula
@label: Denklem 1
VtE = ���q�^