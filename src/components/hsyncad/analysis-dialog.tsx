"use client";

import { useState, useEffect } from "react";
import type { AnalysisResult, AnalysisSettings } from "@/lib/hsyncad/analysis";
import { DEFAULT_ANALYSIS_SETTINGS } from "@/lib/hsyncad/analysis";
import type { CadModel } from "@/lib/hsyncad/model";
import { downloadDxfFile } from "@/lib/hsyncad/dxf-export";
import { downloadStaticReportPdf } from "@/lib/hsyncad/reports";

interface Props {
  model: CadModel;
  result: AnalysisResult | null;
  onRun: (settings: AnalysisSettings) => void;
  onClose: () => void;
  onSetViewMode?: (mode: "none" | "displacement" | "moment" | "shear" | "capacity") => void;
  initialTab?: "summary" | "storeys" | "columns" | "beams" | "joints" | "irregularities" | "settings";
}

export default function AnalysisDialog({ model, result, onRun, onClose, onSetViewMode, initialTab }: Props) {
  const [activeTab, setActiveTab] = useState<"summary" | "storeys" | "columns" | "beams" | "joints" | "irregularities" | "settings">(initialTab ?? "summary");
  const [settings, setSettings] = useState<AnalysisSettings>(result?.settings ?? DEFAULT_ANALYSIS_SETTINGS);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div className="hcad-analysis-container" data-testid="hsyncad-analysis-dialog">
      <p role="note">Yaklaşık ön hesap ve taslak donatı. Tam 3B sonlu eleman çözümü veya yönetmelik uygunluk/onay raporu değildir.</p>
      <div className="hcad-analysis-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span className={`hcad-badge ${result?.overallPass ? "hcad-badge-success" : "hcad-badge-warning"}`}>
            {result ? (result.overallPass ? "Ön hesap sınırları sağlandı" : "Kapasite Aşımı Var") : "Analiz Bekleniyor"}
          </span>
        </div>
        {result && (
          <button
            type="button"
            className="hcad-btn-secondary"
            data-testid="download-static-pdf-btn"
            onClick={() => downloadStaticReportPdf(model, result, result.designResult)}
            style={{ fontSize: "12px", padding: "4px 10px" }}
          >
            📄 Statik Rapor İndir (PDF)
          </button>
        )}
      </div>

      <div className="hcad-analysis-nav">
        <button type="button" className={activeTab === "summary" ? "active" : ""} onClick={() => setActiveTab("summary")}>Özet Rapor</button>
        <button type="button" className={activeTab === "storeys" ? "active" : ""} onClick={() => setActiveTab("storeys")}>Kat & Göreli Öteleme</button>
        <button type="button" className={activeTab === "columns" ? "active" : ""} onClick={() => setActiveTab("columns")}>Kolon Tahkikleri</button>
        <button type="button" className={activeTab === "beams" ? "active" : ""} onClick={() => setActiveTab("beams")}>Kiriş Donatıları</button>
        <button type="button" className={activeTab === "joints" ? "active" : ""} onClick={() => setActiveTab("joints")}>Birleşim & Güçlü Kolon</button>
        <button type="button" className={activeTab === "irregularities" ? "active" : ""} onClick={() => setActiveTab("irregularities")}>Düzensizlikler</button>
        <button type="button" className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>Deprem Parametreleri</button>
      </div>

      <div className="hcad-analysis-body">
        {activeTab === "summary" && (
          <div className="hcad-summary-view">
            {result ? (
              <>
                <div className="hcad-stats-grid">
                  <div className="hcad-stat-card">
                    <span className="hcad-stat-label">Bina Toplam Ağırlığı (W)</span>
                    <strong className="hcad-stat-val">{result.totalWeightKn.toFixed(1)} kN</strong>
                    <small>{(result.totalWeightKn / 9.81).toFixed(1)} ton</small>
                  </div>
                  <div className="hcad-stat-card">
                    <span className="hcad-stat-label">Doğal Titreşim Periyodu (T1)</span>
                    <strong className="hcad-stat-val">{result.periodSec.toFixed(3)} s</strong>
                    <small>Ct = 0.07 (Betonarme)</small>
                  </div>
                  <div className="hcad-stat-card">
                    <span className="hcad-stat-label">Tasarım Taban Kesmesi (Vt)</span>
                    <strong className="hcad-stat-val">{result.baseShearKn.toFixed(1)} kN</strong>
                    <small>Min Vt: {result.minBaseShearKn.toFixed(1)} kN</small>
                  </div>
                  <div className="hcad-stat-card">
                    <span className="hcad-stat-label">Maks. Göreli Kat Ötelemesi</span>
                    <strong className={`hcad-stat-val ${result.maxDriftRatio <= result.settings.driftLimit ? "text-success" : "text-danger"}`}>
                      %{(result.maxDriftRatio * 100).toFixed(3)}
                    </strong>
                    <small>Limit: %{(result.settings.driftLimit * 100).toFixed(2)}</small>
                  </div>
                </div>

                <div className="hcad-notes-box">
                  <h4>Hesap ve Mevzuat Notları (TBDY 2018 / TS 500)</h4>
                  <ul>
                    {result.summaryNotes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>

                <div className="hcad-quick-vis-actions">
                  <span>Görselleştirme Katmanını Değiştir:</span>
                  <button type="button" onClick={() => { onSetViewMode?.("moment"); onClose(); }}>Moment Diyagramı (M3)</button>
                  <button type="button" onClick={() => { onSetViewMode?.("shear"); onClose(); }}>Kesme Kuvveti (V2)</button>
                  <button type="button" onClick={() => { onSetViewMode?.("capacity"); onClose(); }}>Kapasite Haritası</button>
                  <button type="button" onClick={() => { onSetViewMode?.("none"); onClose(); }}>Normal CAD Modu</button>
                </div>
              </>
            ) : (
              <p>Analiz henüz çalıştırılmadı. Aşağıdaki &quot;Analizi Başlat&quot; butonuna basarak hesap yapabilirsiniz.</p>
            )}
          </div>
        )}

        {activeTab === "storeys" && result && (
          <div className="hcad-table-container">
            <table className="hcad-analysis-table">
              <thead>
                <tr>
                  <th>Kat Adı</th>
                  <th>Kot (m)</th>
                  <th>Kat Yüksekliği (m)</th>
                  <th>Kat Ağırlığı W (kN)</th>
                  <th>Deprem Yükü Fi (kN)</th>
                  <th>Kat Kesmesi Vi (kN)</th>
                  <th>Göreli Öteleme</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {result.storeys.map(st => (
                  <tr key={st.floorId}>
                    <td><strong>{st.name}</strong></td>
                    <td>{st.elevation.toFixed(2)}</td>
                    <td>{st.height.toFixed(2)}</td>
                    <td>{st.totalWeightKn.toFixed(1)}</td>
                    <td>{st.lateralForceKn.toFixed(1)}</td>
                    <td>{st.shearForceKn.toFixed(1)}</td>
                    <td>%{(st.driftRatio * 100).toFixed(3)}</td>
                    <td>
                      <span className={`hcad-status-tag ${st.driftPass ? "pass" : "fail"}`}>
                        {st.driftPass ? "UYGUN" : "AŞILDI"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "columns" && result && (
          <div className="hcad-table-container">
            <table className="hcad-analysis-table">
              <thead>
                <tr>
                  <th>Kolon Adı</th>
                  <th>Eksenel Yük Nd (kN)</th>
                  <th>Nd / (Ac·fcd) (≤0.40)</th>
                  <th>Moment Md (kNm)</th>
                  <th>Kapasite Oranı</th>
                  <th>Boyuna Donatı</th>
                  <th>Sargı Etriyesi</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(result.members).filter(m => m.type === "column").map(col => (
                  <tr key={col.elementId}>
                    <td><strong>{col.name}</strong></td>
                    <td>{col.axialKn.toFixed(1)}</td>
                    <td>
                      <span className={col.axialStressRatio! <= 0.40 ? "text-success" : "text-danger"}>
                        %{(col.axialStressRatio! * 100).toFixed(1)}
                      </span>
                    </td>
                    <td>{col.momentKnm.toFixed(1)}</td>
                    <td>
                      <span className={col.capacityRatio <= 1.0 ? "text-success" : "text-danger"}>
                        {(col.capacityRatio * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td>{col.providedRebarText}</td>
                    <td>Φ8 / {col.confinementSpacingCm} cm</td>
                    <td>
                      <span className={`hcad-status-tag ${col.pass ? "pass" : "fail"}`}>
                        {col.pass ? "UYGUN" : "YETERSİZ"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "beams" && result && (
          <div className="hcad-table-container">
            <table className="hcad-analysis-table">
              <thead>
                <tr>
                  <th>Kiriş Adı</th>
                  <th>Mesnet Momenti (kNm)</th>
                  <th>Tasarım Kesmesi Vd (kN)</th>
                  <th>Kapasite Oranı</th>
                  <th>Gerekli Donatı As (cm²)</th>
                  <th>Önerilen Donatı</th>
                  <th>Etriye Sıklaştırma</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(result.members).filter(m => m.type === "beam").map(beam => (
                  <tr key={beam.elementId}>
                    <td><strong>{beam.name}</strong></td>
                    <td>{beam.momentKnm.toFixed(1)}</td>
                    <td>{beam.shearKn.toFixed(1)}</td>
                    <td>
                      <span className={beam.capacityRatio <= 1.0 ? "text-success" : "text-danger"}>
                        {(beam.capacityRatio * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td>{beam.requiredRebarCm2.toFixed(2)} cm²</td>
                    <td>{beam.providedRebarText}</td>
                    <td>Φ8 / {beam.confinementSpacingCm} cm</td>
                    <td>
                      <span className={`hcad-status-tag ${beam.pass ? "pass" : "fail"}`}>
                        {beam.pass ? "UYGUN" : "YETERSİZ"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "joints" && result && (
          <div className="hcad-table-container">
            <table className="hcad-analysis-table">
              <thead>
                <tr>
                  <th>Kolon Adı</th>
                  <th>Birleşim Türü</th>
                  <th>Ve (kN)</th>
                  <th>Vmax (kN)</th>
                  <th>Ve / Vmax</th>
                  <th>ΣMc / ΣMb</th>
                  <th>Zımbalama Vd/Vpr</th>
                  <th>Tahkik Sonucu</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(result.joints).map(joint => {
                  const moment = result.columnBeamMoments[joint.columnId];
                  const punch = result.punching[joint.columnId];
                  return (
                    <tr key={joint.columnId}>
                      <td><strong>{joint.columnName}</strong></td>
                      <td>{joint.isConfined ? "Kuşatılmış" : "Kuşatılmamış"}</td>
                      <td>{joint.shearDemandKn.toFixed(1)} kN</td>
                      <td>{joint.shearCapacityKn.toFixed(1)} kN</td>
                      <td data-testid="joint-shear-check">
                        <span className={joint.shearRatio <= 1.0 ? "text-success" : "text-danger"}>
                          %{(joint.shearRatio * 100).toFixed(1)}
                        </span>
                      </td>
                      <td>
                        {moment ? (
                          <span className={moment.ratio >= 1.2 ? "text-success" : "text-danger"}>
                            {moment.ratio.toFixed(2)} {moment.ratio >= 1.2 ? "(≥1.20)" : "(<1.20)"}
                          </span>
                        ) : "-"}
                      </td>
                      <td>
                        {punch ? (
                          <span className={punch.punchingRatio <= 1.0 ? "text-success" : "text-danger"}>
                            %{(punch.punchingRatio * 100).toFixed(1)}
                          </span>
                        ) : "-"}
                      </td>
                      <td>
                        <span className={`hcad-status-tag ${joint.pass && (moment?.pass ?? true) && (punch?.pass ?? true) ? "pass" : "fail"}`}>
                          {joint.pass && (moment?.pass ?? true) && (punch?.pass ?? true) ? "UYGUN" : "KONTROL ET"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "irregularities" && result && (
          <div className="hcad-table-container">
            <div className="hcad-irregularity-section">
              <h4>A1 — Burulma Düzensizliği Kontrolü (TBDY 2018 Tablo 3.6, Limit: ηbi ≤ 1.20)</h4>
              <table className="hcad-analysis-table">
                <thead>
                  <tr>
                    <th>Kat Adı</th>
                    <th>Burulma Katsayısı ηbi</th>
                    <th>Düzensizlik Durumu</th>
                    <th>Sonuç</th>
                  </tr>
                </thead>
                <tbody>
                  {result.irregularities.torsionalA1.map(item => (
                    <tr key={item.floorId}>
                      <td><strong>{item.floorName}</strong></td>
                      <td>{item.etaBi.toFixed(2)}</td>
                      <td>{item.hasA1 ? "A1 Düzensizliği Var (ηbi > 1.20)" : "A1 Düzensizliği Yok (Düzenli)"}</td>
                      <td>
                        <span className={`hcad-status-tag ${item.pass ? "pass" : "fail"}`}>
                          {item.pass ? "UYGUN" : "AŞILDI"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h4 style={{ marginTop: "16px" }}>B2 — Komşu Katlar Arası Dayanım / Yumuşak Kat Düzensizliği (Limit: 0.67 ≤ ηki ≤ 1.50)</h4>
              <table className="hcad-analysis-table">
                <thead>
                  <tr>
                    <th>Kat Adı</th>
                    <th>Öteleme Oranı Katsayısı ηki</th>
                    <th>Yumuşak Kat Durumu</th>
                    <th>Sonuç</th>
                  </tr>
                </thead>
                <tbody>
                  {result.irregularities.softStoreyB2.map(item => (
                    <tr key={item.floorId}>
                      <td><strong>{item.floorName}</strong></td>
                      <td>{item.etaKi.toFixed(2)}</td>
                      <td>{item.hasB2 ? "B2 Yumuşak Kat Belirlendi" : "B2 Yumuşak Kat Yok"}</td>
                      <td>
                        <span className={`hcad-status-tag ${item.pass ? "pass" : "fail"}`}>
                          {item.pass ? "UYGUN" : "DİKKAT"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="hcad-settings-form">
            <div className="hcad-form-row">
              <label>
                <span>Beton Sınıfı</span>
                <select value={settings.concreteGrade} onChange={e => setSettings({ ...settings, concreteGrade: e.target.value as AnalysisSettings["concreteGrade"] })}>
                  <option value="C25">C25/30 (fcd = 16.7 MPa)</option>
                  <option value="C30">C30/37 (fcd = 20.0 MPa)</option>
                  <option value="C35">C35/45 (fcd = 23.3 MPa)</option>
                  <option value="C40">C40/50 (fcd = 26.7 MPa)</option>
                </select>
              </label>
              <label>
                <span>Donatı Çeliği Sınıfı</span>
                <select value={settings.rebarGrade} onChange={e => setSettings({ ...settings, rebarGrade: e.target.value as AnalysisSettings["rebarGrade"] })}>
                  <option value="B420C">B420C (fyd = 365 MPa)</option>
                  <option value="B500C">B500C (fyd = 435 MPa)</option>
                </select>
              </label>
            </div>
            <div className="hcad-form-row">
              <label>
                <span>Kısa Periyot Tasarım Spektral İvmesi SDS</span>
                <input type="number" step="0.05" value={settings.sds} onChange={e => setSettings({ ...settings, sds: e.target.valueAsNumber })} />
              </label>
              <label>
                <span>1.0 sn Tasarım Spektral İvmesi SD1</span>
                <input type="number" step="0.05" value={settings.sd1} onChange={e => setSettings({ ...settings, sd1: e.target.valueAsNumber })} />
              </label>
            </div>
            <div className="hcad-form-row">
              <label>
                <span>Taşıyıcı Sistem Davranış Katsayısı R</span>
                <input type="number" step="0.5" value={settings.r} onChange={e => setSettings({ ...settings, r: e.target.valueAsNumber })} />
              </label>
              <label>
                <span>Bina Önem Katsayısı I</span>
                <input type="number" step="0.1" value={settings.importance} onChange={e => setSettings({ ...settings, importance: e.target.valueAsNumber })} />
              </label>
            </div>
            <div className="hcad-form-row">
              <label>
                <span>Hareketli Yük Katılım Katsayısı n</span>
                <input type="number" step="0.1" value={settings.liveLoadParticipation} onChange={e => setSettings({ ...settings, liveLoadParticipation: e.target.valueAsNumber })} />
              </label>
              <label>
                <span>Maks. Göreli Öteleme Limiti (TBDY)</span>
                <input type="number" step="0.001" value={settings.driftLimit} onChange={e => setSettings({ ...settings, driftLimit: e.target.valueAsNumber })} />
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="hcad-analysis-footer">
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" className="hcad-btn-secondary" data-testid="analysis-dxf-export" onClick={() => downloadDxfFile(model)}>
            DXF Çizimini İndir (.dxf)
          </button>
          {result && (
            <button
              type="button"
              className="hcad-btn-primary"
              data-testid="download-static-pdf-btn"
              onClick={() => downloadStaticReportPdf(model, result, result.designResult)}
            >
              Statik Rapor İndir (PDF)
            </button>
          )}
        </div>
        <div className="hcad-footer-right">
          <button type="button" className="hcad-btn-primary" data-testid="run-analysis-btn" onClick={() => onRun(settings)}>
            Analizi Başlat / Yenile
          </button>
          <button type="button" className="hcad-btn-secondary" data-testid="analysis-close-btn" onClick={onClose}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
