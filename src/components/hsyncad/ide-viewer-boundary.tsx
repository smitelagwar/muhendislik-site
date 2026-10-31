"use client";

import { Component, createRef, type ReactNode } from "react";

/** A viewer chunk failure must never take the existing CAD editor down with it. */
export default class IdeViewerBoundary extends Component<{ children: ReactNode; onClose: () => void }, { failed: boolean }> {
  state = { failed: false };
  private closeButton = createRef<HTMLButtonElement>();
  private reloadButton = createRef<HTMLButtonElement>();

  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.closeButton.current?.focus(); }

  render() {
    if (!this.state.failed) return this.props.children;
    return <div role="alertdialog" aria-modal="true" aria-label="IDE görüntüleyici yüklenemedi" data-testid="ide-load-fallback" style={{ position: "fixed", inset: 0, zIndex: 130, display: "grid", placeItems: "center", padding: 24, background: "#0b1624eb", color: "#dfebf7" }} onKeyDown={event => {
      event.stopPropagation();
      if (event.key === "Escape") { event.preventDefault(); this.props.onClose(); }
      if (event.key === "Tab" && event.shiftKey && event.target === this.closeButton.current) { event.preventDefault(); this.reloadButton.current?.focus(); }
      else if (event.key === "Tab" && !event.shiftKey && event.target === this.reloadButton.current) { event.preventDefault(); this.closeButton.current?.focus(); }
    }}>
      <div style={{ maxWidth: 420, padding: 24, border: "1px solid #496478", borderRadius: 10, background: "#192c3b" }}>
        <strong>IDE görüntüleyici yüklenemedi</strong>
        <p style={{ lineHeight: 1.6 }}>Açık sekme önceki sürümden kalmış olabilir. Sayfayı yenileyip dosyanızı tekrar seçebilirsiniz. Mevcut CAD modeliniz korunur.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" ref={this.closeButton} onClick={this.props.onClose}>Çizime dön</button>
          <button type="button" ref={this.reloadButton} onClick={() => window.location.reload()}>Sayfayı yenile</button>
        </div>
      </div>
    </div>;
  }
}
