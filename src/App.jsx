import { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { auth, provider, db } from "./firebase.js";
import {
  NOURISHING,
  LIMITING,
  VASANA_TYPES,
  TYPE_META,
  getTodayStr,
  getYesterdayStr,
  createVasana,
  createEntry,
} from "./model.js";

function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

// ─── Sign-in screen ───────────────────────────────────────────────────────────

function SignInScreen({ onSignIn }) {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    setError(null);
    setBusy(true);
    try {
      await onSignIn();
    } catch (e) {
      setError("Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-void px-6">
      <div className="w-full max-w-sm text-center">
        <p className="text-xs uppercase tracking-[0.26em] text-ash">
          Vasana Tracker
        </p>
        <h1 className="mt-4 font-display text-3xl leading-tight text-parchment/90">
          Witness the tendency.
          <br />
          Know the self.
        </h1>
        <p className="mt-4 text-sm leading-6 text-ash/70">
          Each vasana is a window into your conditioning. Observe without
          judgment — simply notice what arises and how often.
        </p>

        <button
          type="button"
          onClick={handleSignIn}
          disabled={busy}
          className="mt-10 inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-parchment/15 bg-surface px-5 py-3.5 text-sm font-semibold text-parchment/80 transition hover:border-parchment/30 hover:text-parchment active:scale-[0.98] disabled:opacity-40"
        >
          {/* Google icon */}
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {busy ? "Signing in…" : "Continue with Google"}
        </button>

        {error && <p className="mt-3 text-xs text-ember/80">{error}</p>}
      </div>
    </main>
  );
}

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-void">
      <p className="text-xs uppercase tracking-[0.26em] text-ash/50">
        Loading…
      </p>
    </main>
  );
}

// ─── Main app ─────────────────────────────────────────────────────────────────

export default function App() {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  // undefined = still resolving, null = signed out, object = signed in
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return unsub;
  }, []);

  // ── Firestore state ───────────────────────────────────────────────────────────
  const [vasanas, setVasanas] = useState([]);
  const [todayEntries, setTodayEntries] = useState([]);
  const [yesterdayEntries, setYesterdayEntries] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const today = getTodayStr();
  const yesterday = getYesterdayStr();

  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    let resolved = 0;
    const tryDone = () => {
      if (++resolved >= 3) setDataLoading(false);
    };

    const unsubVasanas = onSnapshot(collection(db, "vasanas"), (snap) => {
      setVasanas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      tryDone();
    });

    const unsubToday = onSnapshot(
      query(collection(db, "entries"), where("date", "==", today)),
      (snap) => {
        setTodayEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        tryDone();
      },
    );

    const unsubYesterday = onSnapshot(
      query(collection(db, "entries"), where("date", "==", yesterday)),
      (snap) => {
        setYesterdayEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        tryDone();
      },
    );

    return () => {
      unsubVasanas();
      unsubToday();
      unsubYesterday();
    };
  }, [user, today, yesterday]);

  // ── UI-only state ─────────────────────────────────────────────────────────────
  const [draft, setDraft] = useState("");
  const [focusedEntryId, setFocusedEntryId] = useState(null);
  const [mobileHeaderExpanded, setMobileHeaderExpanded] = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const revivedIds = new Set(todayEntries.map((e) => e.vasanaId));
  const visibleYesterdayEntries = yesterdayEntries.filter(
    (e) => !revivedIds.has(e.vasanaId),
  );

  const focusedEntry =
    todayEntries.find((e) => e.id === focusedEntryId) ?? null;

  const nourishingCount = todayEntries
    .filter((e) => e.vasanaType === NOURISHING)
    .reduce((sum, e) => sum + e.count, 0);

  const limitingCount = todayEntries
    .filter((e) => e.vasanaType === LIMITING)
    .reduce((sum, e) => sum + e.count, 0);

  // ── Mutations ─────────────────────────────────────────────────────────────────

  async function addVasana(type) {
    const text = draft.trim();
    if (!text) return;
    setDraft(""); // clear immediately for snappy UX

    const vasanaRef = await addDoc(collection(db, "vasanas"), {
      ...createVasana({ text, type }),
      createdAt: serverTimestamp(),
      archivedAt: null,
    });

    await addDoc(collection(db, "entries"), {
      ...createEntry({
        vasanaId: vasanaRef.id,
        vasanaText: text,
        vasanaType: type,
        date: today,
      }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) e.preventDefault();
  }

  async function incrementEntry(id) {
    await updateDoc(doc(db, "entries", id), {
      count: increment(1),
      updatedAt: serverTimestamp(),
    });
  }

  function toggleFocus(entryId) {
    setFocusedEntryId((prev) => (prev === entryId ? null : entryId));
  }

  async function reactivateEntry(yesterdayEntry) {
    await addDoc(collection(db, "entries"), {
      ...createEntry({
        vasanaId: yesterdayEntry.vasanaId,
        vasanaText: yesterdayEntry.vasanaText,
        vasanaType: yesterdayEntry.vasanaType,
        date: today,
        count: 1,
      }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async function handleSignIn() {
    await signInWithPopup(auth, provider);
  }

  async function handleSignOut() {
    setFocusedEntryId(null);
    await signOut(auth);
  }

  // ── Auth / loading gates ──────────────────────────────────────────────────────
  if (user === undefined) return <LoadingScreen />;
  if (user === null) return <SignInScreen onSignIn={handleSignIn} />;
  if (dataLoading) return <LoadingScreen />;

  // ── Render ────────────────────────────────────────────────────────────────────
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

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileHeaderExpanded((prev) => !prev)}
                className="rounded-full border border-parchment/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ash/90 sm:hidden"
                aria-expanded={mobileHeaderExpanded}
                aria-controls="mobile-header-details"
              >
                {mobileHeaderExpanded ? "Hide" : "Info"}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                title="Sign out"
                className="rounded-full border border-parchment/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ash/50 transition hover:border-parchment/25 hover:text-ash/80"
              >
                Sign out
              </button>
            </div>
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
        <section className="mt-2 rounded-[1.5rem] border border-parchment/12 bg-surface p-4 shadow-card sm:mt-3 sm:rounded-[2rem] sm:p-5">
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

            <div className="grid grid-cols-3 gap-2">
              {VASANA_TYPES.map((type) => {
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
          {focusedEntry &&
            (() => {
              const meta = TYPE_META[focusedEntry.vasanaType];
              return (
                <div className="mt-4">
                  <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/70">
                    In Focus
                  </p>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => incrementEntry(focusedEntry.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        incrementEntry(focusedEntry.id);
                      }
                    }}
                    className="w-full cursor-pointer select-none rounded-2xl border border-gold/30 px-4 py-3.5 text-left transition active:scale-[0.99]"
                    style={{ backgroundColor: "rgba(196,151,74,0.07)" }}
                  >
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
                          {focusedEntry.count}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-ash/60">
                          arose
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-end justify-between gap-4">
                      <p className="flex-1 text-base leading-6 text-parchment">
                        {focusedEntry.vasanaText}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFocus(focusedEntry.id);
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

          {/* ── Today's entry list ── */}
          {(() => {
            const listed = todayEntries
              .map((e, i) => ({ entry: e, idx: i }))
              .filter(({ entry }) => entry.id !== focusedEntryId);

            if (
              todayEntries.length === 0 &&
              visibleYesterdayEntries.length === 0
            ) {
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
                {listed.map(({ entry, idx }) => {
                  const meta = TYPE_META[entry.vasanaType];
                  return (
                    <div
                      key={entry.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => incrementEntry(entry.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          incrementEntry(entry.id);
                        }
                      }}
                      className={[
                        "w-full cursor-pointer select-none rounded-2xl border px-4 py-3.5 text-left transition active:scale-[0.99]",
                        meta.cardBorderClass,
                      ].join(" ")}
                      style={{ backgroundColor: meta.cardBg }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] tabular-nums text-ash/50">
                            {idx + 1}
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
                            {entry.count}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-ash/60">
                            arose
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-end justify-between gap-4">
                        <p className="flex-1 text-base leading-6 text-parchment">
                          {entry.vasanaText}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFocus(entry.id);
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

          {/* ── Yesterday's entries ── */}
          {visibleYesterdayEntries.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-parchment/8" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ash/40">
                  Yesterday
                </p>
                <div className="h-px flex-1 bg-parchment/8" />
              </div>

              <div className="space-y-2.5">
                {visibleYesterdayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => reactivateEntry(entry)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        reactivateEntry(entry);
                      }
                    }}
                    className="group w-full cursor-pointer select-none rounded-2xl border border-parchment/8 px-4 py-3.5 text-left transition-all duration-200 opacity-40 hover:opacity-75 active:scale-[0.99]"
                    style={{ backgroundColor: "rgba(26,30,37,0.5)" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-parchment/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ash/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-ash/40" />
                        {TYPE_META[entry.vasanaType].label}
                      </span>
                      <div className="flex shrink-0 items-baseline gap-1">
                        <span className="text-2xl font-semibold leading-none text-ash/40">
                          {entry.count}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-ash/30">
                          yesterday
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-end justify-between gap-4">
                      <p className="flex-1 text-base leading-6 text-parchment/45">
                        {entry.vasanaText}
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
