import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, Calculator, CheckSquare, Compass } from 'lucide-react';

const araclar = [
  {
    title: 'Eşdeğer Deprem Yükü Hesabı',
    description: 'TBDY 2018 §4.3 kapsamında toplam taban kesme kuvveti ve katlara etkiyen yatay yüklerin hesaplanması.',
    href: '/deprem-yonetmelik/araclar/esit-deprem-yuku',
    icon: <Calculator className="w-6 h-6 text-amber-400" />,
  },
  {
    title: 'Düzensizlik Kontrolü',
    description: 'TBDY 2018 Tablo 3.6 uyarınca A1-A3 ve B1-B3 plan ve düşey düzensizliklerinin interaktif kontrolü.',
    href: '/deprem-yonetmelik/araclar/duzensizlik-kontrolu',
    icon: <CheckSquare className="w-6 h-6 text-amber-400" />,
  },
  {
    title: 'Zemin Sınıfı Belirleyici',
    description: 'Vs30, SPT N60 veya Su değerlerine göre TBDY 2018 Tablo 2.1 zemin sınıfı tayini.',
    href: '/deprem-yonetmelik/araclar/zemin-sinifi',
    icon: <Compass className="w-6 h-6 text-amber-400" />,
  }
];

export default function AraclarGrid() {
  return (
    <section className="py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <span className="h-6 w-1 rounded-sm bg-amber-500"></span>
          İnteraktif Hesap Araçları
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {araclar.map((arac, i) => (
            <Link key={i} href={arac.href} className="group">
              <Card className="site-link-card h-full rounded-xl border-gray-800 border-l-4 border-l-amber-500 bg-gray-900 hover:border-blue-500/50">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-gray-800 bg-gray-950/50 transition-colors group-hover:border-amber-500/50">
                    {arac.icon}
                  </div>
                  <CardTitle className="text-gray-100 transition-colors group-hover:text-blue-300">{arac.title}</CardTitle>
                  <CardDescription className="text-gray-400 mt-2 line-clamp-3">
                    {arac.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-medium text-amber-400 transition-colors group-hover:text-amber-300">
                    Aracı Kullan <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
