// Placeholder — this is Phase 0 only, confirming the app boots.
// Real homepage (hero, categories, best sellers, etc.) is built in Phase 7
// per docs/04-PAGES-AND-FEATURES.md.

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold text-brand-navy">Star Press</h1>
      <p className="text-brand-gold font-medium">Turning Ideas Into Print</p>
      <p className="text-sm text-gray-500">
        Phase 0 scaffold — see docs/04-PAGES-AND-FEATURES.md for build status.
      </p>
    </main>
  );
}
