'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DuzensizlikSonucu {
  a1: { var: boolean; kademe: 'yok' | 'orta' | 'kritik'; deger: number };
  a2: { var: boolean };
  a3: { var: boolean };
  b1: { var: boolean; deger: number };
  b2: { var: boolean; deger: number };
  b3: { var: boolean; deger: number };
  genelPlan: boolean;
  genelDusey: boolean;
}

export default function DuzensizlikKontroluPage() {
  const [a1DeltaMax, setA1DeltaMax] = useState<number>(0);
  const [a1DeltaOrt, setA1DeltaOrt] = useState<number>(0);
  
  const [a2Checkbox, setA2Checkbox] = useState(false);
  const [a3Checkbox, setA3Checkbox] = useState(false);
  
  const [b1K_i, setB1K_i] = useState<number>(0);
  const [b1K_ust_ort, setB1K_ust_ort] = useState<number>(0);
  
  const [b2K_i, setB2K_i] = useState<number>(0);
  const [b2K_ust, setB2K_ust] = useState<number>(0);
  
  const [b3M_i, setB3M_i] = useState<number>(0);
  const [b3M_komsu, setB3M_komsu] = useState<number>(0);

  const [sonuclar, setSonuclar] = useState<DuzensizlikSonucu | null>(null);

  const hesapla = () => {
    let a1Var = false;
    let a1Kademe: 'yok' | 'orta' | 'kritik' = 'yok';
    let n_bi = 0;
    if (a1DeltaMax && a1DeltaOrt) {
      n_bi = Number(a1DeltaMax) / Number(a1DeltaOrt);
      if (n_bi > 1.4) {
        a1Var = true;
        a1Kademe = 'kritik';
      } else if (n_bi > 1.2) {
        a1Var = true;
        a1Kademe = 'orta';
      }
    }

    let b1Var = false;
    let nki = 0;
    if (b1K_i && b1K_ust_ort) {
      nki = Number(b1K_i) / Number(b1K_ust_ort);
      if (nki < 0.8) b1Var = true;
    }

    let b2Var = false;
    let nci = 0;
    if (b2K_i && b2K_ust) {
      nci = Number(b2K_i) / Number(b2K_ust);
      if (nci < 0.8) b2Var = true;
    }

    let b3Var = false;
    let mi_ratio = 0;
    if (b3M_i && b3M_komsu) {
      mi_ratio = Number(b3M_i) / Number(b3M_komsu);
      if (mi_ratio > 1.5) b3Var = true;
    }

    const planDuzensizlikleri = a1Var || a2Checkbox || a3Checkbox;
    const duseyDuzensizlikler = b1Var || b2Var || b3Var;

    setSonuclar({
      a1: { var: a1Var, kademe: a1Kademe, deger: n_bi },
      a2: { var: a2Checkbox },
      a3: { var: a3Checkbox },
      b1: { var: b1Var, deger: nki },
      b2: { var: b2Var, deger: nci },
      b3: { var: b3Var, deger: mi_ratio },
      genelPlan: planDuzensizlikleri,
      genelDusey: duseyDuzensizlikler
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-2">
          <span className="w-2 h-6 bg-teal-500 rounded-full"></span>
          TBDY 2018 Düzensizlik Kontrolü
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-100 text-lg">Plan Düzensizlikleri (A Grubu)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div className="space-y-2 border border-gray-800 p-3 rounded bg-gray-950/50">
                  <h3 className="text-teal-500 font-medium text-sm">A1 — Burulma Düzensizliği</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400">Maks. Göreli Öteleme (δi_max)</label>
                      <Input type="number" value={a1DeltaMax || ''} onChange={e => setA1DeltaMax(parseFloat(e.target.value) || 0)} className="bg-gray-950 border-gray-800 text-gray-100 h-8 mt-1" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Ort. Göreli Öteleme (δi_ort)</label>
                      <Input type="number" value={a1DeltaOrt || ''} onChange={e => setA1DeltaOrt(parseFloat(e.target.value) || 0)} className="bg-gray-950 border-gray-800 text-gray-100 h-8 mt-1" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border border-gray-800 p-3 rounded bg-gray-950/50">
                  <h3 className="text-teal-500 font-medium text-sm">A2 — Döşeme Süreksizliği</h3>
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={a2Checkbox} onChange={e => setA2Checkbox(e.target.checked)} className="w-4 h-4 accent-teal-500" />
                    Boşluk alanı {'>'} Brüt kat alanının %33&apos;ü
                  </label>
                </div>

                <div className="space-y-2 border border-gray-800 p-3 rounded bg-gray-950/50">
                  <h3 className="text-teal-500 font-medium text-sm">A3 — Planda Çıkıntılar</h3>
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={a3Checkbox} onChange={e => setA3Checkbox(e.target.checked)} className="w-4 h-4 accent-teal-500" />
                    Çıkıntı boyutu {'>'} Binanın o yöndeki boyutunun %20&apos;si
                  </label>
                </div>

              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-100 text-lg">Düşey Düzensizlikler (B Grubu)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div className="space-y-2 border border-gray-800 p-3 rounded bg-gray-950/50">
                  <h3 className="text-teal-500 font-medium text-sm">B1 — Komşu Kat Rijitlik (Yumuşak Kat)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400">i. Kat Rijitliği (ki)</label>
                      <Input type="number" value={b1K_i || ''} onChange={e => setB1K_i(parseFloat(e.target.value) || 0)} className="bg-gray-950 border-gray-800 text-gray-100 h-8 mt-1" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Üst 3 Kat Ort. Rijitliği</label>
                      <Input type="number" value={b1K_ust_ort || ''} onChange={e => setB1K_ust_ort(parseFloat(e.target.value) || 0)} className="bg-gray-950 border-gray-800 text-gray-100 h-8 mt-1" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border border-gray-800 p-3 rounded bg-gray-950/50">
                  <h3 className="text-teal-500 font-medium text-sm">B2 — Komşu Kat Dayanım (Zayıf Kat)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400">i. Kat Etkili Kesme Alanı</label>
                      <Input type="number" value={b2K_i || ''} onChange={e => setB2K_i(parseFloat(e.target.value) || 0)} className="bg-gray-950 border-gray-800 text-gray-100 h-8 mt-1" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Üst Kat Etkili Kesme Alanı</label>
                      <Input type="number" value={b2K_ust || ''} onChange={e => setB2K_ust(parseFloat(e.target.value) || 0)} className="bg-gray-950 border-gray-800 text-gray-100 h-8 mt-1" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border border-gray-800 p-3 rounded bg-gray-950/50">
                  <h3 className="text-teal-500 font-medium text-sm">B3 — Kütlede Düzensizlik</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400">i. Kat Kütlesi (mi)</label>
                      <Input type="number" value={b3M_i || ''} onChange={e => setB3M_i(parseFloat(e.target.value) || 0)} className="bg-gray-950 border-gray-800 text-gray-100 h-8 mt-1" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Komşu Kat Kütlesi (mi±1)</label>
                      <Input type="number" value={b3M_komsu || ''} onChange={e => setB3M_komsu(parseFloat(e.target.value) || 0)} className="bg-gray-950 border-gray-800 text-gray-100 h-8 mt-1" />
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>

            <Button onClick={hesapla} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-6">
              Düzensizlikleri Kontrol Et
            </Button>
          </div>

          <div>
            <Card className="bg-gray-900 border-gray-800 sticky top-6">
              <CardHeader>
                <CardTitle className="text-gray-100">Analiz Sonuçları</CardTitle>
              </CardHeader>
              <CardContent>
                {sonuclar ? (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                        <span className="text-sm text-gray-300">A1 Burulma (ηbi: {sonuclar.a1.deger ? sonuclar.a1.deger.toFixed(2) : '-'})</span>
                        <Badge variant="outline" className={sonuclar.a1.kademe === "kritik" ? "bg-red-900/50 text-red-400 border-red-800" : sonuclar.a1.kademe === "orta" ? "bg-teal-900/50 text-teal-400 border-teal-800" : "bg-green-900/50 text-green-400 border-green-800"}>
                          {sonuclar.a1.kademe === "kritik" ? "KRİTİK (>1.4)" : sonuclar.a1.kademe === "orta" ? "VAR (>1.2)" : "YOK"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                        <span className="text-sm text-gray-300">A2 Döşeme Süreksizliği</span>
                        <Badge variant="outline" className={sonuclar.a2.var ? "bg-red-900/50 text-red-400 border-red-800" : "bg-green-900/50 text-green-400 border-green-800"}>
                          {sonuclar.a2.var ? "VAR" : "YOK"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                        <span className="text-sm text-gray-300">A3 Planda Çıkıntı</span>
                        <Badge variant="outline" className={sonuclar.a3.var ? "bg-red-900/50 text-red-400 border-red-800" : "bg-green-900/50 text-green-400 border-green-800"}>
                          {sonuclar.a3.var ? "VAR" : "YOK"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                        <span className="text-sm text-gray-300">B1 Yumuşak Kat (ηki: {sonuclar.b1.deger ? sonuclar.b1.deger.toFixed(2) : '-'})</span>
                        <Badge variant="outline" className={sonuclar.b1.var ? "bg-red-900/50 text-red-400 border-red-800" : "bg-green-900/50 text-green-400 border-green-800"}>
                          {sonuclar.b1.var ? "VAR" : "YOK"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                        <span className="text-sm text-gray-300">B2 Zayıf Kat (ηci: {sonuclar.b2.deger ? sonuclar.b2.deger.toFixed(2) : '-'})</span>
                        <Badge variant="outline" className={sonuclar.b2.var ? "bg-red-900/50 text-red-400 border-red-800" : "bg-green-900/50 text-green-400 border-green-800"}>
                          {sonuclar.b2.var ? "VAR" : "YOK"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center pb-2">
                        <span className="text-sm text-gray-300">B3 Kütle (Oran: {sonuclar.b3.deger ? sonuclar.b3.deger.toFixed(2) : '-'})</span>
                        <Badge variant="outline" className={sonuclar.b3.var ? "bg-red-900/50 text-red-400 border-red-800" : "bg-green-900/50 text-green-400 border-green-800"}>
                          {sonuclar.b3.var ? "VAR" : "YOK"}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-950 border border-gray-800 rounded-lg">
                      <h4 className="text-teal-500 font-bold mb-2">TBDY 2018 Sonuç Önerisi</h4>
                      {sonuclar.genelPlan || sonuclar.genelDusey ? (
                        <div className="text-sm text-gray-300 space-y-2">
                          <p>Binanızda düzensizlik tespit edildi.</p>
                          {sonuclar.a1.kademe === "kritik" && <p className="text-red-400">- A1 Burulma (ηbi &gt; 1.4): Eşdeğer Deprem Yükü Yöntemi kullanılamaz. Dinamik analiz zorunludur.</p>}
                          {sonuclar.a1.kademe === "orta" && <p className="text-teal-400">- A1 Burulma (1.2 &lt; ηbi ≤ 1.4): A1 düzensizliği var, dış merkezlik etkileri katsayı artırımı yapılarak dikkate alınmalıdır.</p>}
                          {sonuclar.b1.var && <p className="text-red-400">- B1 Yumuşak Kat durumu mevcut. Dinamik analiz zorunludur.</p>}
                          {sonuclar.b2.var && <p className="text-red-400">- B2 Zayıf Kat (ηci &lt; 0.8) durumunda taşıyıcı sistem rijitliği artırılmalıdır.</p>}
                        </div>
                      ) : (
                        <p className="text-sm text-green-400">Kontrol edilen kriterlere göre binada belirgin bir plan veya düşey düzensizlik tespit edilmemiştir.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm py-12">
                    Değerleri girip &quot;Düzensizlikleri Kontrol Et&quot; butonuna tıklayın.
                  </div>
                )}
              </CardContent>
              <div className="px-6 pb-6 text-xs text-gray-600">
                Referans: TBDY 2018 Tablo 3.6 (Düzensizlik Durumları)
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
