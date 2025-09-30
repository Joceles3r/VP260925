export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white">
      <header className="sticky top-0 z-40 border-b border-fuchsia-500/30 bg-black/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 shadow-[0_0_24px] shadow-fuchsia-500/40" />
            <h1 className="text-lg font-semibold tracking-wide">VISUAL — Admin</h1>
          </div>
          <div className="text-xs opacity-80">VisualAI · Secure Console</div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 grid md:grid-cols-12 gap-6">
        <aside className="md:col-span-3 space-y-3">
          <a href="#overview" className="block rounded-xl border border-fuchsia-500/30 p-3 hover:bg-fuchsia-500/10 transition-colors" data-testid="link-admin-overview">
            📊 Vue d'ensemble
          </a>
          <a href="#toggles" className="block rounded-xl border border-fuchsia-500/30 p-3 hover:bg-fuchsia-500/10 transition-colors" data-testid="link-admin-toggles">
            🗂️ Catégories & Rubriques
          </a>
          <a href="#profiles" className="block rounded-xl border border-fuchsia-500/30 p-3 hover:bg-fuchsia-500/10 transition-colors" data-testid="link-admin-profiles">
            👥 Modules par profil
          </a>
          <a href="#theme" className="block rounded-xl border border-fuchsia-500/30 p-3 hover:bg-fuchsia-500/10 transition-colors" data-testid="link-admin-theme">
            🎨 Thème & Interface
          </a>
          <a href="#agents" className="block rounded-xl border border-fuchsia-500/30 p-3 hover:bg-fuchsia-500/10 transition-colors" data-testid="link-admin-agents">
            🤖 Agents IA
          </a>
          <a href="#security" className="block rounded-xl border border-fuchsia-500/30 p-3 hover:bg-fuchsia-500/10 transition-colors" data-testid="link-admin-security">
            🔐 Sécurité
          </a>
          <a href="#ops" className="block rounded-xl border border-fuchsia-500/30 p-3 hover:bg-fuchsia-500/10 transition-colors" data-testid="link-admin-ops">
            🛠️ Maintenance
          </a>
          <a href="#stripe" className="block rounded-xl border border-fuchsia-500/30 p-3 hover:bg-fuchsia-500/10 transition-colors" data-testid="link-admin-stripe">
            💳 Paiements
          </a>
          <a href="#logs" className="block rounded-xl border border-fuchsia-500/30 p-3 hover:bg-fuchsia-500/10 transition-colors" data-testid="link-admin-logs">
            📜 Logs & Audit
          </a>
        </aside>
        <section className="md:col-span-9 space-y-8">{children}</section>
      </main>
    </div>
  );
}
