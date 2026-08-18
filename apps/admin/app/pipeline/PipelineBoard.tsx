"use client";

import { useMemo, useState } from "react";

type Card = { id: string; name: string; score: number; slug: string };
type Stage = { id: string; label: string };

const stages: Stage[] = [
  { id: "discovered", label: "Discovered" },
  { id: "qualified", label: "Qualified" },
  { id: "researching", label: "Researching" },
  { id: "demo-building", label: "Demo Building" },
  { id: "demo-ready", label: "Demo Ready" },
  { id: "contacted", label: "Contacted" },
  { id: "interested", label: "Interested" },
  { id: "proposal", label: "Proposal" },
  { id: "won", label: "Won" },
];

const seed: Record<string, Card[]> = {
  discovered: [{ id: "evergreen", name: "Evergreen Plumbing", score: 73, slug: "evergreen-plumbing" }],
  qualified: [{ id: "northstar", name: "Northstar Electrical", score: 81, slug: "northstar-electrical" }],
  researching: [{ id: "summit", name: "Summit Roofing Co.", score: 84, slug: "summit-roofing-co" }],
  "demo-building": [{ id: "oak-stone", name: "Oak & Stone Dental", score: 86, slug: "oak-stone-dental" }],
  "demo-ready": [{ id: "harrison", name: "Harrison & Sons HVAC", score: 91, slug: "harrison-sons-hvac" }],
  contacted: [{ id: "blue-oak", name: "Blue Oak Landscaping", score: 78, slug: "blue-oak-landscaping" }],
  interested: [{ id: "precision", name: "Precision Auto Care", score: 88, slug: "precision-auto-care" }],
  proposal: [{ id: "riverbend", name: "Riverbend Plumbing", score: 94, slug: "riverbend-plumbing" }],
  won: [{ id: "modern-lawn", name: "Modern Lawn Co.", score: 96, slug: "modern-lawn-co" }],
};

export default function PipelineBoard() {
  const [board, setBoard] = useState(seed);
  const [dragged, setDragged] = useState<{ card: Card; from: string } | null>(null);
  const total = useMemo(() => Object.values(board).reduce((sum, cards) => sum + cards.length, 0), [board]);

  function drop(to: string) {
    if (!dragged || dragged.from === to) return;
    setBoard((current) => ({
      ...current,
      [dragged.from]: current[dragged.from].filter((card) => card.id !== dragged.card.id),
      [to]: [...current[to], dragged.card],
    }));
    setDragged(null);
  }

  return (
    <>
      <div className="pipeline-meta"><span>{total} active opportunities</span><span>Drag cards to change stage</span></div>
      <div className="pipeline-board">
        {stages.map((stage) => (
          <section className="pipeline-column" key={stage.id} onDragOver={(event) => event.preventDefault()} onDrop={() => drop(stage.id)}>
            <div className="pipeline-column-head"><strong>{stage.label}</strong><span>{board[stage.id].length}</span></div>
            <div className="pipeline-cards">
              {board[stage.id].map((card) => (
                <a
                  className="pipeline-card"
                  href={`/businesses/${card.slug}`}
                  draggable
                  key={card.id}
                  onDragStart={() => setDragged({ card, from: stage.id })}
                  onDragEnd={() => setDragged(null)}
                >
                  <strong>{card.name}</strong>
                  <div><span className="score">{card.score}/100</span><span className="muted"> opportunity</span></div>
                </a>
              ))}
              {!board[stage.id].length && <div className="pipeline-empty">Drop here</div>}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
