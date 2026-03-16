const EXPECTED_AUTHOR = "İnşaat Mühendisi Hüseyin Günaydın";

const contentModule = await import(new URL("../src/lib/bina-asamalari-content/index.ts", import.meta.url));
const binaModule = await import(new URL("../src/lib/bina-asamalari.ts", import.meta.url));

const {
  getBinaGuideBySlugPath,
  getFirstWaveBinaGuidePaths,
} = contentModule;

const { getAllIndexedBinaNodes } = binaModule;

const firstWaveNodes = getAllIndexedBinaNodes().filter((node) => node.depth === 1 || node.depth === 2);
const firstWavePaths = firstWaveNodes.map((node) => node.slugPath);
const registeredFirstWavePaths = getFirstWaveBinaGuidePaths();
const errors = [];

if (firstWavePaths.length !== 32) {
  errors.push(`Beklenen ilk dalga rota sayisi 32 olmaliydi, bulunan: ${firstWavePaths.length}`);
}

if (registeredFirstWavePaths.length !== 32) {
  errors.push(`Ilk dalga content registry 32 kayit icermiyor: ${registeredFirstWavePaths.length}`);
}

const missingRegisteredPaths = firstWavePaths.filter((path) => !registeredFirstWavePaths.includes(path));
if (missingRegisteredPaths.length > 0) {
  errors.push(`Registry'de eksik ilk dalga rotalari: ${missingRegisteredPaths.join(", ")}`);
}

for (const node of firstWaveNodes) {
  const guide = getBinaGuideBySlugPath(node.slugPath);

  if (!guide) {
    errors.push(`Icerik bulunamadi: ${node.slugPath}`);
    continue;
  }

  if (guide.author !== EXPECTED_AUTHOR) {
    errors.push(`Yazar hatali: ${node.slugPath} -> ${guide.author}`);
  }

  if (!guide.description || guide.description.includes("hazırlanmaktadır") || guide.description.includes("hazirlanmaktadir")) {
    errors.push(`Description yetersiz veya placeholder: ${node.slugPath}`);
  }

  if (!guide.quote?.text) {
    errors.push(`Quote eksik: ${node.slugPath}`);
  }

  if (!guide.keywords || guide.keywords.length < 3) {
    errors.push(`Keywords yetersiz: ${node.slugPath}`);
  }

  if (!guide.sources || guide.sources.length < 3) {
    errors.push(`Kaynak sayisi yetersiz: ${node.slugPath}`);
  }

  const minimumSections = node.depth === 1 ? 12 : 11;
  if (!guide.sections || guide.sections.length < minimumSections) {
    errors.push(`Section sayisi yetersiz: ${node.slugPath} -> ${guide.sections?.length ?? 0}`);
  }

  const sectionTitles = guide.sections.map((section) => section.title);
  const requiredTitles =
    node.depth === 1
      ? ["Giriş ve Kapsam", "Yönetmelik", "Çözülmüş Sayısal Örnek", "Kullanılan Yazılım", "Kullanılan Aletler", "Sık Yapılan Hatalar", "Kaynakça"]
      : ["Giriş ve Kapsam", "Yönetmelik", "Çözülmüş Sayısal Örnek", "Kullanılan Yazılım", "Kullanılan Aletler", "Sık Yapılan Hatalar", "Kaynakça"];

  for (const token of requiredTitles) {
    if (!sectionTitles.some((title) => title.includes(token))) {
      errors.push(`Section basligi eksik: ${node.slugPath} -> ${token}`);
    }
  }

  const mergedContent = guide.sections.map((section) => section.content).join("\n");
  if (!mergedContent.includes("|")) {
    errors.push(`Tablo bulunamadi: ${node.slugPath}`);
  }

  if (!mergedContent.includes("### ") && !mergedContent.includes("Çözüm adımları")) {
    errors.push(`Sayisal ornek izi zayif: ${node.slugPath}`);
  }
}

if (errors.length > 0) {
  console.error("Bina içerik doğrulama hataları:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Bina içerik doğrulaması geçti. İlk dalga kayıt sayısı: ${firstWavePaths.length}`);
