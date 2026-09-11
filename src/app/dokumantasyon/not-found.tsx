import Link from "next/link";

export default function DocumentNotFound() {
  return (
    <section className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-xl font-semibold">Dosya bulunamadı</h1>
      <p className="mt-3 text-muted-foreground">
        Dosya kaldırılmış olabilir veya bu bağlantıya erişiminiz olmayabilir.
      </p>
      <Link
        href="/dokumantasyon"
        className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-secondary px-4"
      >
        Dosyalara dön
      </Link>
    </section>
  );
}
