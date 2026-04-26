"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, ChevronDown } from 'lucide-react';
import data from '@/lib/data.json';

// Type for the data.json entries
type ArticleData = {
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryColor?: string;
  date: string;
  readTime: string;
  image?: string;
  sectionId: string;
  keywords?: string[];
  badgeLabel?: string;
};

function isArticleData(value: unknown): value is ArticleData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    "slug" in value &&
    "title" in value &&
    "description" in value &&
    "category" in value &&
    "date" in value &&
    "readTime" in value &&
    "sectionId" in value
  );
}

export default function BlogMakalelerGrid() {
  const [visibleCount, setVisibleCount] = useState(9);
  
  // Filter articles from data.json that belong to deprem-yonetmelik
  // Also we can keep the ones from deprem-makaleler if we want, but the prompt says 
  // "İçerik kaynağı src/lib/data.json dosyasıdır."
  const allMakaleler = Object.values(data)
    .filter(isArticleData)
    .filter(item => item.sectionId === 'deprem-yonetmelik');

  const visibleMakaleler = allMakaleler.slice(0, visibleCount);
  
  const handleShowMore = () => {
    setVisibleCount(prev => prev + 9);
  };

  return (
    <section className="py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
          TBDY 2018 Teknik Makaleler ({allMakaleler.length})
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleMakaleler.map((makale, i) => {
            // Provide a default image if none exists
            const fallbackImage = "https://images.unsplash.com/photo-1541888081-30eb3f350481?q=80&w=800&auto=format&fit=crop";
            const imageUrl = makale.image && makale.image.startsWith('/') 
              ? makale.image 
              : fallbackImage;

            return (
              <Link key={i} href={`/kategori/deprem-yonetmelik/${makale.slug}`} className="group flex flex-col">
                <Card className="h-full flex flex-col bg-gray-900 border-none rounded-xl overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all duration-300">
                  <div className="relative h-48 w-full overflow-hidden bg-gray-800">
                    <Image
                      src={imageUrl}
                      alt={makale.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                    {makale.badgeLabel && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-amber-500 text-gray-950 font-bold hover:bg-amber-400">
                          {makale.badgeLabel}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="flex-1 pt-4 px-5">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {makale.keywords && makale.keywords.slice(0, 2).map((etiket, j) => (
                        <span key={j} className="text-xs font-semibold text-amber-500 tracking-wider uppercase">
                          {etiket}
                        </span>
                      ))}
                      {(!makale.keywords || makale.keywords.length === 0) && (
                        <span className="text-xs font-semibold text-amber-500 tracking-wider uppercase">
                          {makale.category}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-100 group-hover:text-amber-500 transition-colors line-clamp-2">
                      {makale.title}
                    </CardTitle>
                    <CardDescription className="text-gray-400 mt-2 line-clamp-2 text-sm leading-relaxed">
                      {makale.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardFooter className="px-5 pb-5 pt-0 flex items-center justify-between text-xs font-medium text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{makale.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{makale.readTime}</span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>

        {visibleCount < allMakaleler.length && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleShowMore}
              className="group flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-lg transition-colors border border-gray-700 hover:border-gray-600"
            >
              Daha Fazla Göster
              <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
