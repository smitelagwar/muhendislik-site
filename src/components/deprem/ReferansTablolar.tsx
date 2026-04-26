import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ReferansTablolar() {
  return (
    <section className="py-12 px-6 bg-gray-950/50 border-y border-gray-800">
      <div className="max-w-7xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <span className="w-2 h-6 bg-teal-500 rounded-full"></span>
          TBDY 2018 Hızlı Referans Tabloları
        </h2>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-1">
          <Accordion type="single" collapsible className="w-full">
            
            <AccordionItem value="bks" className="border-gray-800 px-4">
              <AccordionTrigger className="text-gray-200 hover:text-teal-500">
                Bina Kullanım Sınıfı (BKS) ve Önem Katsayısı (I)
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="text-gray-400">BKS</TableHead>
                        <TableHead className="text-gray-400">Bina Kullanım Amacı</TableHead>
                        <TableHead className="text-gray-400 text-right">Bina Önem Katsayısı (I)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="font-mono text-teal-500">3</TableCell>
                        <TableCell className="text-gray-300">Deprem sonrası kullanımı gereken binalar (Hastane, itfaiye, okul vb.), tehlikeli madde içeren binalar</TableCell>
                        <TableCell className="text-right font-mono text-gray-100">1.5</TableCell>
                      </TableRow>
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="font-mono text-teal-500">2</TableCell>
                        <TableCell className="text-gray-300">İnsanların uzun süreli ve yoğun olarak bulunduğu binalar (AVM, sinema, stadyum), çok katlı konutlar</TableCell>
                        <TableCell className="text-right font-mono text-gray-100">1.2</TableCell>
                      </TableRow>
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="font-mono text-teal-500">1</TableCell>
                        <TableCell className="text-gray-300">Diğer tüm binalar (Normal konutlar, işyerleri, oteller, endüstriyel yapılar)</TableCell>
                        <TableCell className="text-right font-mono text-gray-100">1.0</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="katsayilar" className="border-gray-800 px-4">
              <AccordionTrigger className="text-gray-200 hover:text-teal-500">
                R ve D Katsayıları (Seçilmiş Betonarme Sistemler)
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="text-gray-400">Taşıyıcı Sistem Türü</TableHead>
                        <TableHead className="text-gray-400 text-center">Davranış Katsayısı (R)</TableHead>
                        <TableHead className="text-gray-400 text-center">Dayanım Fazlalığı Katsayısı (D)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="text-gray-300">Boşluksuz perdeli sistemler</TableCell>
                        <TableCell className="text-center font-mono text-gray-100">6</TableCell>
                        <TableCell className="text-center font-mono text-gray-100">2.5</TableCell>
                      </TableRow>
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="text-gray-300">Bağ kirişli (boşluklu) perdeli sistemler</TableCell>
                        <TableCell className="text-center font-mono text-gray-100">7</TableCell>
                        <TableCell className="text-center font-mono text-gray-100">2.5</TableCell>
                      </TableRow>
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="text-gray-300">eerçeve + Perde (Perde taban kesme kuvvetinin 775&apos;inden fazlasını alıyorsa)</TableCell>
                        <TableCell className="text-center font-mono text-gray-100">7</TableCell>
                        <TableCell className="text-center font-mono text-gray-100">2.5</TableCell>
                      </TableRow>
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="text-gray-300">eerçeve + Perde (Süneklik düzeyi yüksek)</TableCell>
                        <TableCell className="text-center font-mono text-gray-100">7</TableCell>
                        <TableCell className="text-center font-mono text-gray-100">2.5</TableCell>
                      </TableRow>
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="text-gray-300">Sadece çerçeveli sistemler (Süneklik düzeyi yüksek)</TableCell>
                        <TableCell className="text-center font-mono text-gray-100">8</TableCell>
                        <TableCell className="text-center font-mono text-gray-100">3.0</TableCell>
                      </TableRow>
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="text-gray-300">Süneklik düzeyi karma sistemler (eerçeve sınırlı, perde yüksek sünek)</TableCell>
                        <TableCell className="text-center font-mono text-gray-100">5</TableCell>
                        <TableCell className="text-center font-mono text-gray-100">2.5</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="performans" className="border-gray-800 px-4">
              <AccordionTrigger className="text-gray-200 hover:text-teal-500">
                Performans Hedefleri (TBDY Tablo 3.4)
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="text-gray-400">Deprem Yer Hareketi Düzeyi</TableHead>
                        <TableHead className="text-gray-400">Normal Binalar (BKS=1, 2)</TableHead>
                        <TableHead className="text-gray-400">Önemli Binalar (BKS=3)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="font-medium text-gray-300">DD-1 (50 yılda aşılma 72, Tekrarlanma 2475 yıl)</TableCell>
                        <TableCell className="text-gray-400">Göçmenin Önlenmesi (GÖ)</TableCell>
                        <TableCell className="text-teal-500">Göçmenin Önlenmesi (GÖ) / Kontrollü Hasar (KH)*</TableCell>
                      </TableRow>
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="font-medium text-gray-300">DD-2 (50 yılda aşılma 710, Tekrarlanma 475 yıl)</TableCell>
                        <TableCell className="text-teal-500">Kontrollü Hasar (KH) [Tasarım Depremi]</TableCell>
                        <TableCell className="text-gray-400">Sınırlı Hasar (SH)</TableCell>
                      </TableRow>
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="font-medium text-gray-300">DD-3 (50 yılda aşılma 750, Tekrarlanma 72 yıl)</TableCell>
                        <TableCell className="text-gray-400">-</TableCell>
                        <TableCell className="text-teal-500">Sınırlı Hasar (SH)</TableCell>
                      </TableRow>
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="font-medium text-gray-300">DD-4 (50 yılda aşılma 768, Tekrarlanma 43 yıl)</TableCell>
                        <TableCell className="text-gray-400">-</TableCell>
                        <TableCell className="text-gray-400">Kesintisiz Kullanım (KK)</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <p className="text-xs text-gray-500 mt-2">* Yapı türüne ve yüksekliğe göre değişiklik gösterebilir. (Bkz. TBDY 2018 Bölüm 3)</p>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </div>
    </section>
  );
}
