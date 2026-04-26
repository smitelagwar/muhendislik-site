"use client";

/**
 * KategoriFormlari — 12 kategori için input form bileşenleri
 * Her kategori kendi küçük bileşenini burada export eder.
 * KategoriKarti'nin children slot'una geçirilir.
 */

import type {
  BetonDemirInput, DuvarInput, CatiInput, SuYalitimInput,
  DisCepheInput, IsitmaSogutmaInput, SeramikMermerInput, SivaBoyaInput,
  PencereKapiInput, ParkKaplamaInput, ElektrikAlcipanInput, KamuSabitInput,
  ProjectProfile,
} from "@/lib/calculations/types";

// ─────────────────────────────────────────────
// PAYLAŞILAN UI YARDIMCILARI
// ─────────────────────────────────────────────

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-500">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-teal-500 focus:outline-none w-full";

function Sel({ id, value, onChange, children }: {
  id: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return <select id={id} value={value} onChange={e => onChange(e.target.value)} className={inputCls}>{children}</select>;
}

function Num({ id, value, onChange, min = 0, max = 999999 }: {
  id: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <input id={id} type="number" min={min} max={max} value={value}
      onChange={e => {
        if (e.target.value === "") {
          onChange(min);
          return;
        }
        const v = parseFloat(e.target.value);
        if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
      }}
      className={inputCls} />
  );
}

function CheckRow({ id, label, checked, onChange }: {
  id: string; label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5">
      <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-zinc-600 accent-teal-500" />
      <span className="text-sm text-zinc-300">{label}</span>
    </label>
  );
}

// ─────────────────────────────────────────────
// 1 — BETON VE DEMİR
// ─────────────────────────────────────────────

export function BetonDemirForm({
  input, onChange,
}: { input: BetonDemirInput; onChange: (p: Partial<BetonDemirInput>) => void }) {
  return (
    <div className="space-y-3">
      <Row>
        <Field label="Temel Türü">
          <Sel id="temel-turu" value={input.temelTuru} onChange={v => onChange({ temelTuru: v as BetonDemirInput["temelTuru"] })}>
            <option value="radye">Radye Temel</option>
            <option value="surekli">Sürekli Temel</option>
            <option value="tekil">Tekil Temel</option>
          </Sel>
        </Field>
        <Field label="Beton Sınıfı">
          <Sel id="beton-sinifi" value={input.betonSinifi} onChange={v => onChange({ betonSinifi: v as BetonDemirInput["betonSinifi"] })}>
            <option value="C25">C25</option>
            <option value="C30">C30</option>
            <option value="C35">C35</option>
          </Sel>
        </Field>
        <Field label="Döşeme Tipi">
          <Sel id="doseme-tipi" value={input.dosemeTipi} onChange={v => onChange({ dosemeTipi: v as BetonDemirInput["dosemeTipi"] })}>
            <option value="kirisli">Kirişli Döşeme</option>
            <option value="asmolen">Asmolen</option>
            <option value="nervurlu">Nervürlü</option>
            <option value="flat_slab">Flat Slab</option>
          </Sel>
        </Field>
      </Row>
      <Row>
        <Field label="Temel Kalınlığı (m)">
          <Num id="temel-kalin" value={input.temelKalinligi} min={0.2} max={2} onChange={v => onChange({ temelKalinligi: v })} />
        </Field>
        <Field label="Döşeme Kalınlığı (cm)">
          <Num id="doseme-kalin" value={input.dosemeKalinligi} min={8} max={40} onChange={v => onChange({ dosemeKalinligi: v })} />
        </Field>
        <Field label="Kolon/Perde Beton Hacmi (m³, opsiyonel)">
          <Num id="kolon-hacim" value={input.kolonPerdeBetonHacmi ?? 0} min={0} onChange={v => onChange({ kolonPerdeBetonHacmi: v || undefined })} />
        </Field>
      </Row>
    </div>
  );
}

// ─────────────────────────────────────────────
// 2 — DUVAR
// ─────────────────────────────────────────────

export function DuvarForm({
  input, onChange,
}: { input: DuvarInput; onChange: (p: Partial<DuvarInput>) => void }) {
  return (
    <Row>
      <Field label="İç Duvar Malzemesi">
        <Sel id="ic-duvar" value={input.icDuvarMalzeme} onChange={v => onChange({ icDuvarMalzeme: v as DuvarInput["icDuvarMalzeme"] })}>
          <option value="tugla10">Tuğla 10cm</option>
          <option value="tugla85">Tuğla 8.5cm</option>
          <option value="gazbeton">Gazbeton</option>
        </Sel>
      </Field>
      <Field label="Dış Duvar Malzemesi">
        <Sel id="dis-duvar" value={input.disDuvarMalzeme} onChange={v => onChange({ disDuvarMalzeme: v as DuvarInput["disDuvarMalzeme"] })}>
          <option value="gazbeton15">Gazbeton 15cm</option>
          <option value="gazbeton135">Gazbeton 13.5cm</option>
          <option value="tugla">Tuğla</option>
        </Sel>
      </Field>
      <Field label="İç Duvar Alanı m² (opsiyonel — otomatik)">
        <Num id="ic-alan" value={input.icDuvarAlani ?? 0} onChange={v => onChange({ icDuvarAlani: v || undefined })} />
      </Field>
    </Row>
  );
}

// ─────────────────────────────────────────────
// 3 — ÇATI
// ─────────────────────────────────────────────

export function CatiForm({
  input, onChange,
}: { input: CatiInput; onChange: (p: Partial<CatiInput>) => void }) {
  return (
    <Row>
      <Field label="Çatı Tipi">
        <Sel id="cati-tipi" value={input.catiTipi} onChange={v => onChange({ catiTipi: v as CatiInput["catiTipi"] })}>
          <option value="celik">Çelik Karkas</option>
          <option value="betonarme">Betonarme</option>
          <option value="duz_teras">Düz Teras</option>
        </Sel>
      </Field>
      <Field label="Kaplama">
        <Sel id="kaplama" value={input.kaplama} onChange={v => onChange({ kaplama: v as CatiInput["kaplama"] })}>
          <option value="kiremit">Kiremit</option>
          <option value="osb_singil">OSB + Shingle</option>
          <option value="membran">Bitüm Membran</option>
          <option value="teras">Teras Kaplama</option>
        </Sel>
      </Field>
      <Field label="Isı Yalıtımı">
        <Sel id="isi-yalitim" value={input.isiYalitim} onChange={v => onChange({ isiYalitim: v as CatiInput["isiYalitim"] })}>
          <option value="xps">XPS</option>
          <option value="tas_yunu">Taş Yünü</option>
          <option value="eps">EPS</option>
        </Sel>
      </Field>
    </Row>
  );
}

// ─────────────────────────────────────────────
// 4 — SU YALITIMI
// ─────────────────────────────────────────────

export function SuYalitimForm({
  input, onChange,
}: { input: SuYalitimInput; onChange: (p: Partial<SuYalitimInput>) => void }) {
  return (
    <div className="space-y-3">
      <Row>
        <Field label="Membran Kat Sayısı">
          <Sel id="membran-kat" value={String(input.membranKatSayisi)} onChange={v => onChange({ membranKatSayisi: parseInt(v) as 1 | 2 })}>
            <option value="1">1 Kat</option>
            <option value="2">2 Kat (önerilen)</option>
          </Sel>
        </Field>
        <Field label="Drenaj Uzunluğu (mt, opsiyonel — otomatik)">
          <Num id="drenaj" value={input.drenajUzunlugu ?? 0} onChange={v => onChange({ drenajUzunlugu: v || undefined })} />
        </Field>
      </Row>
      <div className="flex flex-wrap gap-3">
        <CheckRow id="balkon-yal" label="Balkon/Teras Su Yalıtımı"
          checked={input.balkonTerasSuYalitim} onChange={v => onChange({ balkonTerasSuYalitim: v })} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 5 — DIŞ CEPHE
// ─────────────────────────────────────────────

export function DisCepheForm({
  input, onChange,
}: { input: DisCepheInput; onChange: (p: Partial<DisCepheInput>) => void }) {
  const oran = input.kompozitOrani + input.boyaOrani;
  const soveOrani = Math.max(0, Math.round((1 - oran) * 100));
  return (
    <div className="space-y-3">
      <Row>
        <Field label={`Kompozit Oranı (%${Math.round(input.kompozitOrani * 100)})`}>
          <input type="range" min={0} max={100} step={5}
            value={Math.round(input.kompozitOrani * 100)}
            onChange={e => onChange({ kompozitOrani: parseInt(e.target.value) / 100 })}
            className="w-full accent-teal-500" />
        </Field>
        <Field label={`Boyalı Cephe Oranı (%${Math.round(input.boyaOrani * 100)})`}>
          <input type="range" min={0} max={100} step={5}
            value={Math.round(input.boyaOrani * 100)}
            onChange={e => onChange({ boyaOrani: parseInt(e.target.value) / 100 })}
            className="w-full accent-teal-500" />
        </Field>
        <Field label={`Söve Oranı (otomatik — %${soveOrani})`}>
          <div className="flex items-center h-9 px-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
            <span className="text-sm text-zinc-500">%{soveOrani} (kalan)</span>
          </div>
        </Field>
      </Row>
      <div className="flex flex-wrap gap-3">
        <CheckRow id="mantolama" label="Mantolama (XPS 5cm)"
          checked={input.mantolama} onChange={v => onChange({ mantolama: v })} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 6 — ISITMA VE SOĞUTMA
// ─────────────────────────────────────────────

export function IsitmaSogutmaForm({
  input, onChange,
}: { input: IsitmaSogutmaInput; onChange: (p: Partial<IsitmaSogutmaInput>) => void }) {
  return (
    <Row>
      <Field label="Isıtma Sistemi">
        <Sel id="isitma-sis" value={input.isitmaSistemi} onChange={v => onChange({ isitmaSistemi: v as IsitmaSogutmaInput["isitmaSistemi"] })}>
          <option value="radyator">Radyatör</option>
          <option value="yerden">Yerden Isıtma</option>
          <option value="fan_coil">Fan-Coil</option>
        </Sel>
      </Field>
      <Field label="Kalorifer Cihazı">
        <Sel id="isitma-cihaz" value={input.isitmaCihazi} onChange={v => onChange({ isitmaCihazi: v as IsitmaSogutmaInput["isitmaCihazi"] })}>
          <option value="kombi">Bireysel Kombi</option>
          <option value="kazan">Merkezi Kazan</option>
          <option value="vrf">VRF Sistem</option>
        </Sel>
      </Field>
      <Field label="Sıcak Su Yöntemi">
        <Sel id="sicak-su" value={input.sicakSuYontemi} onChange={v => onChange({ sicakSuYontemi: v as IsitmaSogutmaInput["sicakSuYontemi"] })}>
          <option value="kombi">Kombi</option>
          <option value="boyler">Merkezi Boyler</option>
          <option value="gunes">Güneş Enerjisi</option>
        </Sel>
      </Field>
      <Field label="Klima (bölüm başına adet)">
        <Num id="klima-bolum" value={input.klimaBolumBasi} min={0} max={10} onChange={v => onChange({ klimaBolumBasi: v })} />
      </Field>
    </Row>
  );
}

// ─────────────────────────────────────────────
// 7 — SERAMİK VE MERMER
// ─────────────────────────────────────────────

export function SeramikMermerForm({
  input, onChange,
}: { input: SeramikMermerInput; onChange: (p: Partial<SeramikMermerInput>) => void }) {
  return (
    <div className="space-y-3">
      <Row>
        <Field label="Banyo Duvar Seramiği (m², opsiyonel)">
          <Num id="banyo-duvar" value={input.banyoDuvarSeramikAlani ?? 0} onChange={v => onChange({ banyoDuvarSeramikAlani: v || undefined })} />
        </Field>
        <Field label="Banyo Yer Seramiği (m², opsiyonel)">
          <Num id="banyo-yer" value={input.banyoYerSeramikAlani ?? 0} onChange={v => onChange({ banyoYerSeramikAlani: v || undefined })} />
        </Field>
        <Field label="Mutfak Zemin (m², opsiyonel)">
          <Num id="mutfak-yer" value={input.mutfakZeminAlani ?? 0} onChange={v => onChange({ mutfakZeminAlani: v || undefined })} />
        </Field>
      </Row>
      <div className="flex flex-wrap gap-3">
        <CheckRow id="merdiven-mermer" label="Merdiven Mermeri"
          checked={input.merdivenMermer} onChange={v => onChange({ merdivenMermer: v })} />
      </div>
      {input.merdivenMermer && (
        <Row>
          <Field label="Merdiven Basamak Sayısı (opsiyonel — otomatik)">
            <Num id="basamak" value={input.merdivenBasamakSayisi ?? 0} onChange={v => onChange({ merdivenBasamakSayisi: v || undefined })} />
          </Field>
        </Row>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 8 — SIVA VE BOYA
// ─────────────────────────────────────────────

export function SivaBoyaForm({
  input, onChange,
}: { input: SivaBoyaInput; onChange: (p: Partial<SivaBoyaInput>) => void }) {
  return (
    <Row>
      <Field label="İnce Sıva Alanı (m², opsiyonel — otomatik)">
        <Num id="ince-siva" value={input.inceSivaAlani ?? 0} onChange={v => onChange({ inceSivaAlani: v || undefined })} />
      </Field>
      <Field label="Kara Sıva Alanı (m², opsiyonel — otomatik)">
        <Num id="kara-siva" value={input.karaSivaAlani ?? 0} onChange={v => onChange({ karaSivaAlani: v || undefined })} />
      </Field>
    </Row>
  );
}

// ─────────────────────────────────────────────
// 9 — PENCERE VE KAPI
// ─────────────────────────────────────────────

export function PencereKapiForm({
  input, onChange,
}: { input: PencereKapiInput; onChange: (p: Partial<PencereKapiInput>) => void }) {
  return (
    <div className="space-y-3">
      <Row>
        <Field label="Doğrama Tipi">
          <Sel id="dograma-tipi" value={input.dogramaTipi} onChange={v => onChange({ dogramaTipi: v as PencereKapiInput["dogramaTipi"] })}>
            <option value="pvc">PVC</option>
            <option value="aluminyum">Alüminyum</option>
            <option value="ahsap">Ahşap</option>
          </Sel>
        </Field>
        <Field label="Cam Türü">
          <Sel id="cam-turu" value={input.camTuru} onChange={v => onChange({ camTuru: v as PencereKapiInput["camTuru"] })}>
            <option value="isicam">Isıcam</option>
            <option value="cift">Çift Cam</option>
            <option value="tek">Tek Cam</option>
          </Sel>
        </Field>
        <Field label="Daire Dış Kapı Tipi">
          <Sel id="daire-kapi" value={input.daireDiskKapiTipi} onChange={v => onChange({ daireDiskKapiTipi: v as PencereKapiInput["daireDiskKapiTipi"] })}>
            <option value="celik">Çelik Kapı</option>
            <option value="ahsapKapliCelik">Ahşap Kaplı Çelik</option>
          </Sel>
        </Field>
      </Row>
      <Row>
        <Field label="Oda Kapısı (bölüm başı adet)">
          <Num id="oda-kapi" value={input.odaKapiBolumBasi} min={1} max={10} onChange={v => onChange({ odaKapiBolumBasi: v })} />
        </Field>
        <Field label="Toplam Doğrama (mtül, opsiyonel — otomatik)">
          <Num id="dograma-mtul" value={input.toplamDogramaMtul ?? 0} onChange={v => onChange({ toplamDogramaMtul: v || undefined })} />
        </Field>
      </Row>
      <div className="flex flex-wrap gap-3">
        <CheckRow id="bina-giris" label="Bina Giriş Kapısı"
          checked={input.binaGirisKapisi} onChange={v => onChange({ binaGirisKapisi: v })} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 10 — PARKE VE KAPLAMA
// ─────────────────────────────────────────────

export function ParkeKaplamaForm({
  input, onChange,
}: { input: ParkKaplamaInput; onChange: (p: Partial<ParkKaplamaInput>) => void }) {
  return (
    <div className="space-y-3">
      <Row>
        <Field label="Parke Türü">
          <Sel id="parke-turu" value={input.parkeTuru} onChange={v => onChange({ parkeTuru: v as ParkKaplamaInput["parkeTuru"] })}>
            <option value="laminant">Laminant</option>
            <option value="spc">SPC (Su Geçirmez)</option>
            <option value="lamine">Lamine</option>
            <option value="masif">Masif Ahşap</option>
          </Sel>
        </Field>
        <Field label="Parke Alanı m² (opsiyonel — otomatik)">
          <Num id="parke-alan" value={input.parkeAlani ?? 0} onChange={v => onChange({ parkeAlani: v || undefined })} />
        </Field>
      </Row>
      <div className="flex flex-wrap gap-3">
        <CheckRow id="supurgelik" label="Ahşap Süpürgelik"
          checked={input.supurgelik} onChange={v => onChange({ supurgelik: v })} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 11 — ELEKTRİK VE ALÇIPAN
// ─────────────────────────────────────────────

export function ElektrikAlcipanForm({
  input, onChange,
}: { input: ElektrikAlcipanInput; onChange: (p: Partial<ElektrikAlcipanInput>) => void }) {
  return (
    <div className="space-y-3">
      <Row>
        <Field label="Jeneratör">
          <Sel id="jenerator" value={input.jenerator} onChange={v => onChange({ jenerator: v as ElektrikAlcipanInput["jenerator"] })}>
            <option value="yok">Yok</option>
            <option value="ortak">Ortak (1 Adet)</option>
            <option value="baginmsizBolum">Bölüm Başına</option>
          </Sel>
        </Field>
        <Field label="Kartonpiyer (mtül, opsiyonel — otomatik)">
          <Num id="ktp-mtul" value={input.kartonpiyerMtul ?? 0} onChange={v => onChange({ kartonpiyerMtul: v || undefined })} />
        </Field>
        <Field label="Alçıpan Alanı (m², opsiyonel — otomatik)">
          <Num id="alc-alan" value={input.alcipanAlani ?? 0} onChange={v => onChange({ alcipanAlani: v || undefined })} />
        </Field>
      </Row>
      <div className="flex flex-wrap gap-3">
        <CheckRow id="kartonpiyer-var" label="Kartonpiyer Uygulansin"
          checked={input.kartonpiyerVarMi} onChange={v => onChange({ kartonpiyerVarMi: v })} />
        <CheckRow id="diyafon" label="Görüntülü Diyafon"
          checked={input.goruntuluyDiyafon} onChange={v => onChange({ goruntuluyDiyafon: v })} />
        <CheckRow id="kamera" label="Kamera Sistemi"
          checked={input.kameraSistemi} onChange={v => onChange({ kameraSistemi: v })} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 12 — KAMU ÖDEMELERİ VE SABİT GİDERLER
// ─────────────────────────────────────────────

export function KamuSabitForm({
  input, onChange, proj,
}: { input: KamuSabitInput; onChange: (p: Partial<KamuSabitInput>) => void; proj: ProjectProfile }) {
  const defaultAy = Math.max(6, Math.ceil(proj.insaatAlani / 280));
  return (
    <div className="space-y-3">
      <Row>
        <Field label={`Şantiye Süresi (ay, öneri: ${defaultAy})`}>
          <Num id="santiye-ay" value={input.santiyeAylari} min={1} max={120} onChange={v => onChange({ santiyeAylari: v })} />
        </Field>
        <Field label="Bayındırlık Birim m² (opsiyonel — otomatik)">
          <Num id="bayindirlik" value={input.bayindirlikBirimM2 ?? 0} onChange={v => onChange({ bayindirlikBirimM2: v || undefined })} />
        </Field>
        <Field label="YDS Oranı % (opsiyonel — 1.58)">
          <Num id="yapi-den" value={input.yapiDenetimOrani ? input.yapiDenetimOrani * 100 : 0} min={0} max={5}
            onChange={v => onChange({ yapiDenetimOrani: v ? v / 100 : undefined })} />
        </Field>
      </Row>
      <div className="flex flex-wrap gap-3">
        <CheckRow id="ruhsat-harci" label="Ruhsat Harci"
          checked={input.ruhsatHarci} onChange={v => onChange({ ruhsatHarci: v })} />
        <CheckRow id="enerji-bel" label="Enerji Kimlik Belgesi"
          checked={input.enerjiBelgesi} onChange={v => onChange({ enerjiBelgesi: v })} />
        <CheckRow id="zemin-et" label="Zemin Etüdü"
          checked={input.zeminEtudu} onChange={v => onChange({ zeminEtudu: v })} />
        <CheckRow id="akustik" label="Akustik Rapor"
          checked={input.akustikRapor} onChange={v => onChange({ akustikRapor: v })} />
      </div>
    </div>
  );
}
