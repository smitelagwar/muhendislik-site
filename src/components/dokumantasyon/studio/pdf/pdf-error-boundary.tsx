import React from "react";
import { recordPdfError } from "@/lib/dokumantasyon/studio/pdf/pdf-diagnostics";
import { AlertTriangle, RefreshCw, Download } from "lucide-react";

export interface PdfViewerErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
  fileId?: string;
  onDownload?: () => void;
}

export interface PdfViewerErrorBoundaryState {
  err: Error | null;
}

export class PdfViewerErrorBoundary extends React.Component<
  PdfViewerErrorBoundaryProps,
  PdfViewerErrorBoundaryState
> {
  state: PdfViewerErrorBoundaryState = { err: null };

  static getDerivedStateFromError(err: Error): PdfViewerErrorBoundaryState {
    return { err };
  }

  componentDidCatch(err: Error, info: React.ErrorInfo): void {
    recordPdfError("react-crash", err, info.componentStack || undefined);
  }

  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div
        role="alert"
        data-testid="pdf-crash"
        className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-zinc-950 text-zinc-200 min-h-[300px]"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-950/60 border border-red-500/30 text-red-400 mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-zinc-100 mb-1">
          Görüntüleyici beklenmedik şekilde durdu
        </h3>
        <p className="text-sm text-zinc-400 max-w-md mb-6">
          Görüntüleyici işleminde bir hata oluştu. Son okuma konumunuz korundu.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              this.setState({ err: null });
              this.props.onReset?.();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Yeniden yükle
          </button>
          {this.props.onDownload && (
            <button
              type="button"
              onClick={this.props.onDownload}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors border border-zinc-700"
            >
              <Download className="h-4 w-4" />
              Dosyayı indir
            </button>
          )}
        </div>
      </div>
    );
  }
}
