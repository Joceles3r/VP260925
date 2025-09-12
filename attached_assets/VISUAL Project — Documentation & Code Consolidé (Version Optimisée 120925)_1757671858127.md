# VISUAL Project — Documentation & Code Consolidé (Version Optimisée)

> **Mise à jour du 2025-09-11** — Correction des matrices de redistribution :
> - **Investissements classiques (TOP 100)** : 40% Porteurs gagnants (TOP10) / 30% Investisseurs gagnants (TOP10) / 23% VISUAL / 7% Investisseurs perdants (rangs 11–100)
> - **Live Shows / Battles** : 40% Artiste gagnant / 30% Investisseurs gagnants (TOP10 côté gagnant) / 20% Artiste perdant / 10% Investisseurs perdants

*(Version consolidée Septembre 2025)*

---

## Introduction

Ce document est une compilation et une optimisation de la documentation et du code du projet VISUAL. Il vise à fournir une vue d'ensemble claire et concise des différentes composantes du projet, de ses configurations techniques à ses règles métier.

---

## Section 1 — Configuration & Qualité de Code

Cette section détaille les configurations essentielles pour le développement et la qualité du code du projet VISUAL.

### `tsconfig.json`

Configuration TypeScript pour le projet, assurant la compatibilité et la robustesse du code.

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src]
}
```

### `eslint.config.js`

Configuration ESLint pour maintenir la qualité et la cohérence du code, avec des règles spécifiques pour React et TypeScript.

```javascript
import react from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['dist/**'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { project: ['./tsconfig.json'] },
    },
    plugins: { react },
    rules: {
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_$' }]
    },
  }
];
```

---

## Section 2 — Services

Cette section présente les services clés du projet, responsables des interactions avec les API externes et la logique métier.

### `visualAI.service.ts`

Gère les interactions avec les services d'intelligence artificielle, incluant la classification visuelle, la modération et l'intégration de modèles. Inclut une gestion des limites de requêtes et un mécanisme de fallback en mode mock pour le développement et les tests.

### `moderation.service.ts`

Service de modération pour filtrer les contenus sensibles, assurant la conformité et la sécurité de la plateforme.

### `stripe.service.ts`

Gère les paiements via Stripe Connect, incluant la gestion des comptes utilisateurs, les vérifications KYC (Know Your Customer) et les cautions minimales pour les transactions.

---

## Section 3 — Stores & Hooks (Zustand/React)

Cette section décrit l'implémentation des stores et des hooks React pour la gestion de l'état global de l'application et la réutilisation de la logique.

### `authStore.ts`

Store d'authentification utilisant Zustand pour gérer l'état de l'utilisateur (connexion, déconnexion, informations utilisateur).

```typescript
import { create } from 'zustand';

type AuthState = {
  user: { id: string; role: string; kycVerified: boolean } | null;
  login: (user: AuthState['user']) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
```

### `uiStore.ts`

Store de l'interface utilisateur pour gérer des préférences comme le mode sombre.

```typescript
import { create } from 'zustand';

type UIState = {
  darkMode: boolean;
  toggleDarkMode: () => void;
};

export const useUIStore = create<UIState>((set, get) => ({
  darkMode: false,
  toggleDarkMode: () => set({ darkMode: !get().darkMode }),
}));
```

### `useDebounce.ts`

Hook personnalisé pour débouncer les valeurs, utile pour optimiser les performances des entrées utilisateur.

```typescript
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
```

---

## Section 4 — UI Utilisateurs & Authentification

Cette section présente les composants de l'interface utilisateur liés à l'authentification et à la gestion des utilisateurs.

### `AuthPage.tsx`

Page de connexion/authentification.

```typescript
import { useAuthStore } from '@/stores/authStore';

export default function AuthPage() {
  const { login } = useAuthStore();

  function handleLogin() {
    // simulation
    login({ id: 'u1', role: 'investor', kycVerified: true });
  }

  return (
    <div className="p-4">
      <h1>Connexion</h1>
      <button onClick={handleLogin} className="btn btn-primary">Se connecter</button>
    </div>
  );
}
```

### `AgeVerification.tsx`

Composant pour afficher le statut de vérification de l'âge de l'utilisateur.

```typescript
import { useAuthStore } from '@/stores/authStore';

export default function AgeVerification() {
  const { user } = useAuthStore();
  if (!user) return null;
  return user.kycVerified
    ? <p>Âge vérifié ✅</p>
    : <p>⚠️ Vérification d’âge requise.</p>;
}
```

### `BalanceAlert.tsx`

Composant d'alerte pour le solde de l'utilisateur.

```typescript
type Props = { balanceEUR: number };
export default function BalanceAlert({ balanceEUR }: Props) {
  if (balanceEUR < 20) {
    return <p className="text-red-500">Solde insuffisant, rechargez pour investir.</p>;
  }
  return null;
}
```

### `UserDisplayName.tsx`

Composant pour afficher le nom d'utilisateur.

```typescript
import { useAuthStore } from '@/stores/authStore';

export default function UserDisplayName() {
  const { user } = useAuthStore();
  return <span>{user ? user.id : 'Visiteur'}</span>;
}
```

### `UserDropdown.tsx`

Menu déroulant pour les actions utilisateur, comme la déconnexion.

```typescript
import { useAuthStore } from '@/stores/authStore';

export default function UserDropdown() {
  const { logout } = useAuthStore();
  return (
    <div className="menu">
      <button onClick={logout}>Se déconnecter</button>
    </div>
  );
}
```

### `LanguageSelector.tsx`

Sélecteur de langue pour l'interface utilisateur.

```typescript
import { useState } from 'react';

export default function LanguageSelector() {
  const [lang, setLang] = useState<'fr'|'en'>('fr');
  return (
    <select value={lang} onChange={(e)=>setLang(e.target.value as any)}>
      <option value="fr">FR</option>
      <option value="en">EN</option>
    </select>
  );
}
```

---

## Section 5 — UI Streaming & Projets

Cette section couvre les composants de l'interface utilisateur liés au streaming vidéo et à la gestion des projets.

### `VideoPlayer.tsx`

Composant de lecteur vidéo personnalisable.

```typescript
import { useEffect, useRef, useState } from 'react';

type Props = { src: string; poster?: string; autoPlay?: boolean; onPlay?: ()=>void; onPause?: ()=>void };

export default function VideoPlayer({ src, poster, autoPlay, onPlay, onPause }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(!!autoPlay);

  useEffect(() => {
    const v = ref.current; if (!v) return;
    const onP = () => { setPlaying(true); onPlay?.(); };
    const onS = () => { setPlaying(false); onPause?.(); };
    v.addEventListener('play', onP);
    v.addEventListener('pause', onS);
    return () => { v.removeEventListener('play', onP); v.removeEventListener('pause', onS); };
  }, [onPlay, onPause]);

  return (
    <figure className="rounded border overflow-hidden">
      <video
        ref={ref}
        src={src}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        autoPlay={autoPlay}
        aria-label="Lecteur vidéo"
        className="w-full h-auto"
      />
      <figcaption className="sr-only">{playing ? 'Lecture' : 'Pause'}</figcaption>
    </figure>
  );
}
```

### `LiveShowPage.tsx`

Page dédiée à la diffusion en direct.

```typescript
import VideoPlayer from '@/components/VideoPlayer';

export default function LiveShowPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6" aria-labelledby="liveTitle">
      <h1 id="liveTitle" className="text-2xl font-bold mb-4">Live Show</h1>
      <VideoPlayer src="/media/live/stream.m3u8" poster="/media/live/poster.jpg" />
      <p className="mt-3 text-sm text-gray-600">
        Le direct peut présenter un léger décalage. Respect des règles du chat et de la modération.
      </p>
    </main>
  );
}
```

### `ProjectsPage.tsx`

Page listant les projets, avec fonctionnalités de recherche, de filtrage et de tri.

```typescript
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

type Project = { id:string; title:string; roi:number; thumb?:string };

export default function ProjectsPage() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<Project[]>([]);
  const q = params.get('q') || ''; const category = params.get('category') || ''; const sort = params.get('sort') || 'roi_desc';

  useEffect(() => {
    // TODO brancher API: /api/projects?q=&category=&sort=
    setItems([
      { id:'p1', title:'Projet Alpha', roi:12.5, thumb:'/img/p1.jpg' },
      { id:'p2', title:'Projet Beta', roi:8.3,  thumb:'/img/p2.jpg' }
    ]);
  }, [q, category, sort]);

  function updateParam(k:string, v:string) { const n = new URLSearchParams(params); v ? n.set(k,v) : n.delete(k); setParams(n,{replace:true}); }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6" aria-labelledby="projTitle">
      <h1 id="projTitle" className="text-2xl font-bold mb-4">Projets</h1>

      <div className="flex gap-2 mb-4">
        <input className="input" placeholder="Rechercher…" value={q} onChange={(e)=>updateParam('q', e.target.value)} />
        <select className="input" value={category} onChange={(e)=>updateParam('category', e.target.value)}>
          <option value="">Toutes catégories</option>
          <option value="docu">Documentaire</option>
          <option value="clip">Clip</option>
        </select>
        <select className="input" value={sort} onChange={(e)=>updateParam('sort', e.target.value)}>
          <option value="roi_desc">ROI décroissant</option>
          <option value="roi_asc">ROI croissant</option>
          <option value="recent">Récents</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(p => (
          <article key={p.id} className="border rounded p-3 hover:shadow">
            {p.thumb && <img src={p.thumb} alt="" loading="lazy" className="w-full h-40 object-cover rounded" />}
            <h2 className="font-medium mt-2">{p.title}</h2>
            <p className="text-sm text-gray-600">ROI moyen : {p.roi.toFixed(2)}%</p>
            <Link to={`/projects/${p.id}`} className="btn btn-sm mt-2">Voir</Link>
          </article>
        ))}
      </div>
    </main>
  );
}
```

### `ProjectDetailPage.tsx`

Page affichant les détails d'un projet spécifique.

```typescript
import { useEffect, useState } from 'react';
import VideoPlayer from '@/components/VideoPlayer';

type Details = { id:string; title:string; roi:number; synopsis:string; video:string };

export default function ProjectDetailPage() {
  const [data, setData] = useState<Details | null>(null);

  useEffect(() => {
    // TODO: fetch `/api/projects/:id`
    setData({ id:'p1', title:'Projet Alpha', roi:12.5, synopsis:'Synopsis bref…', video:'/media/p1/trailer.mp4' });
  }, []);

  if (!data) return <div>Chargement…</div>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6" aria-labelledby="pdTitle">
      <h1 id="pdTitle" className="text-2xl font-bold mb-4">{data.title}</h1>
      <VideoPlayer src={data.video} />
      <p className="mt-3">{data.synopsis}</p>
      <div className="mt-4 rounded border p-3 bg-gray-50">
        <p className="text-sm">
          ROI moyen observé : <strong>{data.roi.toFixed(2)}%</strong>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Le ROI est un indicateur de performance passée et ne garantit pas les résultats futurs.
        </p>
      </div>
      <button className="btn btn-primary mt-4 cta-invest">Investir (1–20 €)</button>
    </main>
  );
}
```

### `VideoExtractManager.tsx`

Composant pour gérer l'importation et la liste des extraits vidéo.

```typescript
import { useState } from 'react';

export default function VideoExtractManager() {
  const [files, setFiles] = useState<File[]>([]);
  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return; setFiles([...e.target.files]);
  }
  return (
    <section className="border rounded p-3" aria-labelledby="vemTitle">
      <h2 id="vemTitle" className="font-semibold mb-2">Gestion des extraits vidéo</h2>
      <input type="file" accept="video/*" multiple onChange={onFiles} />
      <ul className="mt-2 text-sm">
        {files.map(f => <li key={f.name}>{f.name} — {(f.size/1_000_000).toFixed(1)} Mo</li>)}
      </ul>
    </section>
  );
}
```

---

## Section 6 — UI Tableau de bord & Statistiques

Cette section regroupe les composants de l'interface utilisateur pour le tableau de bord et les statistiques.

### `DashboardPage.tsx`

Page principale du tableau de bord, agrégeant diverses statistiques et classements.

```typescript
import TopProjects from '@/components/TopProjects';
import TopCreators from '@/components/TopCreators';
import TopInvestors from '@/components/TopInvestors';
import Statistics from '@/components/Statistics';
import DailyBattle from '@/components/DailyBattle';

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 space-y-6" aria-labelledby="dbTitle">
      <h1 id="dbTitle" className="text-2xl font-bold">Tableau de bord</h1>
      <Statistics />
      <div className="grid gap-4 lg:grid-cols-3">
        <TopProjects />
        <TopCreators />
        <TopInvestors />
      </div>
      <DailyBattle />
    </main>
  );
}
```

### `Statistics.tsx`

Composant affichant les indicateurs clés de performance (KPIs).

```typescript
export default function Statistics() {
  const kpis = [
    { label:'Investissements (24h)', value:'€ 2 340' },
    { label:'Nouveaux inscrits', value:'128' },
    { label:'Projets actifs', value:'196' },
    { label:'Tickets dorés émis', value:'12' },
  ];
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map(k => (
        <div key={k.label} className="rounded border p-3">
          <div className="text-xs text-gray-500">{k.label}</div>
          <div className="text-lg font-semibold">{k.value}</div>
        </div>
      ))}
    </section>
  );
}
```

### `TopProjects.tsx`

Composant affichant les projets les mieux classés.

```typescript
export default function TopProjects() {
  const items = [{ id:'p1', title:'Alpha', roi:12.5 }, { id:'p2', title:'Beta', roi:9.1 }];
  return (
    <section className="border rounded p-3">
      <h2 className="font-semibold mb-2">Top Projets</h2>
      <ul className="text-sm">
        {items.map(p => <li key={p.id}>{p.title} — ROI {p.roi.toFixed(2)}%</li>)}
      </ul>
    </section>
  );
}
```

### `TopCreators.tsx`

Composant affichant les créateurs (porteurs de projets) les mieux classés.

```typescript
export default function TopCreators() {
  const items = [{ id:'c1', name:'Studio A', score:92 }, { id:'c2', name:'Créateur B', score:86 }];
  return (
    <section className="border rounded p-3">
      <h2 className="font-semibold mb-2">Top Porteurs</h2>
      <ul className="text-sm">
        {items.map(c => <li key={c.id}>{c.name} — score {c.score}</li>)}
      </ul>
    </section>
  );
}
```

### `TopInvestors.tsx`

Composant affichant les investisseurs les mieux classés.

```typescript
export default function TopInvestors() {
  const items = [{ id:'u1', nick:'Alice', stake:240 }, { id:'u2', nick:'Bob', stake:190 }];
  return (
    <section className="border rounded p-3">
      <h2 className="font-semibold mb-2">Top Investisseurs</h2>
      <ul className="text-sm">
        {items.map(u => <li key={u.id}>{u.nick} — € {u.stake}</li>)}
      </ul>
    </section>
  );
}
```

### `DailyBattle.tsx`

Composant affichant le Battle du jour, un duel entre projets.

```typescript
export default function DailyBattle() {
  const pairs = [
    { a:'Projet Alpha', b:'Projet Beta', votesA:320, votesB:305 },
  ];
  return (
    <section className="border rounded p-3">
      <h2 className="font-semibold mb-2">Duel du jour</h2>
      {pairs.map((p,i)=>(
        <div key={i} className="flex items-center justify-between py-2 border-t first:border-0">
          <div>{p.a}</div>
          <div className="text-xs text-gray-500">vs</div>
          <div>{p.b}</div>
          <div className="text-sm text-gray-700">{p.votesA} – {p.votesB} votes</div>
        </div>
      ))}
    </section>
  );
}
```

### `EconomicDashboard.tsx`

Composant affichant les règles économiques et financières du projet.

```typescript
export default function EconomicDashboard() {
  const rows = [
    { k:'Commission plateforme', v:'23 %' },
    { k:'VP par euro', v:'100 VP = 1 €' },
    { k:'Plafond/jour/projet', v:'100 €' },
    { k:'Plafond/sem.', v:'800 € (max 5 projets)' }
  ];
  return (
    <section className="border rounded p-3">
      <h2 className="font-semibold mb-2">Économie — Sept. 2025</h2>
      <dl className="grid sm:grid-cols-2 gap-y-2 text-sm">
        {rows.map(r=>(
          <div key={r.k} className="flex justify-between gap-3">
            <dt className="text-gray-600">{r.k}</dt>
            <dd className="font-medium">{r.v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

---

## Section 7 — UI Navigation & Layout

Cette section décrit les composants de l'interface utilisateur liés à la navigation et à la mise en page générale de l'application.

### `Header.tsx`

Composant d'en-tête (déjà fourni et validé, incluant internationalisation, éligibilité à l'investissement, menu mobile avec focus trap et gestion de la touche ESC, sans logo de caméra).

### `Footer.tsx`

Composant de pied de page, incluant les mentions légales, la politique de confidentialité et les préférences de cookies.

```typescript
export default function Footer() {
  return (
    <footer className="border-t mt-10">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-600 flex flex-wrap gap-3 items-center justify-between">
        <p>© {new Date().getFullYear()} VISUAL — Tous droits réservés.</p>
        <nav className="flex gap-3">
          <a href="/legal" className="hover:underline">Mentions légales</a>
          <a href="/privacy" className="hover:underline">Confidentialité</a>
          <button className="hover:underline" onClick={()=>window.dispatchEvent(new CustomEvent('open-cmp'))}>
            Préférences cookies
          </button>
        </nav>
      </div>
    </footer>
  );
}
```

### `MainMenu.tsx`

Composant du menu de navigation principal.

```typescript
import { Link, useLocation } from 'react-router-dom';

export default function MainMenu() {
  const { pathname } = useLocation();
  const items = [
    { to:'/', label:'Accueil' },
    { to:'/projects', label:'Projets' },
    { to:'/discover', label:'Découvrir' },
    { to:'/live', label:'Live Show' },
  ];
  return (
    <nav aria-label="Navigation principale" className="hidden md:flex gap-4">
      {items.map(i=>(
        <Link key={i.to} to={i.to}
          aria-current={pathname === i.to ? 'page': undefined}
          className={`px-3 py-1 rounded ${pathname===i.to?'bg-gray-100 font-medium':'hover:bg-gray-50'}`}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
```

### `CategoriesMenu.tsx`

Menu de navigation pour les catégories de projets.

```typescript
import { Link, useLocation } from 'react-router-dom';
export default function CategoriesMenu() {
  const { pathname } = useLocation();
  const cats = ['Documentaire','Clip','Animation','Court-métrage'];
  return (
    <nav aria-label="Catégories" className="flex gap-2 overflow-x-auto">
      {cats.map(c=>(
        <Link key={c} to={`/discover?category=${encodeURIComponent(c)}`}
          aria-current={pathname.includes('/discover') ? undefined : undefined}
          className="px-3 py-1 rounded bg-gray-50 hover:bg-gray-100 whitespace-nowrap">
          {c}
        </Link>
      ))}
    </nav>
  );
}
```

### `CategoriesSection.tsx`

Section affichant les catégories de projets avec leur ROI moyen.

```typescript
import { useEffect, useState } from 'react';

type Cat = { id:string; name:string; roiAvg:number };

export default function CategoriesSection() {
  const [list, setList] = useState<Cat[]>([]);
  useEffect(() => {
    // TODO: brancher /api/categories?withRoi=1
    setList([
      { id:'docu', name:'Documentaire', roiAvg:9.2 },
      { id:'clip', name:'Clip', roiAvg:7.1 },
    ]);
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8" aria-labelledby="catTitle">
      <h2 id="catTitle" className="text-xl font-semibold mb-3">Catégories</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {list.map(c=>(
          <article key={c.id} className="border rounded p-3">
            <h3 className="font-medium">{c.name}</h3>
            <p className="text-sm text-gray-600">ROI moyen : {c.roiAvg.toFixed(2)}%</p>
            <a className="btn btn-sm mt-2" href={`/discover?category=${c.id}`}>Voir</a>
          </article>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-500">Le ROI est informatif et non garanti.</p>
    </section>
  );
}
```

### `FilterSidebar.tsx`

Composant de barre latérale pour les filtres de recherche.

```typescript
import { useEffect, useRef } => {

type Props = { open:boolean; onClose:()=>void; onApply:(filters:Record<string,string>)=>void };

export default function FilterSidebar({ open, onClose, onApply }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function apply() {
    onApply({ category:'docu', minRoi:'5' });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40" onClick={onClose} role="dialog" aria-modal="true" aria-label="Filtres">
      <div ref={ref} className="absolute right-0 top-0 h-full w-80 bg-white p-4 shadow" onClick={(e)=>e.stopPropagation()}>
        <h2 className="font-semibold mb-3">Filtres</h2>
        <label className="block mb-2 text-sm">Catégorie</label>
        <select className="input mb-3"><option>Documentaire</option><option>Clip</option></select>
        <label className="block mb-2 text-sm">ROI minimum</label>
        <input className="input mb-4" placeholder="ex: 5" />
        <div className="flex gap-2">
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={apply}>Appliquer</button>
        </div>
      </div>
    </div>
  );
}
```

### `FilterBar.tsx`

Composant de barre de filtres pour la recherche et le tri.

```typescript
import { useSearchParams } from 'react-router-dom';

export default function FilterBar() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  function setQ(v:string){ const n = new URLSearchParams(params); v?n.set('q',v):n.delete('q'); setParams(n,{replace:true}); }
  return (
    <div className="flex gap-2">
      <input className="input" placeholder="Rechercher…" value={q} onChange={(e)=>setQ(e.target.value)} />
      <select className="input" value={params.get('sort')||'roi_desc'} onChange={(e)=>{ const n=new URLSearchParams(params); n.set('sort', e.target.value); setParams(n,{replace:true}); }}>
        <option value="roi_desc">ROI décroissant</option>
        <option value="roi_asc">ROI croissant</option>
      </select>
    </div>
  );
}
```

---

## Section 8 — UI Pages publiques

Cette section contient les composants des pages accessibles au public, telles que la page d'accueil et les pages d'erreur.

### `HomePage.tsx`

Page d'accueil du site, présentant les sections principales et les appels à l'action.

```typescript
import HeroSection from '@/components/HeroSection';
import HowItWorks from '@/components/HowItWorks';
import CallToAction from '@/components/CallToAction';

export default function HomePage() {
  return (
    <main aria-labelledby="homeTitle">
      <h1 id="homeTitle" className="sr-only">VISUAL Project — Plateforme participative</h1>

      <HeroSection />

      <section className="mx-auto max-w-6xl px-4 py-10 grid gap-4 sm:grid-cols-3" aria-label="Chiffres clés">
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-bold">1–20 €</p>
          <p className="text-sm text-gray-600">Tranches d’investissement</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-bold">100 VP = 1 €</p>
          <p className="text-sm text-gray-600">Conversion VISUpoints</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-bold">KYC &amp; Cautions</p>
          <p className="text-sm text-gray-600">≥18 ans, caution 20 € investisseur</p>
        </div>
      </section>

      <HowItWorks />

      <section className="mx-auto max-w-6xl px-4 py-10" aria-labelledby="hotProjectsTitle">
        <h2 id="hotProjectsTitle" className="text-xl font-semibold mb-4">Projets à la une</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => (
            <article key={i} className="border rounded p-3 hover:shadow">
              <h3 className="font-medium">Projet #{i}</h3>
              <p className="text-sm text-gray-600">Description courte…</p>
              <a href={`/projects/${i}`} className="btn btn-sm mt-2">Voir plus</a>
            </article>
          ))}
        </div>
      </section>

      <CallToAction />
    </main>
  );
}
```

### `HeroSection.tsx`

Section d'introduction avec un appel à l'action dynamique basé sur le statut de l'utilisateur.

```typescript
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore}'@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';

export default function HeroSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  const eligible = useMemo(() => {
    if (!user) return false;
    const roles = ['investor','invested_reader'];
    return roles.includes(user.profileType) && user.kycVerified && user.cautionEUR >= 20;
  }, [user]);

  function primaryAction() {
    navigate(eligible ? '/invest' : '/upgrade');
  }

  return (
    <section className="bg-gradient-to-br from-indigo-50 to-white border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {t('hero.title') || 'Soutenez des projets visuels, votez avec vos euros.'}
        </h2>
        <p className="mt-3 text-gray-700 max-w-2xl mx-auto">
          {t('hero.subtitle') || 'Investissez par tranches de 1 à 20 € et influencez le classement grâce aux VISUpoints (100 VP = 1 €).'}
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={primaryAction} className="btn btn-primary">
            {eligible ? (t('hero.ctaInvest') || 'Investir (1–20 €)') : (t('hero.ctaUpgrade') || 'Devenir investisseur')}
          </button>
          <a href="/discover" className="btn">
            {t('hero.ctaDiscover') || 'Découvrir les projets'}
          </a>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          {t('hero.disclaimer') || 'Aucun jeu de hasard : répartition selon performance, soumise à conditions.'}
        </p>
      </div>
    </section>
  );
}
```

### `HowItWorks.tsx`

Section expliquant le fonctionnement de la plateforme, incluant les étapes d'investissement et les conditions.

```typescript
import { useTranslation } from '@/hooks/useTranslation';

export default function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-6xl px-4 py-10" aria-labelledby="howTitle">
      <h2 id="howTitle" className="text-xl font-semibold mb-6">
        {t('how.title') || 'Comment ça marche ?'}
      </h2>

      <ol className="grid gap-4 sm:grid-cols-3 list-decimal list-inside">
        <li className="border rounded p-4">
          <h3 className="font-medium mb-1">{t('how.step1.title') || 'Choisissez un projet'}</h3>
          <p className="text-sm text-gray-700">
            {t('how.step1.desc') || 'Parcourez les catégories, consultez les extraits et l’historique.'}
          </p>
        </li>

        <li className="border rounded p-4">
          <h3 className="font-medium mb-1">{t('how.step2.title') || 'Investissez par tranches'}</h3>
          <p className="text-sm text-gray-700">
            {t('how.step2.desc') || '1, 2, 5, 10, 11–15, 20 € → 1 à 10 votes VISUpoints (100 VP = 1 €).'}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            {t('how.limits') || 'Plafonds : ≤ 100 €/projet/jour, ≤ 800 €/semaine (max 5 projets).'}
          </p>
        </li>

        <li className="border rounded p-4">
          <h3 className="font-medium mb-1">{t('how.step3.title') || 'Suivez la performance'}</h3>
          <p className="text-sm text-gray-700">
            {t('how.step3.desc') || 'Vos votes influencent les classements. La répartition est basée sur la performance, pas le hasard.'}
          </p>
        </li>
      </ol>

      <div className="mt-6 rounded-lg border p-4 bg-gray-50">
        <p className="text-sm">
          <strong>{t('how.cautions.title') || 'Cautions minimales:'}</strong>
          {t('how.cautions.desc') || '10 € porteur/infoporteur ; 20 € investisseur/investi-lecteur. KYC ≥ 18 ans requis pour investir.'}
        </p>
      </div>
    </section>
  );
}
```

### `CallToAction.tsx`

Composant d'appel à l'action générique.

```typescript
import { useTranslation } from '@/hooks/useTranslation';

export default function CallToAction() {
  const { t } = useTranslation();
  return (
    <section className="bg-indigo-600 text-white py-10 text-center">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="text-2xl font-bold mb-3">
          {t('cta.title') || 'Prêt à vous lancer ?'}
        </h2>
        <p className="text-lg mb-6">
          {t('cta.subtitle') || 'Rejoignez la communauté VISUAL et commencez à soutenir la création.'}
        </p>
        <a href="/signup" className="btn btn-light">
          {t('cta.button') || 'S'inscrire'}
        </a>
      </div>
    </section>
  );
}
```

---

## Section 9 — Hooks personnalisés

Cette section présente les hooks React personnalisés pour des fonctionnalités réutilisables.

### `useTranslation.ts`

Hook pour la gestion de l'internationalisation (i18n).

```typescript
import { useState, useEffect } from 'react';

const translations: Record<string, Record<string, string>> = {
  fr: {
    'hero.title': 'Soutenez des projets visuels, votez avec vos euros.',
    'hero.subtitle': 'Investissez par tranches de 1 à 20 € et influencez le classement grâce aux VISUpoints (100 VP = 1 €).',
    'hero.ctaInvest': 'Investir (1–20 €)',
    'hero.ctaUpgrade': 'Devenir investisseur',
    'hero.ctaDiscover': 'Découvrir les projets',
    'hero.disclaimer': 'Aucun jeu de hasard : répartition selon performance, soumise à conditions.',
    'how.title': 'Comment ça marche ?',
    'how.step1.title': 'Choisissez un projet',
    'how.step1.desc': 'Parcourez les catégories, consultez les extraits et l’historique.',
    'how.step2.title': 'Investissez par tranches',
    'how.step2.desc': '1, 2, 5, 10, 11–15, 20 € → 1 à 10 votes VISUpoints (100 VP = 1 €).',
    'how.limits': 'Plafonds : ≤ 100 €/projet/jour, ≤ 800 €/semaine (max 5 projets).',
    'how.step3.title': 'Suivez la performance',
    'how.step3.desc': 'Vos votes influencent les classements. La répartition est basée sur la performance, pas le hasard.',
    'how.cautions.title': 'Cautions minimales:',
    'how.cautions.desc': '10 € porteur/infoporteur ; 20 € investisseur/investi-lecteur. KYC ≥ 18 ans requis pour investir.',
    'cta.title': 'Prêt à vous lancer ?',
    'cta.subtitle': 'Rejoignez la communauté VISUAL et commencez à soutenir la création.',
    'cta.button': 'S'inscrire',
  },
  en: {
    'hero.title': 'Support visual projects, vote with your euros.',
    'hero.subtitle': 'Invest in increments of 1 to 20 € and influence rankings with VISUpoints (100 VP = 1 €).',
    'hero.ctaInvest': 'Invest (1–20 €)',
    'hero.ctaUpgrade': 'Become an investor',
    'hero.ctaDiscover': 'Discover projects',
    'hero.disclaimer': 'No gambling: distribution based on performance, subject to conditions.',
    'how.title': 'How it works?',
    'how.step1.title': 'Choose a project',
    'how.step1.desc': 'Browse categories, view extracts and history.',
    'how.step2.title': 'Invest in increments',
    'how.step2.desc': '1, 2, 5, 10, 11–15, 20 € → 1 to 10 VISUpoints votes (100 VP = 1 €).',
    'how.limits': 'Limits: ≤ 100 €/project/day, ≤ 800 €/week (max 5 projects).',
    'how.step3.title': 'Follow performance',
    'how.step3.desc': 'Your votes influence rankings. Distribution is based on performance, not chance.',
    'how.cautions.title': 'Minimum deposits:',
    'how.cautions.desc': '10 € creator/infocreator; 20 € investor/invested-reader. KYC ≥ 18 years required to invest.',
    'cta.title': 'Ready to get started?',
    'cta.subtitle': 'Join the VISUAL community and start supporting creation.',
    'cta.button': 'Sign up',
  },
};

export function useTranslation() {
  const [lang, setLang] = useState<'fr' | 'en'>('fr'); // Default language

  useEffect(() => {
    // You might get the user's preferred language from localStorage or browser settings
    const userLang = localStorage.getItem('lang') || navigator.language.split('-')[0];
    if (userLang === 'en') {
      setLang('en');
    }
  }, []);

  const t = (key: string) => {
    return translations[lang][key] || key; // Fallback to key if translation not found
  };

  return { t, lang, setLang };
}
```

---

## Section 10 — Utilities

Cette section contient des fonctions utilitaires générales.

### `formatters.ts`

Fonctions de formatage pour les nombres, devises, etc.

```typescript
export function formatCurrency(amount: number, currency = 'EUR', locale = 'fr-FR') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function formatPercentage(value: number, locale = 'fr-FR') {
  return new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100);
}
```

---

## Section 11 — API Endpoints (Mock Data)

Cette section liste les points d'API avec des exemples de données mockées pour le développement.

### `/api/projects`

Liste des projets.

```json
[
  { "id": "p1", "title": "Projet Alpha", "roi": 12.5, "thumb": "/img/p1.jpg" },
  { "id": "p2", "title": "Projet Beta", "roi": 8.3, "thumb": "/img/p2.jpg" }
]
```

### `/api/projects/:id`

Détails d'un projet spécifique.

```json
{
  "id": "p1",
  "title": "Projet Alpha",
  "roi": 12.5,
  "synopsis": "Synopsis bref…",
  "video": "/media/p1/trailer.mp4"
}
```

### `/api/categories`

Liste des catégories.

```json
[
  { "id": "docu", "name": "Documentaire", "roiAvg": 9.2 },
  { "id": "clip", "name": "Clip", "roiAvg": 7.1 }
]
```

---

## Section 12 — Règles Financières et VISUpoints (Mise à jour 11/09/2025)

Cette section détaille les règles financières et la gestion des VISUpoints, intégrant les dernières mises à jour.

### 12.1. Conversion VISUpoints

*   **100 VISUpoints (VP) = 1 €**
*   **Seuil de conversion visiteur → investisseur :** 2500 VP = 25 €
*   **Caution minimale :**
    *   Porteurs = 10 €
    *   Investisseurs = 20 €

### 12.2. Barème d'investissement (Votes par tranche €)

| Investissement (€) | Votes |
| :----------------- | :---- |
| 2                  | 1     |
| 3                  | 2     |
| 4                  | 3     |
| 5                  | 4     |
| 6                  | 5     |
| 8                  | 6     |
| 10                 | 7     |
| 12                 | 8     |
| 15                 | 9     |
| 20                 | 10    |

### 12.3. Répartition des investissements (TOP 100) — Nouvelle règle du 11/09/2025

*   **40 %** → Porteurs gagnants (TOP 10)
*   **30 %** → Investisseurs gagnants (TOP 10)
*   **23 %** → VISUAL (commission + reliquats arrondis)
*   **7 %** → Investisseurs perdants (rangs 11–100)

### 12.4. Répartition des Live Shows / Battles — Nouvelle règle du 11/09/2025

*   **40 %** → Artiste gagnant
*   **30 %** → Investisseurs gagnants (TOP 10 côté gagnant)
*   **20 %** → Artiste perdant
*   **10 %** → Investisseurs perdants

### 12.5. Répartition des Articles journalistiques

*   **60 %** → Infoporteur (tout auteur confondu)
*   **30 %** → Investi-lecteurs seulement gagnants dans le TOP 10 ou 10 premiers rangs (redistribution proportionnelle)
*   **10 %** → VISUAL (commission)

---

## Section 13 — Annexe : Code des Formules Mathématiques (Python)

Ce code Python (`visual_math_updated.py`) implémente les règles financières et de répartition décrites dans la Section 12. Il est conçu pour être intégré au backend de l'application VISUAL.

```python
# visual_math_updated.py
# VISUAL Project — Formules officielles (Sept. 2025) - Mise à jour 11/09/2025

# Constantes globales
VP_PER_EURO = 100                 # 100 VP = 1 €
CONVERSION_THRESHOLD_VP = 2500    # seuil de conversion
MIN_CASH_WITHDRAWAL_EUR = 25      # retrait possible dès 25 €

# Nouvelles répartitions des investissements (TOP 100) - 11/09/2025
SPLIT_INV_TOP100_CREATORS_TOP10 = 0.40  # 40% Porteurs gagnants (TOP 10)
SPLIT_INV_TOP100_INVESTORS_TOP10 = 0.30 # 30% Investisseurs gagnants (TOP 10)
SPLIT_INV_TOP100_VISUAL = 0.23          # 23% VISUAL (commission + reliquats arrondis)
SPLIT_INV_TOP100_INVESTORS_11_100 = 0.07 # 7% Investisseurs perdants (rangs 11–100)

# Nouvelles répartitions des Live Shows / Battles - 11/09/2025
SPLIT_LIVE_WINNING_ARTIST = 0.40        # 40% Artiste gagnant
SPLIT_LIVE_WINNING_INVESTORS_TOP10 = 0.30 # 30% Investisseurs gagnants (TOP 10 côté gagnant)
SPLIT_LIVE_LOSING_ARTIST = 0.20         # 20% Artiste perdant
SPLIT_LIVE_LOSING_INVESTORS = 0.10      # 10% Investisseurs perdants

# Répartition des Articles journalistiques
SPLIT_ARTICLE_INFOPORTEUR = 0.60        # 60% Infoporteur (tout auteur confondu)
SPLIT_ARTICLE_INVESTILECTEURS = 0.30    # 30% Investi-lecteurs seulement gagnants dans le TOP 10 ou 10 premiers rangs
SPLIT_ARTICLE_VISUAL = 0.10             # 10% VISUAL (commission)

# Table INVESTISSEURS : montant € → VISUpoints gagnés (table validée)
INVESTOR_POINTS_TABLE = {
  2: 10, 3: 15, 4: 20, 5: 25, 6: 30, 8: 40, 10: 50, 12: 60, 15: 80, 20: 110,
}

# Table VOTES : investissement € → votes (table 090825)
VOTES_BY_INVEST_TABLE = {
  2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 6, 10: 7, 12: 8, 15: 9, 20: 10,
}

# TOP10 investisseurs — pourcentages absolus de S (somme à répartir)
TOP10_INVESTOR_PCTS_ABS = [
  13.66, 6.83, 4.55, 3.41, 2.73, 2.28, 1.95, 1.71, 1.52, 1.37,
]

# TOP10 porteurs — pourcentages absolus de S
TOP10_CREATOR_PCTS_ABS = [
  10.24, 5.12, 3.41, 2.56, 2.05, 1.71, 1.46, 1.28, 1.14, 1.02,
]

# Utilitaire arrondi floor (toujours à l’euro inférieur)
def floor_eur(x: float) -> int:
  return int(x)

# 1) VISUpoints gagnés pour un investissement investisseur (table validée)
def investor_points(eur: int) -> int:
  return INVESTOR_POINTS_TABLE.get(eur, 0)

# 2) Votes générés par un investissement (table 090825)
def votes_by_investment(eur: int) -> int:
  return VOTES_BY_INVEST_TABLE.get(eur, 0)

# 3) Conversion VP → € : euros convertibles (seuil + floor)
def euros_from_points(points: int) -> int:
  if points < CONVERSION_THRESHOLD_VP:
    return 0
  return int(points / VP_PER_EURO)

# Points restants après conversion
def remaining_points_after_conversion(points: int) -> int:
  eur = euros_from_points(points)
  return points - eur * VP_PER_EURO

# 4) Golden Ticket — votes par montant (50→20, 75→30, 100→40)
def golden_ticket_votes(amount: int) -> int:
  if amount == 50:
    return 20
  if amount == 75:
    return 30
  if amount == 100:
    return 40
  return 0

# Golden Ticket — politique de remboursement par rang
def golden_ticket_refund_percent(rank: int) -> float:
  if 1 <= rank <= 10:
    return 1.0  # 100%
  if rank == 11:
    return 1.0  # 100%
  if 12 <= rank <= 20:
    return 0.5 # 50%
  return 0.0  # 0%

# 5) Répartition principale des investissements (TOP 100) - Nouvelle règle 11/09/2025
# S = somme totale à répartir (avant arrondis), en euros.
# N_inv_11_100 = nombre d’investisseurs éligibles sur les rangs 11–100 (uniques).
# Retourne des montants ARRONDIS à l’euro inférieur + reliquat (restes) rattaché à VISUAL.
def split_investments_top100(S: float, N_inv_11_100: int):
  # pools bruts
  pool_creators_top10 = S * SPLIT_INV_TOP100_CREATORS_TOP10
  pool_investors_top10 = S * SPLIT_INV_TOP100_INVESTORS_TOP10
  pool_visual = S * SPLIT_INV_TOP100_VISUAL
  pool_investors_11_100 = S * SPLIT_INV_TOP100_INVESTORS_11_100

  # TOP10 investisseurs — montants individuels floor
  inv_top10_raw = [ (pct / 100) * S for pct in TOP10_INVESTOR_PCTS_ABS ]
  inv_top10 = [ floor_eur(x) for x in inv_top10_raw ]

  # TOP10 porteurs — montants individuels floor
  port_top10_raw = [ (pct / 100) * S for pct in TOP10_CREATOR_PCTS_ABS ]
  port_top10 = [ floor_eur(x) for x in port_top10_raw ]

  # 11–100 investisseurs — équipartition floor
  part_small_raw = (pool_investors_11_100 / N_inv_11_100) if N_inv_11_100 > 0 else 0
  small_each = floor_eur(part_small_raw)
  small_total = small_each * (N_inv_11_100 or 0)

  # VISUAL reçoit le reliquat (écarts d’arrondis)
  visual_floor = floor_eur(pool_visual)
  allocated =
    sum(inv_top10) +
    sum(port_top10) +
    small_total +
    visual_floor
  remainder = floor_eur(S - allocated) # reste (en €) après floor

  return {
    "visual": visual_floor + remainder, # VISUAL intègre les restes, cf. règle
    "creators_top10": port_top10,
    "investors_top10": inv_top10,
    "investors_11_100_each": small_each,
    "investors_11_100_total": small_total,
  }

# 6) Répartition des Live Shows / Battles - Nouvelle règle 11/09/2025
def split_live_show_battle(S: float):
  return {
    "winning_artist": floor_eur(S * SPLIT_LIVE_WINNING_ARTIST),
    "winning_investors_top10": floor_eur(S * SPLIT_LIVE_WINNING_INVESTORS_TOP10),
    "losing_artist": floor_eur(S * SPLIT_LIVE_LOSING_ARTIST),
    "losing_investors": floor_eur(S * SPLIT_LIVE_LOSING_INVESTORS),
  }

# 7) Répartition des Articles journalistiques
def split_journalistic_articles(S: float):
  return {
    "infoporteur": floor_eur(S * SPLIT_ARTICLE_INFOPORTEUR),
    "investilecteurs_top10": floor_eur(S * SPLIT_ARTICLE_INVESTILECTEURS),
    "visual": floor_eur(S * SPLIT_ARTICLE_VISUAL),
  }

# 8) Coefficient d'engagement pour trier un TOP10 déjà sélectionné par votes
def engagement_coeff(total_amount: float, investors_count: int) -> float:
  denom = max(1, investors_count)
  return round((total_amount / denom) * 100) / 100.0 # 2 décimales

# 9) Règles d’upgrade Investisseur (cash ≥ 20 € OU exception fidélité 2 500 VP)
def can_become_investor(cash_deposits_eur: float, visupoints: int) -> bool:
  return cash_deposits_eur >= 20 or visupoints >= CONVERSION_THRESHOLD_VP

# 10) Crédit interne optionnel (équivalent VP/100, non retirable tant que < KYC/Stripe)
def internal_investing_credit_eur(visupoints: int) -> int:
  if visupoints < CONVERSION_THRESHOLD_VP:
    return 0
  return int(visupoints / VP_PER_EURO)
```




## Section 14 — Résumé condensé (Finances & VISUpoints)

Cette section fournit un résumé condensé des règles financières et de la gestion des VISUpoints, tel que mis à jour au 11/09/2025.

### 14.1. Conversion VISUpoints
- 100 VISUpoints (VP) = 1 €
- Seuil de conversion visiteur → investisseur : 2500 VP = 25 €
- Caution minimale : 
  - Porteurs = 10 € 
  - Investisseurs = 20 €

### 14.2. Barème d'investissement (Votes par tranche €)
- 2 € → 1 vote
- 3 € → 2 votes
- 4 € → 3 votes
- 5 € → 4 votes
- 6 € → 5 votes
- 8 € → 6 votes
- 10 € → 7 votes
- 12 € → 8 votes
- 15 € → 9 votes
- 20 € → 10 votes

### 14.3. Répartition des investissements (TOP 100)
_Nouvelle règle du 11/09/2025_
- 40 % → Porteurs gagnants (TOP 10)
- 30 % → Investisseurs gagnants (TOP 10)
- 23 % → VISUAL (commission + reliquats arrondis)
- 7 % → Investisseurs perdants (rangs 11–100)

### 14.4. Répartition des Live Shows / Battles
_Nouvelle règle du 11/09/2025_
- 40 % → Artiste gagnant
- 30 % → Investisseurs gagnants (TOP 10 côté gagnant)
- 20 % → Artiste perdant
- 10 % → Investisseurs perdants

### 14.5. Répartition des Articles journalistiques
- 60 % → Infoporteur (tout auteur confondu)
- 30 % → Investi-lecteurs seulement gagnants dans le TOP 10 ou 10 premiers rangs (redistribution proportionnelle)
- 10 % → VISUAL (commission)


