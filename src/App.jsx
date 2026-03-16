import { useState, useEffect } from "react";

function getTodayStr() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function getYesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

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

const STORAGE_KEY = "vasana-tracker-v1";

export default function App() {
  const [draft, setDraft] = useState("");
  const [vasanas, setVasanas] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [mobileHeaderExpanded, setMobileHeaderExpanded] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vasanas));
  }, [vasanas]);

  const today = getTodayStr();
  const yesterday = getYesterdayStr();

  // Vasanas without a date are treated as today (backwards compat)
  const todayVasanas = vasanas.filter((v) => (v.date ?? today) === today);
  const yesterdayVasanas = vasanas.filter((v) => v.date === yesterday);

  const focusedVasana = todayVasanas.find((v) => v.focused) ?? null;

  const nourishingCount = todayVasanas
    .filter((v) => v.type === NOURISHING)
    .reduce((sum, v) => sum + v.count, 0);

  const limitingCount = todayVasanas
    .filter((v) => v.type === LIMITING)
    .reduce((sum, v) => sum + v.count, 0);

  function addVasana(type) {
    const value = draft.trim();
    if (!value) return;
    setVasanas((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: value,
        type,
        count: 1,
        focused: false,
        date: today,
      },
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

  // Removes the yesterday entry and adds a fresh today entry with count: 1
  function reactivateVasana(id) {
    const original = vasanas.find((v) => v.id === id);
    if (!original) return;
    setVasanas((prev) => [
      ...prev.filter((v) => v.id !== id),
      {
        id: crypto.randomUUID(),
        text: original.text,
        type: original.type,
        count: 1,
        focused: false,
        date: today,
      },
    ]);
  }

  return (
    <main className="min-h-screen bg-void text-parchment">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-3 pb-4 pt-2 sm:px-6 sm:pt-4">
        {/* ── Header ── */}
        <section className="rounded-[1.5rem] border border-parchment/6 bg-surface/70 p-3 shadow-none sm:rounded-[2rem] sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.26em] text-ash">
                Vasana Tracker
              </p>
              <h1 className="mt-1.5 font-display text-2xl leading-tight text-parchment/90 sm:mt-2 sm:text-3xl">
                Witness the tendency.
                <br />
                Know the self.
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setMobileHeaderExpanded((prev) => !prev)}
              className="mt-0.5 shrink-0 rounded-full border border-parchment/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ash/90 sm:hidden"
              aria-expanded={mobileHeaderExpanded}
              aria-controls="mobile-header-details"
            >
              {mobileHeaderExpanded ? "Hide" : "Info"}
            </button>
          </div>

          <div
            id="mobile-header-details"
            className={
              mobileHeaderExpanded ? "mt-1.5 block sm:block" : "hidden sm:block"
            }
          >
            <p className="max-w-xs text-[11px] leading-4 text-ash/80 sm:mt-2 sm:text-xs sm:leading-5">
              Each vasana is a window into your conditioning. Observe without
              judgment — simply notice what arises and how often.
            </p>

            {/* Stats row */}
            <div className="mt-2 grid grid-cols-3 gap-1 sm:mt-3 sm:gap-1.5">
              <div className="rounded-lg bg-void/70 px-2 py-1.5 sm:rounded-xl sm:px-2.5 sm:py-2">
                <p className="text-[10px] uppercase tracking-[0.22em] text-ash">
                  Today
                </p>
                <p className="mt-1 text-[11px] leading-snug text-parchment/80 sm:mt-1.5 sm:text-xs">
                  {formatToday()}
                </p>
              </div>

              <div className="rounded-lg bg-void/70 px-2 py-1.5 text-center sm:rounded-xl sm:px-2.5 sm:py-2">
                <p className="text-[10px] uppercase tracking-[0.22em] text-ash">
                  Nourishing
                </p>
                <p className="mt-1 text-xl font-semibold leading-none text-moss sm:mt-1.5 sm:text-2xl">
                  {nourishingCount}
                </p>
              </div>

              <div className="rounded-lg bg-void/70 px-2 py-1.5 text-center sm:rounded-xl sm:px-2.5 sm:py-2">
                <p className="text-[10px] uppercase tracking-[0.22em] text-ash">
                  Limiting
                </p>
                <p className="mt-1 text-xl font-semibold leading-none text-ember sm:mt-1.5 sm:text-2xl">
                  {limitingCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Input + list card ── */}
        <section className="mt-2 rounded-[1.5rem] border border-parchment/12 bg-surface p-4 sm:mt-3 sm:rounded-[2rem] sm:p-5 shadow-card">
          {/* Input form */}
          <div className="space-y-3">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ash/90">
                New vasana
              </span>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                placeholder="Describe this tendency as it appears in you…"
                className="w-full appearance-none resize-none rounded-2xl border border-parchment/10 bg-raised px-4 py-3 text-base text-parchment outline-none transition placeholder:text-ash/50 focus:border-ember/50 focus:ring-2 focus:ring-ember/10"
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

          {/* ── Today's vasana list ── */}
          {(() => {
            const listed = todayVasanas
              .map((v, i) => ({ vasana: v, originalIndex: i }))
              .filter(({ vasana }) => !vasana.focused);

            // True empty state — nothing at all, today or yesterday
            if (todayVasanas.length === 0 && yesterdayVasanas.length === 0) {
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

          {/* ── Yesterday's vasanas ── */}
          {yesterdayVasanas.length > 0 && (
            <div className="mt-6">
              {/* Section divider */}
              <div className="mb-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-parchment/8" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ash/40">
                  Yesterday
                </p>
                <div className="h-px flex-1 bg-parchment/8" />
              </div>

              <div className="space-y-2.5">
                {yesterdayVasanas.map((vasana) => (
                  <div
                    key={vasana.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => reactivateVasana(vasana.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        reactivateVasana(vasana.id);
                      }
                    }}
                    className="group w-full cursor-pointer select-none rounded-2xl border border-parchment/8 px-4 py-3.5 text-left transition-all duration-200 opacity-40 hover:opacity-75 active:scale-[0.99]"
                    style={{ backgroundColor: "rgba(26,30,37,0.5)" }}
                  >
                    {/* Row 1: type pill (desaturated) | yesterday count */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-parchment/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ash/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-ash/40" />
                        {TYPE_META[vasana.type].label}
                      </span>
                      <div className="flex shrink-0 items-baseline gap-1">
                        <span className="text-2xl font-semibold leading-none text-ash/40">
                          {vasana.count}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-ash/30">
                          yesterday
                        </span>
                      </div>
                    </div>

                    {/* Row 2: text | Revive label */}
                    <div className="mt-2.5 flex items-end justify-between gap-4">
                      <p className="flex-1 text-base leading-6 text-parchment/45">
                        {vasana.text}
                      </p>
                      <span className="shrink-0 rounded-full border border-parchment/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ash/35 transition-colors duration-200 group-hover:border-parchment/25 group-hover:text-ash/60">
                        Revive
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
