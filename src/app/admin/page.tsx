"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, LogOut, Check, X, FileText, Settings, Image as ImageIcon, ArrowUp, ArrowDown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { m, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface Section {
    id: string;
    title: string;
    content: string;
}

interface Article {
    slug: string;
    title: string;
    description: string;
    category: string;
    categoryColor: string;
    badgeLabel: string;
    author: string;
    authorTitle: string;
    date: string;
    readTime: string;
    image: string;
    quote?: { text: string };
    sections: Section[];
    relatedSlugs: string[];
}

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");

    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [currentArticle, setCurrentArticle] = useState<any>(null);

    // Initial load checks
    useEffect(() => {
        const storedAuth = localStorage.getItem("admin_auth");
        if (storedAuth === "true") {
            setIsAuthenticated(true);
            fetchArticles();
        } else {
            setIsLoading(false);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === "admin123" || password === "123456") {
            setIsAuthenticated(true);
            localStorage.setItem("admin_auth", "true");
            toast.success("Başarıyla giriş yapıldı.");
            fetchArticles();
        } else {
            toast.error("Hatalı şifre!");
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem("admin_auth");
        setPassword("");
        toast.info("Çıkış yapıldı.");
    };

    const fetchArticles = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/articles");
            if (!res.ok) throw new Error("Veri çekilemedi");
            const data = await res.json();
            if (data && typeof data === "object") {
                setArticles(Object.values(data));
            }
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("İçerikler yüklenirken bir hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (slug: string) => {
        if (!confirm("Bu içeriği kalıcı olarak silmek istediğinize emin misiniz?")) return;
        try {
            await fetch(`/api/articles?slug=${slug}`, { method: 'DELETE' });
            toast.success("Makale başarıyla silindi.");
            fetchArticles();
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Silme işlemi başarısız oldu.");
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/articles", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentArticle)
            });
            if (!res.ok) throw new Error("Kaydedilemedi");

            setIsEditing(false);
            setCurrentArticle(null);
            fetchArticles();
            toast.success("Değişiklikler başarıyla kaydedildi ve yayınlandı!");
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Makale kaydedilirken bir hata oluştu.");
        }
    };

    const startNewArticle = () => {
        setCurrentArticle({
            slug: "",
            title: "",
            description: "",
            category: "Şantiye Notu",
            categoryColor: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400",
            badgeLabel: "Yeni",
            author: "Admin Editör",
            authorTitle: "Yönetici",
            date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
            readTime: "5 dk okuma",
            image: "https://images.unsplash.com/photo-1541888081622-4a004bbf63e5?q=80&w=2000&auto=format&fit=crop",
            quote: { text: "İçerikle ilgili dikkat çekici bir alıntı veya söz yazın." },
            sections: [{ id: "giris", title: "1. Giriş", content: "İlk paragraf buraya..." }],
            relatedSlugs: []
        });
        setIsEditing(true);
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newSections = [...currentArticle.sections];
        if (direction === 'up' && index > 0) {
            const temp = newSections[index - 1];
            newSections[index - 1] = newSections[index];
            newSections[index] = temp;
        } else if (direction === 'down' && index < newSections.length - 1) {
            const temp = newSections[index + 1];
            newSections[index + 1] = newSections[index];
            newSections[index] = temp;
        }
        setCurrentArticle({ ...currentArticle, sections: newSections });
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl shadow-blue-900/5 border border-zinc-200 dark:border-zinc-800 w-full max-w-sm relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    <div className="mb-8 text-center flex flex-col items-center">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 text-blue-700 dark:text-blue-500">
                            <Settings className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Yönetim Paneli</h2>
                        <p className="text-sm text-zinc-500 mt-1">Sisteme erişmek için şifrenizi girin.</p>
                    </div>
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <Input
                            type="password"
                            placeholder="*************"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="bg-zinc-100 dark:bg-zinc-800 h-11 border-transparent focus:bg-white dark:focus:bg-zinc-950 dark:border-zinc-700"
                        />
                        <Button type="submit" className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-white font-semibold">
                            Sisteme Gir
                        </Button>
                        <p className="text-xs text-center text-zinc-400 mt-2 font-mono">auth: admin123</p>
                    </form>
                </m.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F6F6F7] dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50 flex flex-col">
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg">
                            <Settings className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">Portal <span className="text-zinc-400 font-normal">Workspace</span></span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={() => window.open('/', '_blank')}>
                            Siteyi Görüntüle
                        </Button>
                        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800"></div>
                        <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white" onClick={handleLogout}>
                            <LogOut className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Güvenli Çıkış</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 md:p-8">
                {isEditing && currentArticle ? (
                    <m.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-6"
                    >
                        {/* Editör Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    <Edit2 className="w-6 h-6 text-blue-600" /> İçerik Düzenleyici
                                </h1>
                                <p className="text-sm text-zinc-500 mt-1">Değişiklikler anında canlı ortama yansır.</p>
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setIsEditing(false)}>
                                    <X className="w-4 h-4 mr-2" /> İptal Et
                                </Button>
                                <Button onClick={handleSave} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">
                                    <Check className="w-4 h-4 mr-2" /> Yayınla
                                </Button>
                            </div>
                        </div>

                        <form id="article-form" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Ana Düzenleme Alanı (Sol %66) */}
                            <div className="lg:col-span-2 flex flex-col gap-8">

                                {/* Temel Bilgiler Kartı */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                                    <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 font-semibold flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-zinc-500" /> Temel İçerik Bilgileri
                                    </div>
                                    <div className="p-6 flex flex-col gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold flex items-center justify-between">
                                                Makale Başlığı <span className="text-xs font-normal text-zinc-400">SEO için max 60 karakter önerilir</span>
                                            </label>
                                            <Input
                                                value={currentArticle.title}
                                                onChange={e => setCurrentArticle({ ...currentArticle, title: e.target.value })}
                                                placeholder="Etkileyici bir başlık girin..."
                                                className="h-12 text-lg font-medium"
                                                required
                                            />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold">Özet / Spot Metin (Description)</label>
                                            <textarea
                                                className="px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl min-h-[100px] text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full transition-all"
                                                value={currentArticle.description}
                                                onChange={e => setCurrentArticle({ ...currentArticle, description: e.target.value })}
                                                placeholder="Makalenin kısa bir özetini yazın. Ana sayfada listelenirken bu metin görünecektir."
                                                required
                                            />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4" /> Kapak Görseli URL
                                            </label>
                                            <div className="flex gap-4">
                                                <Input
                                                    value={currentArticle.image}
                                                    onChange={e => setCurrentArticle({ ...currentArticle, image: e.target.value })}
                                                    placeholder="https://images.unsplash.com/..."
                                                />
                                            </div>
                                            {currentArticle.image && (
                                                <div className="mt-2 h-40 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative bg-zinc-100">
                                                    <Image
                                                        src={currentArticle.image}
                                                        alt="Önizleme"
                                                        fill
                                                        className="object-cover"
                                                        unoptimized // For user provided URLs that might not be in next.config
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* İçerik Editörü (Sections) */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                                    <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 font-semibold flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-zinc-500" /> İçerik Bölümleri (Sections)
                                        </div>
                                        <Button type="button" size="sm" onClick={() => {
                                            setCurrentArticle({ ...currentArticle, sections: [...currentArticle.sections, { id: `bolum-${Date.now()}`, title: "Yeni Alt Başlık", content: "" }] })
                                        }} className="h-8">
                                            <Plus className="w-4 h-4 mr-1" /> Bölüm Ekle
                                        </Button>
                                    </div>

                                    <div className="p-6 flex flex-col gap-8">
                                        <AnimatePresence>
                                            {currentArticle.sections.map((sec: Section, idx: number) => (
                                                <m.div
                                                    key={sec.id || idx}
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="flex flex-col gap-4 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950"
                                                >
                                                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                                        <div className="flex items-center gap-1">
                                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900" onClick={() => moveSection(idx, 'up')} disabled={idx === 0}>
                                                                <ArrowUp className="w-4 h-4" />
                                                            </Button>
                                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900" onClick={() => moveSection(idx, 'down')} disabled={idx === currentArticle.sections.length - 1}>
                                                                <ArrowDown className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                        <Input
                                                            value={sec.id}
                                                            onChange={e => {
                                                                const newSecs = [...currentArticle.sections];
                                                                newSecs[idx].id = e.target.value;
                                                                setCurrentArticle({ ...currentArticle, sections: newSecs });
                                                            }}
                                                            placeholder="url-id (örn: sonuc)"
                                                            className="sm:max-w-[150px] font-mono text-xs bg-white dark:bg-zinc-900"
                                                        />
                                                        <Input
                                                            value={sec.title}
                                                            onChange={e => {
                                                                const newSecs = [...currentArticle.sections];
                                                                newSecs[idx].title = e.target.value;
                                                                setCurrentArticle({ ...currentArticle, sections: newSecs });
                                                            }}
                                                            placeholder="Bölüm Başlığı (H2)"
                                                            className="flex-1 font-bold text-lg bg-white dark:bg-zinc-900"
                                                        />
                                                        <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-red-500 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => {
                                                            const newSecs = currentArticle.sections.filter((_: Section, i: number) => i !== idx);
                                                            setCurrentArticle({ ...currentArticle, sections: newSecs });
                                                        }}>
                                                            <Trash2 className="w-5 h-5" />
                                                        </Button>
                                                    </div>
                                                    <textarea
                                                        className="px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl min-h-[250px] text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono text-zinc-700 dark:text-zinc-300 transition-all font-medium leading-relaxed"
                                                        value={sec.content}
                                                        onChange={e => {
                                                            const newSecs = [...currentArticle.sections];
                                                            newSecs[idx].content = e.target.value;
                                                            setCurrentArticle({ ...currentArticle, sections: newSecs });
                                                        }}
                                                        placeholder="Markdown formatında içerik metninizi yazabilirsiniz... (Örn: **kalın** veya - liste)"
                                                    />
                                                </m.div>
                                            ))}
                                        </AnimatePresence>

                                        {currentArticle.sections.length === 0 && (
                                            <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-500">
                                                Henüz bölüm eklenmedi. Başlamak için &quot;Bölüm Ekle&quot; butonunu kullanın.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sağ Kolon (Yayın Ayarları %33) */}
                            <div className="flex flex-col gap-6">

                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm flex flex-col gap-5">
                                    <h3 className="font-bold border-b border-zinc-100 dark:border-zinc-800 pb-3">Yayın & SEO Ayarları</h3>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">URL Kısaltması (Slug)</label>
                                        <Input
                                            value={currentArticle.slug}
                                            onChange={e => setCurrentArticle({ ...currentArticle, slug: e.target.value })}
                                            placeholder="ornek-url-yapisi"
                                            className="font-mono text-sm"
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Kategori Grubu</label>
                                        <Input
                                            value={currentArticle.category}
                                            onChange={e => setCurrentArticle({ ...currentArticle, category: e.target.value })}
                                            placeholder="Örn: Şantiye Notu"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Rozet / Etiket Başlığı</label>
                                        <Input
                                            value={currentArticle.badgeLabel}
                                            onChange={e => setCurrentArticle({ ...currentArticle, badgeLabel: e.target.value })}
                                            placeholder="Örn: Rehber, Analiz"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2 mt-4">
                                        <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Kategori Rengi (Tailwind Classes)</label>
                                        <Input
                                            value={currentArticle.categoryColor}
                                            onChange={e => setCurrentArticle({ ...currentArticle, categoryColor: e.target.value })}
                                            placeholder="bg-blue-100 text-blue-800..."
                                            className="font-mono text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm flex flex-col gap-5">
                                    <h3 className="font-bold border-b border-zinc-100 dark:border-zinc-800 pb-3">Yazar & Detaylar</h3>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Yazar Adı</label>
                                        <Input
                                            value={currentArticle.author}
                                            onChange={e => setCurrentArticle({ ...currentArticle, author: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Yazar Ünvanı</label>
                                        <Input
                                            value={currentArticle.authorTitle}
                                            onChange={e => setCurrentArticle({ ...currentArticle, authorTitle: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Tarih</label>
                                            <Input
                                                value={currentArticle.date}
                                                onChange={e => setCurrentArticle({ ...currentArticle, date: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Okuma S.</label>
                                            <Input
                                                value={currentArticle.readTime}
                                                onChange={e => setCurrentArticle({ ...currentArticle, readTime: e.target.value })}
                                                placeholder="5 dk okuma"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 mt-4">
                                        <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Makale Alıntısı (Quote)</label>
                                        <textarea
                                            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg min-h-[80px] text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"
                                            value={currentArticle.quote?.text || ""}
                                            onChange={e => setCurrentArticle({ ...currentArticle, quote: { text: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </m.div>
                ) : (
                    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">

                        {/* Header Area */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <div>
                                <h1 className="text-2xl font-bold">Makale Yönetimi</h1>
                                <p className="text-zinc-500 text-sm mt-1">Sistemdeki tüm kayıtlı içerikleri buradan yönetebilirsiniz.</p>
                            </div>
                            <Button onClick={startNewArticle} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto h-11 px-6 shadow-md shadow-blue-500/20">
                                <Plus className="w-4 h-4 mr-2" /> Yeni İçerik Ekle
                            </Button>
                            <Button asChild variant="outline" className="w-full sm:w-auto h-11 px-6 font-bold gap-2">
                                <Link href="/admin/editor"><Sparkles className="w-4 h-4" /> Blok Editör</Link>
                            </Button>
                        </div>

                        {/* List Area */}
                        {isLoading ? (
                            <div className="py-32 text-center text-zinc-500 flex flex-col items-center justify-center">
                                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-4"></div>
                                <p>Veritabanına bağlanılıyor...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {articles.map((art, idx) => (
                                    <div key={idx} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition-all hover:border-blue-200 dark:hover:border-blue-900">
                                        <div className="h-40 w-full bg-zinc-100 relative overflow-hidden text-[0px]">
                                            <Image
                                                src={art.image}
                                                alt={art.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            />
                                            <div className="absolute top-4 left-4">
                                                <Badge className="bg-white/90 text-zinc-900 backdrop-blur-sm border-none shadow-sm">{art.category}</Badge>
                                            </div>
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{art.title}</h3>
                                            <p className="font-mono text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800 p-1.5 rounded truncate mb-4">/{art.slug}</p>

                                            <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                                <Button variant="outline" className="w-full font-medium" asChild>
                                                    <Link href={`/admin/editor?edit=${art.slug}`}>
                                                        <Edit2 className="w-4 h-4 mr-2" /> Düzenle
                                                    </Link>
                                                </Button>
                                                <Button variant="outline" className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium" onClick={() => handleDelete(art.slug)}>
                                                    <Trash2 className="w-4 h-4 mr-2" /> Sil
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {articles.length === 0 && (
                                    <div className="col-span-1 md:col-span-2 xl:col-span-3 py-20 text-center text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                                        <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                                        <p className="text-lg font-medium text-zinc-900 dark:text-white">Henüz makale bulunmuyor</p>
                                        <p className="mb-6">İlk içeriğinizi oluşturmaya hemen başlayın.</p>
                                        <Button onClick={startNewArticle} variant="outline">Yeni İçerik Oluştur</Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </m.div>
                )}
            </main>
        </div>
    );
}
