import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, Calculator, CheckSquare, Compass } from 'lucide-react';

const araclar = [
  {
    title: 'Eşdeğer Deprem Yükü Hesabı',
    description: 'TBDY 2018 §4.3 kapsamında toplam taban kesme kuvveti ve katlara etkiyen yatay yüklerin hesaplanması.',
    href: '/deprem-yonetmelik/araclar/esit-deprem-yuku',
    icon: <Calculator className="w-6 h-6 text-teal-500" />,
  },
  {
    title: 'Düzensizlik Kontrolü',
    description: 'TBDY 2018 Tablo 3.6 uyarınca A1-A3 ve B1-B3 plan ve düşey düzensizliklerinin interaktif kontrolü.',
    href: '/deprem-yonetmelik/araclar/duzensizlik-kontrolu',
    icon: <CheckSquare className="w-6 h-6 text-teal-500" />,
  },
  {
    title: 'Zemin Sınıfı Belirleyici',
    description: 'Vs30, SPT N60 veya Su değerlerine göre TBDY 2018 Tablo 2.1 zemin sınıfı tayini.',
    href: '/deprem-yonetmelik/araclar/zemin-sinifi',
    icon: <Compass className="w-6 h-6 text-teal-500" />,
  }
];

export default function AraclarGrid() {
  return (
    <section className="py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <span className="w-2 h-6 bg-teal-500 rounded-full"></span>
          İnteraktif Hesap Araçları
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {araclar.map((arac, i) => (
            <Link key={i} href={arac.href} className="group">
              <Card className="h-full bg-gray-900 border-gray-800 border-l-4 border-l-teal-500 hover:border-teal-500 hover:shadow-[0_0_15px_rgba(13, 148, 136,0.15)] transition-all duration-300">
                <CardHeader>
                  <div className="mb-4 bg-gray-950/50 w-12 h-12 rounded-lg flex items-center justify-center border border-gray-800 group-hover:border-teal-500/50 transition-colors">
                    {arac.icon}
                  </div>
                  <CardTitle className="text-gray-100 group-hover:text-teal-500 transition-colors">{arac.title}</CardTitle>
                  <CardDescription className="text-gray-400 mt-2 line-clamp-3">
                    {arac.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-medium text-teal-500 group-hover:text-teal-400 transition-colors">
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
