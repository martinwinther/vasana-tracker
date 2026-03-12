import { useState } from "react";

function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

const NOURISHING = "nourishing";
const LIMITING = "limiting";
const NEUTRAL = "neutral";

const TYPE_META = {
  [NOURISHING]: {
    label: "Nourishing",
    dotClass: "bg-moss",
    btnClass: "border border-moss/40 bg-moss/20 text-moss",
    pillClass: "bg-moss/20 text-moss",
    countTextClass: "text-moss",
    cardBg: "rgba(114,168,116,0.07)",
    cardBorderClass: "border-moss/20",
  },
  [LIMITING]: {
    label: "Limiting",
    dotClass: "bg-ember",
    btnClass: "border border-ember/40 bg-ember/20 text-ember",
    pillClass: "bg-ember/20 text-ember",
    countTextClass: "text-ember",
    cardBg: "rgba(201,122,85,0.07)",
    cardBorderClass: "border-ember/20",
  },
  [NEUTRAL]: {
    label: "Neutral",
    dotClass: "bg-clay",
    btnClass: "border border-clay/40 bg-clay/20 text-clay",
    pillClass: "bg-clay/20 text-clay",
    countTextClass: "text-clay",
    cardBg: "rgba(122,112,104,0.07)",
    cardBorderClass: "border-clay/20",
  },
};

export default function App() {
  const [draft, setDraft] = useState("");
  const [vasanas, setVasanas] = useState([]);

  const focusedVasana = vasanas.find((v) => v.focused) ?? null;

  const nourishingCount = vasanas
    .filter((v) => v.type === NOURISHING)
    .reduce((sum, v) => sum + v.count, 0);

  const limitingCount = vasanas
    .filter((v) => v.type === LIMITING)
    .reduce((sum, v) => sum + v.count, 0);

  function addVasana(type) {
    const value = draft.trim();
    if (!value) return;
    setVasanas((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: value, type, count: 1, focused: false },
    ]);
    setDraft("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) e.preventDefault();
  }

  function incrementVasana(id) {
    setVasanas((prev) =>
      prev.map((v) => (v.id === id ? { ...v, count: v.count + 1 } : v)),
    );
  }

  function toggleFocus(id) {
    setVasanas((prev) =>
      prev.map((v) => ({
        ...v,
        focused: v.id === id ? !v.focused : false,
      })),
    );
  }

  return (
    <main className="min-h-screen bg-void text-parchment">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-8 pt-6 sm:px-6">
        {/* ── Header ── */}
        <section className="rounded-[2rem] border border-parchment/8 bg-surface p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.26em] text-ash">
            Vasana Tracker
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-parchment">
            Witness the tendency.
            <br />
            Know the self.
          </h1>
          <p className="mt-4 max-w-xs text-sm leading-6 text-ash">
            Each vasana is a window into your conditioning. Observe without
            judgment — simply notice what arises and how often.
          </p>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-void px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-ash">
                Today
              </p>
              <p className="mt-1.5 text-xs leading-snug text-parchment/80">
                {formatToday()}
              </p>
            </div>

            <div className="rounded-2xl bg-void px-3 py-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.22em] text-ash">
                Nourishing
              </p>
              <p className="mt-1.5 text-2xl font-semibold leading-none text-moss">
                {nourishingCount}
              </p>
            </div>

            <div className="rounded-2xl bg-void px-3 py-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.22em] text-ash">
                Limiting
              </p>
              <p className="mt-1.5 text-2xl font-semibold leading-none text-ember">
                {limitingCount}
              </p>
            </div>
          </div>
        </section>

        {/* ── Input + list card ── */}
        <section className="mt-4 rounded-[2rem] border border-parchment/8 bg-surface p-4 shadow-card">
          {/* Input form */}
          <div className="space-y-3">
            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-ash">
                New vasana
              </span>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                placeholder="Describe this tendency as it appears in you…"
                className="w-full appearance-none resize-none rounded-2xl border border-parchment/10 bg-raised px-4 py-3 text-base text-parchment outline-none transition placeholder:text-ash/50 focus:border-ember/50 focus:ring-2 focus:ring-ember/10"
                style={{ backgroundColor: "#1e1c19" }}
              />
            </label>

            {/* Three type buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[NOURISHING, LIMITING, NEUTRAL].map((type) => {
                const meta = TYPE_META[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addVasana(type)}
                    disabled={!draft.trim()}
                    className={[
                      "flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-semibold transition active:scale-[0.97] disabled:opacity-30",
                      meta.btnClass,
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        meta.dotClass,
                      ].join(" ")}
                    />
                    {meta.label}
                  </button>
                );
              })}
            </div>

            <p className="text-center text-[11px] text-ash/60">
              What quality does this tendency have in your life?
            </p>
          </div>

          {/* ── In Focus card ── */}
          {focusedVasana &&
            (() => {
              const meta = TYPE_META[focusedVasana.type];
              return (
                <div className="mt-4">
                  <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/70">
                    In Focus
                  </p>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => incrementVasana(focusedVasana.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        incrementVasana(focusedVasana.id);
                      }
                    }}
                    className="w-full cursor-pointer select-none rounded-2xl border border-gold/30 px-4 py-3.5 text-left transition active:scale-[0.99]"
                    style={{ backgroundColor: "rgba(196,151,74,0.07)" }}
                  >
                    {/* Row 1: type pill | count arose */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={[
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                          meta.pillClass,
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "h-1.5 w-1.5 rounded-full",
                            meta.dotClass,
                          ].join(" ")}
                        />
                        {meta.label}
                      </span>
                      <div className="flex shrink-0 items-baseline gap-1">
                        <span
                          className={[
                            "text-2xl font-semibold leading-none",
                            meta.countTextClass,
                          ].join(" ")}
                        >
                          {focusedVasana.count}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-ash/60">
                          arose
                        </span>
                      </div>
                    </div>

                    {/* Row 2: text | Remove button */}
                    <div className="mt-2.5 flex items-end justify-between gap-4">
                      <p className="flex-1 text-base leading-6 text-parchment">
                        {focusedVasana.text}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFocus(focusedVasana.id);
                        }}
                        className="shrink-0 rounded-full border border-parchment/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ash/70 transition hover:border-parchment/35 hover:text-parchment/80"
                        aria-label="Remove from focus"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* ── Vasana list (focused vasana is lifted out above) ── */}
          {(() => {
            const listed = vasanas
              .map((v, i) => ({ vasana: v, originalIndex: i }))
              .filter(({ vasana }) => !vasana.focused);

            if (vasanas.length === 0) {
              return (
                <div className="mt-4 rounded-2xl border border-dashed border-parchment/10 px-4 py-10 text-center">
                  <p className="font-display text-xl text-parchment/60">
                    Nothing recorded yet
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ash">
                    As a tendency arises, describe it above and give it a
                    quality. Tap its card each time the same pattern returns.
                  </p>
                </div>
              );
            }

            if (listed.length === 0) return null;

            return (
              <div className="mt-4 space-y-2.5">
                {listed.map(({ vasana, originalIndex }) => {
                  const meta = TYPE_META[vasana.type];
                  return (
                    <div
                      key={vasana.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => incrementVasana(vasana.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          incrementVasana(vasana.id);
                        }
                      }}
                      className={[
                        "w-full cursor-pointer select-none rounded-2xl border px-4 py-3.5 text-left transition active:scale-[0.99]",
                        meta.cardBorderClass,
                      ].join(" ")}
                      style={{ backgroundColor: meta.cardBg }}
                    >
                      {/* Row 1: index + type pill | count arose */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] tabular-nums text-ash/50">
                            {originalIndex + 1}
                          </span>
                          <span
                            className={[
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                              meta.pillClass,
                            ].join(" ")}
                          >
                            <span
                              className={[
                                "h-1.5 w-1.5 rounded-full",
                                meta.dotClass,
                              ].join(" ")}
                            />
                            {meta.label}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-baseline gap-1">
                          <span
                            className={[
                              "text-2xl font-semibold leading-none",
                              meta.countTextClass,
                            ].join(" ")}
                          >
                            {vasana.count}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-ash/60">
                            arose
                          </span>
                        </div>
                      </div>

                      {/* Row 2: text | Focus button */}
                      <div className="mt-2.5 flex items-end justify-between gap-4">
                        <p className="flex-1 text-base leading-6 text-parchment">
                          {vasana.text}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFocus(vasana.id);
                          }}
                          className="shrink-0 rounded-full border border-parchment/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ash/70 transition hover:border-parchment/35 hover:text-parchment/80"
                          aria-label="Set as focus"
                        >
                          Focus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </section>
      </div>
    </main>
  );
}
