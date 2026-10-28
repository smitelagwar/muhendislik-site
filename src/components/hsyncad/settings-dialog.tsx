"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export default function SettingsDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => { dialog.close(); }; }, []);
  return <dialog className="hcad-settings-dialog" aria-labelledby="hcad-settings-title" ref={ref} onCancel={e => { e.preventDefault(); e.stopPropagation(); onClose(); }} onKeyDown={e => e.stopPropagation()} onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }}>
    <div className="hcad-settings-heading"><h2 id="hcad-settings-title">{title}</h2><button type="button" aria-label="Ayarları kapat" onClick={onClose}><X size={18} /></button></div><div className="hcad-settings-body">{children}</div>
  </dialog>;
}
