/* Path: client/components/onboarding/IntroTour.tsx */
import React, { useEffect, useState } from "react";

type Step = { selector: string; title: string; text: string };
const DEFAULT_STEPS: Step[] = [
  { selector: "#nav-projects", title: "Découvrir", text: "Retrouvez tous les projets à soutenir." },
  { selector: "#dock-curiosite", title: "Curiosité", text: "Cliquez sur ✨ pour une découverte au hasard." },
  { selector: "#cta-invest", title: "Investir", text: "Soutenez à partir de 2€ jusqu’à 20€." }
];

export function IntroTour({ steps = DEFAULT_STEPS }: { steps?: Step[] }) {
  const [i, setI] = useState(0);
  useEffect(()=>{
    const seen = localStorage.getItem("tour:intro");
    if (seen) return;
    // start tour
  },[]);

  if (localStorage.getItem("tour:intro")) return null;
  const s = steps[i];
  if (!s) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-black rounded-xl p-4 max-w-md pointer-events-auto">
        <div className="font-bold mb-1">{s.title}</div>
        <div className="text-sm mb-3">{s.text}</div>
        <div className="flex gap-2 justify-end">
          <button onClick={()=>{localStorage.setItem("tour:intro","1");}} className="px-3 py-1 border rounded">Passer</button>
          <button onClick={()=>setI(i+1)} className="px-3 py-1 bg-black text-white rounded">Suivant</button>
        </div>
      </div>
    </div>
  );
}
