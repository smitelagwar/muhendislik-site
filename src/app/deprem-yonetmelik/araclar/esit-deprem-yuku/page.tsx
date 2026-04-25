'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HesapSonucu {
  Vt: number;
  minVt: number;
  Ra: number;
  katSonuclari: { id: number; wi: number; hi: number; fi: number }[];
  uyari: string;
}

export default function EsdegerDepremYukuPage() {
  const [W, setW] = useState<number>(10000);
  const [SaR, setSaR] = useState<number>(1.2);
  const [SDS, setSDS] = useState<number>(1.0);
  const [T1, setT1] = useState<number>(0.5);
  const [TB, setTB] = useState<number>(0.6);
  const [I, setI] = useState("1.0");
  const [R, setR] = useState("7");
  const [D, setD] = useState("2.5");
  const [HN, setHN] = useState<number>(18);
  
  const [katlar, setKatlar] = useState([
    { id: 1, wi: 2000, hi: 3 },
    { id: 2, wi: 2000, hi: 6 },
    { id: 3, wi: 2000, hi: 9 },
    { id: 4, wi: 2000, hi: 12 },
    { id: 5, wi: 2000, hi: 15 },
    { id: 6, wi: 2000, hi: 18 },
  ]);

  const [sonuc, setSonuc] = useState<HesapSonucu | null>(null);

  const hesapla = () => {
    const numW = Number(W) || 0;
    const numSaR = Number(SaR) || 0;
    const numSDS = Number(SDS) || 0;
    const numT1 = Number(T1) || 0;
    const numTB = Number(TB) || 0;
    const numI = Number(I) || 1.0;
    const numR = Number(R) || 1.0;
    const numD = Number(D) || 1.0;

    let Ra = (numD * numR) / numI;
    if (numT1 < numTB) {
      Ra = 1 + ((numD * numR) / numI - 1) * (numT1 / numTB);
    }

    let Vt = (numW * numSaR) / Ra;
    
    const minVt = 0.04 * numI * numSDS * numW;
    let uyari = "";
    if (Vt < minVt) {
      Vt = minVt;
      uyari = "Minimum taban kesme kuvveti (0.04 * I * SDS * W) sınırı uygulandı.";
    }

    const V_dagitilacak = Vt;
    const sumWH = katlar.reduce((acc, kat) => acc + (kat.wi * kat.hi), 0);

    const katSonuclari = katlar.map((kat) => {
      let fi = 0;
      if (sumWH > 0) {
        fi = ((kat.wi * kat.hi) / sumWH) * V_dagitilacak;
      }
      return { ...kat, fi: fi };
    });

    setSonuc({ Vt: Vt, minVt: minVt, Ra: Ra, katSonuclari: katSonuclari, uyari: uyari });
  };

  const katEkle = () => {
    if (katlar.length >= 20) return;
    const newId = katlar.length + 1;
    setKatlar([...katlar, { id: newId, wi: 2000, hi: newId * 3 }]);
  };

  const katCikar = () => {
    if (katlar.length <= 1) return;
    setKatlar(katlar.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-2">
          <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
          Eşdeğer Deprem Yükü Hesabı (TBDY 2018)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">Bina Parametreleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Toplam Ağırlık W (kN)</label>
                  <Input type="number" value={W || ''} onChange={e => setW(parseFloat(e.target.value) || 0)} className="bg-gray-950 border-gray-800 text-gray-100 focus-visible:ring-amber-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Bina Yüksekliği HN (m)</label>
                  <Input type="number" value={HN || ''} onChange={e => setHN(parseFloat(e.target.value) || 0)} className="bg-gray-950 border-gray-800 text-gray-100 focus-visible:ring-amber-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Spektral İvme SaR (g)</label>
                  <Input type="number" step="0.01" value={SaR || ''} onChange={e => setSaR(parseFloat(e.target.value) || 0)} className="bg-gray-950 border-gray-800 text-gray-100 focus-visible:ring-amber-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Kısa Periyot SDS</label>
                  <Input type="number" step="0.01" value={SDS || ''} onChange={e => setSDS(parseFloat(e.target.value) || 0)} className="bg-gray-950 border-gray-800 text-gray-100 focus-visible:ring-amber-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Bina Önem Katsayısı (I)</label>
                  <Select value={I} onValueChange={setI}>
                    <SelectTrigger className="bg-gray-950 border-gray-800 text-gray-100 focus:ring-amber-500">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800 text-gray-100">
                      <SelectItem value="0.8">0.8</SelectItem>
                      <SelectItem value="1.0">1.0</SelectItem>
                      <SelectItem value="1.2">1.2</SelectItem>
                      <SelectItem value="1.5">1.5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Periyot T1 (sn)</label>
                  <Input type="number" step="0.01" value={T1 || ''} onChange={e => setT1(parseFloat(e.target.value) || 0)} className="bg-gray-950 border-gray-800 text-gray-100 focus-visible:ring-amber-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Spektrum TB (sn)</label>
                  <Input type="number" step="0.01" value={TB || ''} onChange={e => setTB(parseFloat(e.target.value) || 0)} className="bg-gray-950 border-gray-800 text-gray-100 focus-visible:ring-amber-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Davranış Katsayısı (R)</label>
                  <Select value={R} onValueChange={setR}>
                    <SelectTrigger className="bg-gray-950 border-gray-800 text-gray-100 focus:ring-amber-500">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800 text-gray-100">
                      {[3,4,5,6,7,8].map(v => <SelectItem key={v} value={v.toString()}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Dayanım Fazlalığı (D)</label>
                  <Select value={D} onValueChange={setD}>
                    <SelectTrigger className="bg-gray-950 border-gray-800 text-gray-100 focus:ring-amber-500">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800 text-gray-100">
                      {[1.5, 2.0, 2.5, 3.0].map(v => <SelectItem key={v} value={v.toString()}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-200">Kat Bilgileri (Ağırlık ve Yükseklik)</label>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={katCikar} className="border-gray-700 text-gray-300 hover:bg-gray-800">- Çıkar</Button>
                    <Button variant="outline" size="sm" onClick={katEkle} className="border-gray-700 text-gray-300 hover:bg-gray-800">+ Ekle</Button>
                  </div>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 border border-gray-800 rounded p-2">
                  {katlar.map((kat, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2 items-center">
                      <div className="text-xs text-gray-500 text-center">{kat.id}. Kat</div>
                      <Input 
                        type="number" 
                        value={kat.wi || ''} 
                        onChange={e => {
                          const newKatlar = [...katlar];
                          newKatlar[index].wi = parseFloat(e.target.value) || 0;
                          setKatlar(newKatlar);
                        }}
                        placeholder="wi (kN)"
                        className="bg-gray-950 border-gray-800 text-gray-100 h-8 text-sm" 
                      />
                      <Input 
                        type="number" 
                        value={kat.hi || ''} 
                        onChange={e => {
                          const newKatlar = [...katlar];
                          newKatlar[index].hi = parseFloat(e.target.value) || 0;
                          setKatlar(newKatlar);
                        }}
                        placeholder="hi (m)"
                        className="bg-gray-950 border-gray-800 text-gray-100 h-8 text-sm" 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={hesapla} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-6">
                Hesapla
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">Sonuçlar</CardTitle>
            </CardHeader>
            <CardContent>
              {sonuc ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 p-4 bg-gray-950 rounded-lg border border-gray-800">
                    <div>
                      <div className="text-xs text-gray-500">Azaltılmış Spektral İvme (Ra)</div>
                      <div className="text-xl font-mono text-gray-100">{sonuc.Ra.toFixed(3)}</div>
                    </div>
                    <div className="border-t border-gray-800 pt-3">
                      <div className="text-xs text-gray-500">Toplam Taban Kesme Kuvveti (Vt)</div>
                      <div className="text-3xl font-mono text-amber-500">{sonuc.Vt.toFixed(2)} kN</div>
                      {sonuc.uyari && <p className="text-xs text-red-400 mt-1">{sonuc.uyari}</p>}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Katlara Etkiyen Kuvvetler (Fi)</h3>
                    <div className="max-h-60 overflow-y-auto border border-gray-800 rounded">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-950 text-gray-400 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 font-medium">Kat</th>
                            <th className="px-4 py-2 font-medium text-right">hi (m)</th>
                            <th className="px-4 py-2 font-medium text-right">wi (kN)</th>
                            <th className="px-4 py-2 font-medium text-right">Fi (kN)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {sonuc.katSonuclari.map((kat: HesapSonucu['katSonuclari'][number]) => (
                            <tr key={kat.id} className="hover:bg-gray-800/50">
                              <td className="px-4 py-2 text-gray-300">{kat.id}. Kat</td>
                              <td className="px-4 py-2 text-right text-gray-400 font-mono">{kat.hi}</td>
                              <td className="px-4 py-2 text-right text-gray-400 font-mono">{kat.wi}</td>
                              <td className="px-4 py-2 text-right text-amber-500 font-mono font-medium">{kat.fi.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm py-12">
                  Hesaplama yapmak için sol taraftan parametreleri girip &quot;Hesapla&quot; butonuna tıklayın.
                </div>
              )}
            </CardContent>
            <div className="px-6 pb-6 text-xs text-gray-600">
              Referans: TBDY 2018 §4.3 (Eşdeğer Deprem Yükü Yöntemi)
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
