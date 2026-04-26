'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ZeminSinifiPage() {
  const [hesapTuru, setHesapTuru] = useState<"vs30" | "spt" | "su">('vs30');
  const [deger, setDeger] = useState<number | ''>('');
  const [zfRisk, setZfRisk] = useState(false);
  const [sonuc, setSonuc] = useState<{ sinif: string; aciklama: string; isRisk: boolean } | null>(null);

  const handleHesapTuruChange = (val: string) => {
    if (val === 'vs30' || val === 'spt' || val === 'su') {
      setHesapTuru(val);
      setDeger('');
      setSonuc(null);
    }
  };

  const hesapla = () => {
    if (zfRisk) {
      setSonuc({ sinif: 'ZF', aciklama: 'Saha özel inceleme zorunlu', isRisk: true });
      return;
    }
    if (deger === '') return;
    const val = Number(deger);

    let sinif = '';
    let aciklama = '';
    let isRisk = false;

    if (hesapTuru === 'vs30') {
      if (val > 1500) {
        sinif = 'ZA';
        aciklama = 'Sağlam kayaç';
      } else if (val >= 760 && val <= 1500) {
        sinif = 'ZB';
        aciklama = 'Az ayrışmış kayaç';
      } else if (val >= 360 && val < 760) {
        sinif = 'ZC';
        aciklama = 'Sıkı kum/çakıl veya çok katı kil';
      } else if (val >= 180 && val < 360) {
        sinif = 'ZD';
        aciklama = 'Orta sıkı zemin';
      } else {
        sinif = 'ZE';
        aciklama = 'Gevşek zemin';
        isRisk = true;
      }
    } else if (hesapTuru === 'spt') {
      if (val > 50) {
        sinif = 'ZC';
        aciklama = 'Sıkı kum/çakıl veya çok katı kil';
      } else if (val >= 15 && val <= 50) {
        sinif = 'ZD';
        aciklama = 'Orta sıkı zemin';
      } else {
        sinif = 'ZE';
        aciklama = 'Gevşek zemin';
        isRisk = true;
      }
    } else if (hesapTuru === 'su') {
      if (val > 250) {
        sinif = 'ZC';
        aciklama = 'Sıkı kum/çakıl veya çok katı kil';
      } else if (val >= 70 && val <= 250) {
        sinif = 'ZD';
        aciklama = 'Orta sıkı zemin';
      } else {
        sinif = 'ZE';
        aciklama = 'Gevşek zemin';
        isRisk = true;
      }
    }

    setSonuc({ sinif, aciklama, isRisk });
  };

  const tableData = [
    { s: 'ZA', vs: '> 1500', spt: '—', su: '—', desc: 'Sağlam kayaç' },
    { s: 'ZB', vs: '760–1500', spt: '—', su: '—', desc: 'Az ayrışmış kayaç' },
    { s: 'ZC', vs: '360–760', spt: '> 50', su: '> 250', desc: 'Sıkı kum/çakıl' },
    { s: 'ZD', vs: '180–360', spt: '15–50', su: '70–250', desc: 'Orta sıkı zemin' },
    { s: 'ZE', vs: '< 180', spt: '< 15', su: '< 70', desc: 'Gevşek zemin' },
    { s: 'ZF', vs: '—', spt: '—', su: '—', desc: 'Özel (Likit. riski vb.)', risk: true },
  ];

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-100">
          <span className="h-6 w-2 rounded-full bg-teal-500"></span>
          Zemin Sınıfı Belirleyici (TBDY 2018)
        </h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="text-gray-100">Giriş Parametreleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Değerlendirme Kriteri</label>
                <Select value={hesapTuru} onValueChange={handleHesapTuruChange}>
                  <SelectTrigger className="border-gray-800 bg-gray-950 text-gray-100 focus:ring-teal-500">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-800 bg-gray-900 text-gray-100">
                    <SelectItem value="vs30">Vs30 Kayma Dalga Hızı (m/s)</SelectItem>
                    <SelectItem value="spt">SPT N60 Darbe Sayısı</SelectItem>
                    <SelectItem value="su">Su Drenajsız Kesme Dayanımı (kPa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 rounded border border-gray-800 bg-gray-950/50 p-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={zfRisk}
                    onChange={(event) => {
                      setZfRisk(event.target.checked);
                      setSonuc(null);
                    }}
                    className="h-4 w-4 accent-red-500"
                  />
                  Sıvılaşma riski / aktif fay hattı / yüksek plastisiteli kil mevcut
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">
                  {hesapTuru === 'vs30' && 'Vs30 (m/s)'}
                  {hesapTuru === 'spt' && 'N60 (Darbe/30cm)'}
                  {hesapTuru === 'su' && 'Su (kPa)'}
                </label>
                <Input
                  type="number"
                  value={deger}
                  onChange={(event) => setDeger(event.target.value === '' ? '' : Number(event.target.value))}
                  className="border-gray-800 bg-gray-950 text-lg text-gray-100 focus-visible:ring-teal-500"
                  placeholder="Değeri giriniz..."
                />
              </div>

              <Button onClick={hesapla} className="w-full bg-teal-600 py-6 font-bold text-white hover:bg-teal-700">
                Zemin Sınıfını Belirle
              </Button>

              {sonuc ? (
                <div className="border-t border-gray-800 pt-4">
                  <div className={`rounded-lg border p-6 text-center ${sonuc.isRisk ? 'border-red-900 bg-red-950' : 'border-gray-800 bg-gray-950'}`}>
                    <div className="mb-1 text-sm text-gray-400">Tespit Edilen Yerel Zemin Sınıfı</div>
                    <div className={`mb-2 text-5xl font-extrabold font-mono ${sonuc.isRisk ? 'text-red-500' : 'text-teal-500'}`}>
                      {sonuc.sinif}
                    </div>
                    <div className="font-medium text-gray-300">{sonuc.aciklama}</div>
                    {sonuc.isRisk ? (
                      <div className="mt-3 rounded bg-red-900/30 px-4 py-2 text-sm font-bold text-red-400">
                        UYARI: Bu zemin sınıfında (ZE/ZF) sahaya özel zemin davranışı analizi yapılması zorunludur.
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="text-gray-100">Zemin Sınıfları Tablosu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-left text-gray-400">
                      <th className="px-4 py-2">Sınıf</th>
                      <th className="px-4 py-2">Vs30</th>
                      <th className="px-4 py-2">SPT</th>
                      <th className="px-4 py-2">Su</th>
                      <th className="px-4 py-2">Açıklama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row) => (
                      <tr key={row.s} className={`border-b border-gray-800 ${row.risk ? 'bg-red-950/30' : ''}`}>
                        <td className={`px-4 py-2 font-mono font-bold ${row.risk ? 'text-red-400' : 'text-teal-500'}`}>{row.s}</td>
                        <td className="px-4 py-2 font-mono text-right text-gray-400">{row.vs}</td>
                        <td className="px-4 py-2 font-mono text-right text-gray-400">{row.spt}</td>
                        <td className="px-4 py-2 font-mono text-right text-gray-400">{row.su}</td>
                        <td className="px-4 py-2 text-gray-300">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
