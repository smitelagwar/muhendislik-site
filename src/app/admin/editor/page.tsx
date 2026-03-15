"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft, Save, Eye, EyeOff, Plus, Trash2, GripVertical,
    Type, Image as ImageIcon, Code, AlertTriangle, Link2, List,
    Quote, Minus, Table, ArrowUp, ArrowDown,
    FileText, Settings, Loader2
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Block, blocksToContent, contentToBlocks, generateId } from "@/lib/blocks-to-content";

interface Section {
    id: string;
    title: string;
    blocks: Block[];
}

interface ArticleForm {
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
    quote: { text: string };
    sections: Section[];
    relatedSlugs: string[];
}

const BLOCK_TYPES = [
    { type: "paragraph", icon: Type, label: "Paragraf" },
    { type: "heading", icon: Type, label: "Alt Başlık" },
    { type: "image", icon: ImageIcon, label: "Görsel" },
    { type: "code", icon: Code, label: "Kod Bloğu" },
    { type: "callout", icon: AlertTriangle, label: "Bilgi Kutusu" },
    { type: "link-embed", icon: Link2, label: "Link Kartı" },
    { type: "list", icon: List, label: "Liste" },
    { type: "quote", icon: Quote, label: "Alıntı" },
    { type: "divider", icon: Minus, label: "Ayraç" },
    { type: "table", icon: Table, label: "Tablo" },
] as const;

const CATEGORY_PRESETS = [
    { label: "Şantiye Notu", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400" },
    { label: "Hesap Rehberi", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400" },
    { label: "Yönetmelik", color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400" },
    { label: "Malzeme", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400" },
    { label: "Tasarım", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400" },
];

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
        .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function calcReadTime(sections: Section[]): string {
    const totalWords = sections.reduce((acc, sec) => {
        const blockText = sec.blocks.map(b => b.content || (b.items || []).join(" ") || "").join(" ");
        return acc + blockText.split(/\s+/).filter(Boolean).length;
    }, 0);
    const minutes = Math.max(1, Math.ceil(totalWords / 200));
    return `${minutes} dk okuma`;
}

function createBlock(type: Block["type"]): Block {
    switch (type) {
        case "paragraph":
            return { id: generateId(), type, content: "" };
        case "heading":
            return { id: generateId(), type, content: "", level: 3 };
        case "image":
            return { id: generateId(), type, src: "", alt: "", caption: "" };
        case "code":
            return { id: generateId(), type, lang: "", content: "" };
        case "callout":
            return { id: generateId(), type, variant: "not", content: "" };
        case "link-embed":
            return { id: generateId(), type, url: "", title: "" };
        case "list":
            return { id: generateId(), type, ordered: false, items: [""] };
        case "quote":
            return { id: generateId(), type, content: "" };
        case "divider":
            return { id: generateId(), type };
        case "table":
            return { id: generateId(), type, rows: [["Başlık 1", "Başlık 2"], ["", ""]] };
    }
}

// ─── Block Renderers ──────────────────────────────────────────

function ParagraphBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
    return (
        <textarea
            className="w-full min-h-[80px] p-3 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm leading-relaxed resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            value={block.content || ""}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            placeholder="Paragraf metni... (**kalın**, *italik* Markdown destekler)"
        />
    );
}

function HeadingBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
    return (
        <Input
            className="text-lg font-bold h-12 border-zinc-200 dark:border-zinc-800"
            value={block.content || ""}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            placeholder="Alt başlık metni..."
        />
    );
}

function ImageBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
    return (
        <div className="flex flex-col gap-3">
            <Input
                value={block.src || ""}
                onChange={(e) => onChange({ ...block, src: e.target.value })}
                placeholder="Görsel URL'si (https://images.unsplash.com/...)"
                className="font-mono text-xs"
            />
            <div className="grid grid-cols-2 gap-3">
                <Input
                    value={block.alt || ""}
                    onChange={(e) => onChange({ ...block, alt: e.target.value })}
                    placeholder="Alt metin (SEO)"
                    className="text-xs"
                />
                <Input
                    value={block.caption || ""}
                    onChange={(e) => onChange({ ...block, caption: e.target.value })}
                    placeholder="Resim açıklaması (isteğe bağlı)"
                    className="text-xs"
                />
            </div>
            {block.src && (
                <div className="h-40 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative bg-zinc-100 dark:bg-zinc-900">
                    <Image src={block.src} alt={block.alt || ""} fill className="object-cover" unoptimized />
                </div>
            )}
        </div>
    );
}

function CodeBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
    return (
        <div className="flex flex-col gap-2">
            <Input
                value={block.lang || ""}
                onChange={(e) => onChange({ ...block, lang: e.target.value })}
                placeholder="Dil (python, javascript, css...)"
                className="max-w-[200px] text-xs font-mono"
            />
            <textarea
                className="w-full min-h-[150px] p-3 bg-zinc-950 text-green-400 font-mono text-xs border border-zinc-800 rounded-xl resize-y focus:ring-2 focus:ring-blue-500 outline-none"
                value={block.content || ""}
                onChange={(e) => onChange({ ...block, content: e.target.value })}
                placeholder="Kod içeriğini buraya yazın..."
            />
        </div>
    );
}

function CalloutBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
    const variants = [
        { value: "not", label: "Not", color: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500" },
        { value: "uyari", label: "Uyarı", color: "bg-amber-50 dark:bg-amber-900/20 border-amber-500" },
        { value: "ipucu", label: "İpucu", color: "bg-purple-50 dark:bg-purple-900/20 border-purple-500" },
        { value: "bilgi", label: "Bilgi", color: "bg-blue-50 dark:bg-blue-900/20 border-blue-500" },
    ];
    const selected = variants.find(v => v.value === block.variant) || variants[0];
    return (
        <div className={`border-l-4 rounded-r-xl p-4 ${selected.color}`}>
            <div className="flex gap-2 mb-3">
                {variants.map(v => (
                    <button
                        key={v.value}
                        type="button"
                        onClick={() => onChange({ ...block, variant: v.value })}
                        className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg transition-all ${block.variant === v.value ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-white/50 dark:bg-zinc-800/50 text-zinc-600"}`}
                    >
                        {v.label}
                    </button>
                ))}
            </div>
            <textarea
                className="w-full min-h-[60px] p-2 bg-white/60 dark:bg-zinc-900/40 border-none rounded-lg text-sm resize-y focus:ring-2 focus:ring-blue-500 outline-none"
                value={block.content || ""}
                onChange={(e) => onChange({ ...block, content: e.target.value })}
                placeholder="Bilgi kutusu içeriği..."
            />
        </div>
    );
}

function LinkEmbedBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
    return (
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <div className="flex-1 flex flex-col gap-2">
                <Input
                    value={block.url || ""}
                    onChange={(e) => onChange({ ...block, url: e.target.value })}
                    placeholder="https://ornek.com/sayfa"
                    className="font-mono text-xs"
                />
                <Input
                    value={block.title || ""}
                    onChange={(e) => onChange({ ...block, title: e.target.value })}
                    placeholder="Link başlığı"
                    className="text-xs"
                />
            </div>
            {block.url && (
                <a href={block.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs flex items-center gap-1 hover:underline self-end">
                    <Link2 className="w-3 h-3" /> Aç
                </a>
            )}
        </div>
    );
}

function ListBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
    const items = block.items || [""];
    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2 mb-1">
                <button type="button" onClick={() => onChange({ ...block, ordered: false })} className={`text-[10px] font-bold px-2 py-1 rounded-lg ${!block.ordered ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800"}`}>• Sırasız</button>
                <button type="button" onClick={() => onChange({ ...block, ordered: true })} className={`text-[10px] font-bold px-2 py-1 rounded-lg ${block.ordered ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800"}`}>1. Sıralı</button>
            </div>
            {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <span className="text-xs text-zinc-400 w-6 text-center font-bold">{block.ordered ? `${i + 1}.` : "•"}</span>
                    <Input
                        value={item}
                        onChange={(e) => {
                            const newItems = [...items];
                            newItems[i] = e.target.value;
                            onChange({ ...block, items: newItems });
                        }}
                        placeholder="Liste öğesi..."
                        className="text-sm flex-1"
                    />
                    <button type="button" onClick={() => {
                        const newItems = items.filter((_, j) => j !== i);
                        onChange({ ...block, items: newItems.length ? newItems : [""] });
                    }} className="text-zinc-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
            ))}
            <Button type="button" variant="ghost" size="sm" className="w-fit text-xs" onClick={() => onChange({ ...block, items: [...items, ""] })}>
                <Plus className="w-3 h-3 mr-1" /> Öğe Ekle
            </Button>
        </div>
    );
}

function QuoteBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
    return (
        <div className="border-l-4 border-blue-500 pl-4">
            <textarea
                className="w-full min-h-[60px] p-2 bg-transparent text-sm italic resize-y focus:ring-2 focus:ring-blue-500 outline-none border border-zinc-200 dark:border-zinc-800 rounded-xl"
                value={block.content || ""}
                onChange={(e) => onChange({ ...block, content: e.target.value })}
                placeholder="Alıntı metni..."
            />
        </div>
    );
}

function TableBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
    const rows = block.rows || [["Başlık 1", "Başlık 2"], ["", ""]];
    const updateCell = (ri: number, ci: number, val: string) => {
        const newRows = rows.map(r => [...r]);
        newRows[ri][ci] = val;
        onChange({ ...block, rows: newRows });
    };
    const addRow = () => onChange({ ...block, rows: [...rows, new Array(rows[0].length).fill("")] });
    const addCol = () => onChange({ ...block, rows: rows.map(r => [...r, ""]) });

    return (
        <div className="flex flex-col gap-3">
            <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <table className="w-full text-sm">
                    <tbody>
                        {rows.map((row, ri) => (
                            <tr key={ri} className={ri === 0 ? "bg-zinc-50 dark:bg-zinc-900 font-bold" : ""}>
                                {row.map((cell, ci) => (
                                    <td key={ci} className="border-r border-b border-zinc-200 dark:border-zinc-800 last:border-r-0 p-0">
                                        <input
                                            value={cell}
                                            onChange={(e) => updateCell(ri, ci, e.target.value)}
                                            className="w-full px-3 py-2 bg-transparent text-xs outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20"
                                            placeholder={ri === 0 ? "Başlık" : "Veri"}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="text-xs h-7" onClick={addRow}><Plus className="w-3 h-3 mr-1" /> Satır</Button>
                <Button type="button" variant="outline" size="sm" className="text-xs h-7" onClick={addCol}><Plus className="w-3 h-3 mr-1" /> Sütun</Button>
            </div>
        </div>
    );
}

// ─── Block Wrapper ───────────────────────────────────────────

function BlockRenderer({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
    switch (block.type) {
        case "paragraph": return <ParagraphBlock block={block} onChange={onChange} />;
        case "heading": return <HeadingBlock block={block} onChange={onChange} />;
        case "image": return <ImageBlock block={block} onChange={onChange} />;
        case "code": return <CodeBlock block={block} onChange={onChange} />;
        case "callout": return <CalloutBlock block={block} onChange={onChange} />;
        case "link-embed": return <LinkEmbedBlock block={block} onChange={onChange} />;
        case "list": return <ListBlock block={block} onChange={onChange} />;
        case "quote": return <QuoteBlock block={block} onChange={onChange} />;
        case "divider": return <div className="border-t-2 border-dashed border-zinc-300 dark:border-zinc-700 my-2" />;
        case "table": return <TableBlock block={block} onChange={onChange} />;
        default: return <ParagraphBlock block={block} onChange={onChange} />;
    }
}

// ─── Main Editor Page ────────────────────────────────────────

export default function EditorPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [slashMenuOpen, setSlashMenuOpen] = useState<{ sectionIdx: number } | null>(null);
    const [existingArticles, setExistingArticles] = useState<{ slug: string; title: string }[]>([]);

    const [article, setArticle] = useState<ArticleForm>({
        slug: "",
        title: "",
        description: "",
        category: "Şantiye Notu",
        categoryColor: CATEGORY_PRESETS[0].color,
        badgeLabel: "Yeni",
        author: "Admin Editör",
        authorTitle: "Yönetici",
        date: new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
        readTime: "1 dk okuma",
        image: "",
        quote: { text: "" },
        sections: [{ id: "giris", title: "1. Giriş", blocks: [{ id: generateId(), type: "paragraph", content: "" }] }],
        relatedSlugs: [],
    });

    // Auth check
    useEffect(() => {
        const storedAuth = localStorage.getItem("admin_auth");
        if (storedAuth === "true") {
            setIsAuthenticated(true);
        }
    }, []);

    // Load existing articles for related articles picker
    useEffect(() => {
        if (isAuthenticated) {
            fetch("/api/articles")
                .then(r => r.json())
                .then(data => {
                    if (data && typeof data === "object") {
                        setExistingArticles(Object.values(data).map((a: unknown) => ({ slug: (a as Record<string, string>).slug, title: (a as Record<string, string>).title })));
                    }
                })
                .catch(() => { });
        }
    }, [isAuthenticated]);

    // Check URL params for editing existing article
    useEffect(() => {
        if (!isAuthenticated) return;
        const params = new URLSearchParams(window.location.search);
        const editSlug = params.get("edit");
        if (editSlug) {
            fetch("/api/articles")
                .then(r => r.json())
                .then(data => {
                    const existing = data[editSlug];
                    if (existing) {
                        setArticle({
                            ...existing,
                            quote: existing.quote || { text: "" },
                            sections: existing.sections.map((sec: Record<string, unknown>) => ({
                                id: sec.id,
                                title: sec.title,
                                blocks: contentToBlocks(sec.content as string),
                            })),
                        });
                        toast.success(`"${existing.title}" düzenlemeye açıldı.`);
                    }
                })
                .catch(() => toast.error("Makale yüklenemedi."));
        }
    }, [isAuthenticated]);

    // Auto slug
    useEffect(() => {
        if (article.title && !article.slug) {
            setArticle(a => ({ ...a, slug: slugify(a.title) }));
        }
    }, [article.slug, article.title]);

    // Auto read time
    useEffect(() => {
        setArticle(a => ({ ...a, readTime: calcReadTime(a.sections) }));
    }, [article.sections]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === "admin123" || password === "123456") {
            setIsAuthenticated(true);
            localStorage.setItem("admin_auth", "true");
            toast.success("Giriş başarılı.");
        } else {
            toast.error("Hatalı şifre!");
        }
    };

    const updateBlock = useCallback((sectionIdx: number, blockIdx: number, updatedBlock: Block) => {
        setArticle(prev => {
            const newSections = [...prev.sections];
            const newBlocks = [...newSections[sectionIdx].blocks];
            newBlocks[blockIdx] = updatedBlock;
            newSections[sectionIdx] = { ...newSections[sectionIdx], blocks: newBlocks };
            return { ...prev, sections: newSections };
        });
    }, []);

    const addBlock = useCallback((sectionIdx: number, type: Block["type"]) => {
        const newBlock = createBlock(type) as Block & { rows?: string[][] };
        if (type === "table") newBlock.rows = [["Başlık 1", "Başlık 2"], ["", ""]];
        setArticle(prev => {
            const newSections = [...prev.sections];
            newSections[sectionIdx] = { ...newSections[sectionIdx], blocks: [...newSections[sectionIdx].blocks, newBlock] };
            return { ...prev, sections: newSections };
        });
        setSlashMenuOpen(null);
    }, []);

    const removeBlock = useCallback((sectionIdx: number, blockIdx: number) => {
        setArticle(prev => {
            const newSections = [...prev.sections];
            const newBlocks = newSections[sectionIdx].blocks.filter((_, i) => i !== blockIdx);
            newSections[sectionIdx] = { ...newSections[sectionIdx], blocks: newBlocks.length ? newBlocks : [{ id: generateId(), type: "paragraph", content: "" }] };
            return { ...prev, sections: newSections };
        });
    }, []);

    const moveBlock = useCallback((sectionIdx: number, blockIdx: number, direction: "up" | "down") => {
        setArticle(prev => {
            const newSections = [...prev.sections];
            const blocks = [...newSections[sectionIdx].blocks];
            const targetIdx = direction === "up" ? blockIdx - 1 : blockIdx + 1;
            if (targetIdx < 0 || targetIdx >= blocks.length) return prev;
            [blocks[blockIdx], blocks[targetIdx]] = [blocks[targetIdx], blocks[blockIdx]];
            newSections[sectionIdx] = { ...newSections[sectionIdx], blocks };
            return { ...prev, sections: newSections };
        });
    }, []);

    const addSection = () => {
        const idx = article.sections.length + 1;
        setArticle(prev => ({
            ...prev,
            sections: [...prev.sections, {
                id: `bolum-${idx}`,
                title: `${idx}. Yeni Bölüm`,
                blocks: [{ id: generateId(), type: "paragraph", content: "" }],
            }],
        }));
    };

    const removeSection = (idx: number) => {
        setArticle(prev => ({
            ...prev,
            sections: prev.sections.filter((_, i) => i !== idx),
        }));
    };

    const moveSection = (idx: number, direction: "up" | "down") => {
        setArticle(prev => {
            const secs = [...prev.sections];
            const target = direction === "up" ? idx - 1 : idx + 1;
            if (target < 0 || target >= secs.length) return prev;
            [secs[idx], secs[target]] = [secs[target], secs[idx]];
            return { ...prev, sections: secs };
        });
    };

    const handleSave = async () => {
        if (!article.title || !article.slug) {
            toast.error("Başlık ve URL slug'ı zorunludur.");
            return;
        }

        setIsSaving(true);
        try {
            // Convert blocks back to content strings
            const payload = {
                ...article,
                sections: article.sections.map(sec => ({
                    id: sec.id,
                    title: sec.title,
                    content: blocksToContent(sec.blocks),
                })),
            };

            const res = await fetch("/api/articles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Kaydedilemedi");
            toast.success("Makale başarıyla kaydedildi ve yayınlandı!");
        } catch {
            toast.error("Kaydetme sırasında hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Login ───
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-2xl" />
                    <div className="mb-8 text-center flex flex-col items-center">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4"><Settings className="w-6 h-6 text-blue-700" /></div>
                        <h2 className="text-2xl font-bold">İçerik Editörü</h2>
                        <p className="text-sm text-zinc-500 mt-1">Sisteme erişmek için şifrenizi girin.</p>
                    </div>
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <Input type="password" placeholder="*************" value={password} onChange={e => setPassword(e.target.value)} className="h-11" />
                        <Button type="submit" className="w-full h-11 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white font-semibold">Giriş Yap</Button>
                    </form>
                </div>
            </div>
        );
    }

    // ─── Main Editor ───
    return (
        <div className="min-h-screen bg-[#F6F6F7] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col">
            {/* Top Bar */}
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/admin" className="text-zinc-500 hover:text-blue-600 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="font-bold text-sm truncate max-w-[200px] sm:max-w-xs">{article.title || "Yeni İçerik"}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="hidden sm:flex gap-1.5" onClick={() => setShowPreview(!showPreview)}>
                            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {showPreview ? "Düzenle" : "Önizle"}
                        </Button>
                        <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 gap-1.5 font-bold px-4"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Kaydet & Yayınla
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Main Editor Column */}
                    <div className={`${showPreview ? "hidden lg:block" : ""} lg:col-span-8 xl:col-span-9 flex flex-col gap-6`}>

                        {/* Title & Description Card */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                            <div className="p-6 flex flex-col gap-5">
                                <Input
                                    value={article.title}
                                    onChange={(e) => setArticle({ ...article, title: e.target.value, slug: slugify(e.target.value) })}
                                    placeholder="Makale başlığını yazın..."
                                    className="text-2xl sm:text-3xl font-black border-none px-0 h-auto py-0 focus-visible:ring-0 placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                                />
                                <textarea
                                    value={article.description}
                                    onChange={(e) => setArticle({ ...article, description: e.target.value })}
                                    placeholder="Kısa açıklama / özet — ana sayfa kartlarında ve SEO'da görünür..."
                                    className="w-full min-h-[70px] text-sm text-zinc-600 dark:text-zinc-400 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 resize-y focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">URL:</span>
                                    <code className="text-xs font-mono text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">/{article.slug || "..."}</code>
                                    <span className="text-[10px] text-zinc-400">•</span>
                                    <span className="text-[10px] text-zinc-400">{article.readTime}</span>
                                </div>
                            </div>
                        </div>

                        {/* Cover Image */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                <ImageIcon className="w-3.5 h-3.5" /> Kapak Görseli
                            </label>
                            <Input
                                value={article.image}
                                onChange={(e) => setArticle({ ...article, image: e.target.value })}
                                placeholder="https://images.unsplash.com/..."
                                className="font-mono text-xs mb-3"
                            />
                            {article.image && (
                                <div className="h-48 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative bg-zinc-100">
                                    <Image src={article.image} alt="Kapak" fill className="object-cover" unoptimized />
                                </div>
                            )}
                        </div>

                        {/* Sections */}
                        {article.sections.map((section, sIdx) => (
                            <div key={section.id + sIdx} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                                {/* Section Header */}
                                <div className="bg-zinc-50 dark:bg-zinc-950 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                                    <GripVertical className="w-4 h-4 text-zinc-300 cursor-grab" />
                                    <Input
                                        value={section.id}
                                        onChange={(e) => {
                                            const secs = [...article.sections];
                                            secs[sIdx].id = e.target.value;
                                            setArticle({ ...article, sections: secs });
                                        }}
                                        className="max-w-[120px] font-mono text-[10px] h-7 bg-transparent border-zinc-300 dark:border-zinc-700"
                                        placeholder="url-id"
                                    />
                                    <Input
                                        value={section.title}
                                        onChange={(e) => {
                                            const secs = [...article.sections];
                                            secs[sIdx].title = e.target.value;
                                            setArticle({ ...article, sections: secs });
                                        }}
                                        className="flex-1 font-bold text-sm h-7 bg-transparent border-zinc-300 dark:border-zinc-700"
                                        placeholder="Bölüm Başlığı"
                                    />
                                    <div className="flex items-center gap-1">
                                        <button type="button" onClick={() => moveSection(sIdx, "up")} disabled={sIdx === 0} className="p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-20"><ArrowUp className="w-3.5 h-3.5" /></button>
                                        <button type="button" onClick={() => moveSection(sIdx, "down")} disabled={sIdx === article.sections.length - 1} className="p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-20"><ArrowDown className="w-3.5 h-3.5" /></button>
                                        <button type="button" onClick={() => removeSection(sIdx)} className="p-1 text-zinc-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>

                                {/* Blocks */}
                                <div className="p-4 flex flex-col gap-4">
                                    {section.blocks.map((block, bIdx) => (
                                        <div key={block.id} className="group relative flex gap-2">
                                            {/* Block Controls */}
                                            <div className="flex flex-col items-center gap-0.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 w-6">
                                                <button type="button" onClick={() => moveBlock(sIdx, bIdx, "up")} disabled={bIdx === 0} className="text-zinc-300 hover:text-zinc-600 disabled:opacity-20"><ArrowUp className="w-3 h-3" /></button>
                                                <GripVertical className="w-3 h-3 text-zinc-300 cursor-grab" />
                                                <button type="button" onClick={() => moveBlock(sIdx, bIdx, "down")} disabled={bIdx === section.blocks.length - 1} className="text-zinc-300 hover:text-zinc-600 disabled:opacity-20"><ArrowDown className="w-3 h-3" /></button>
                                            </div>
                                            {/* Block Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 border-zinc-200 dark:border-zinc-800">
                                                        {BLOCK_TYPES.find(bt => bt.type === block.type)?.label || block.type}
                                                    </Badge>
                                                    <button type="button" onClick={() => removeBlock(sIdx, bIdx)} className="text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                                <BlockRenderer block={block} onChange={(b) => updateBlock(sIdx, bIdx, b)} />
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Block Button */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setSlashMenuOpen(slashMenuOpen?.sectionIdx === sIdx ? null : { sectionIdx: sIdx })}
                                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-800 transition-all text-xs font-bold"
                                        >
                                            <Plus className="w-4 h-4" /> Blok Ekle
                                        </button>

                                        {/* Slash Menu */}
                                        {slashMenuOpen?.sectionIdx === sIdx && (
                                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-2 z-20 grid grid-cols-2 sm:grid-cols-5 gap-1">
                                                {BLOCK_TYPES.map((bt) => (
                                                    <button
                                                        key={bt.type}
                                                        type="button"
                                                        onClick={() => addBlock(sIdx, bt.type as Block["type"])}
                                                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400 hover:text-blue-600 group"
                                                    >
                                                        <bt.icon className="w-5 h-5" />
                                                        <span className="text-[10px] font-bold">{bt.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add Section */}
                        <Button variant="outline" className="w-full h-14 border-dashed border-2 rounded-2xl text-zinc-400 hover:text-blue-600 hover:border-blue-300 font-bold" onClick={addSection}>
                            <Plus className="w-5 h-5 mr-2" /> Yeni Bölüm Ekle
                        </Button>
                    </div>

                    {/* Sidebar / Preview */}
                    <div className={`${showPreview ? "lg:col-span-12" : "lg:col-span-4 xl:col-span-3"} flex flex-col gap-6`}>

                        {showPreview ? (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8 prose prose-zinc dark:prose-invert max-w-3xl mx-auto w-full">
                                <h1 className="text-3xl font-black mb-4">{article.title || "Başlıksız"}</h1>
                                <p className="text-zinc-500 mb-8">{article.description}</p>
                                {article.sections.map((sec, i) => (
                                    <div key={i}>
                                        <h2 className="text-xl font-bold mt-8 mb-4 border-b pb-2">{sec.title}</h2>
                                        {sec.blocks.map((block, j) => (
                                            <div key={j} className="mb-4">
                                                {block.type === "paragraph" && <p>{block.content}</p>}
                                                {block.type === "heading" && <h3 className="font-bold text-lg">{block.content}</h3>}
                                                {block.type === "image" && block.src && (
                                                    <figure>
                                                        <div className="relative h-48 rounded-xl overflow-hidden"><Image src={block.src} alt={block.alt || ""} fill className="object-cover" unoptimized /></div>
                                                        {block.caption && <figcaption className="text-sm text-center text-zinc-500 mt-2">{block.caption}</figcaption>}
                                                    </figure>
                                                )}
                                                {block.type === "code" && <pre className="bg-zinc-950 text-green-400 p-4 rounded-xl text-xs overflow-x-auto"><code>{block.content}</code></pre>}
                                                {block.type === "callout" && <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-r-xl text-sm">{block.content}</div>}
                                                {block.type === "quote" && <blockquote className="border-l-4 border-zinc-300 pl-4 italic">{block.content}</blockquote>}
                                                {block.type === "divider" && <hr className="my-6" />}
                                                {block.type === "list" && (
                                                    block.ordered
                                                        ? <ol className="list-decimal pl-6">{(block.items || []).map((item, k) => <li key={k}>{item}</li>)}</ol>
                                                        : <ul className="list-disc pl-6">{(block.items || []).map((item, k) => <li key={k}>{item}</li>)}</ul>
                                                )}
                                                {block.type === "link-embed" && (
                                                    <a href={block.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">{block.title || block.url}</a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                {/* Publishing Settings */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 flex flex-col gap-4">
                                    <h3 className="font-bold text-sm border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center gap-2"><Settings className="w-4 h-4 text-zinc-400" /> Yayın Ayarları</h3>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Slug (URL)</label>
                                        <Input value={article.slug} onChange={(e) => setArticle({ ...article, slug: e.target.value })} className="font-mono text-xs h-8" />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Kategori</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {CATEGORY_PRESETS.map(cp => (
                                                <button
                                                    key={cp.label}
                                                    type="button"
                                                    onClick={() => setArticle({ ...article, category: cp.label, categoryColor: cp.color })}
                                                    className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${article.category === cp.label ? "ring-2 ring-blue-500 ring-offset-1" : ""} ${cp.color}`}
                                                >
                                                    {cp.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rozet</label>
                                            <Input value={article.badgeLabel} onChange={(e) => setArticle({ ...article, badgeLabel: e.target.value })} className="text-xs h-8" />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tarih</label>
                                            <Input value={article.date} onChange={(e) => setArticle({ ...article, date: e.target.value })} className="text-xs h-8" />
                                        </div>
                                    </div>
                                </div>

                                {/* Author */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 flex flex-col gap-4">
                                    <h3 className="font-bold text-sm border-b border-zinc-100 dark:border-zinc-800 pb-3">Yazar Bilgisi</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ad</label>
                                            <Input value={article.author} onChange={(e) => setArticle({ ...article, author: e.target.value })} className="text-xs h-8" />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ünvan</label>
                                            <Input value={article.authorTitle} onChange={(e) => setArticle({ ...article, authorTitle: e.target.value })} className="text-xs h-8" />
                                        </div>
                                    </div>
                                </div>

                                {/* Quote */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 flex flex-col gap-3">
                                    <h3 className="font-bold text-sm border-b border-zinc-100 dark:border-zinc-800 pb-3">Makale Alıntısı</h3>
                                    <textarea
                                        value={article.quote.text}
                                        onChange={(e) => setArticle({ ...article, quote: { text: e.target.value } })}
                                        className="w-full min-h-[60px] text-sm p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-y outline-none focus:ring-2 focus:ring-blue-500 italic"
                                        placeholder="Dikkat çekici bir alıntı..."
                                    />
                                </div>

                                {/* Related Articles */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 flex flex-col gap-3">
                                    <h3 className="font-bold text-sm border-b border-zinc-100 dark:border-zinc-800 pb-3">İlgili İçerikler</h3>
                                    <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
                                        {existingArticles.filter(a => a.slug !== article.slug).map(a => (
                                            <label key={a.slug} className="flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={article.relatedSlugs.includes(a.slug)}
                                                    onChange={(e) => {
                                                        setArticle(prev => ({
                                                            ...prev,
                                                            relatedSlugs: e.target.checked
                                                                ? [...prev.relatedSlugs, a.slug]
                                                                : prev.relatedSlugs.filter(s => s !== a.slug)
                                                        }));
                                                    }}
                                                    className="rounded"
                                                />
                                                <span className="truncate">{a.title}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
