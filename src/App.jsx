import { useState, useEffect, useRef } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
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
  NEUTRAL,
  VASANA_TYPES,
  TYPE_META,
  getTodayStr,
  getYesterdayStr,
  createVasana,
  createEntry,
} from "./model.js";

function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-72 w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(179,155,115,0.07),transparent_62%)]" />
      </div>
      <div className="relative w-full max-w-sm rounded-[2rem] border border-parchment/10 bg-surface/90 p-5 shadow-card backdrop-blur-sm">
        <div className="mb-10 text-center">
          <h1 className="font-display text-5xl tracking-tight text-parchment">
            Vasana
          </h1>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.3em] text-ash/70">
            Open. Calm. Simple.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-parchment/10 bg-void/40 p-6">
          <p className="text-center text-sm leading-relaxed text-ash/90">
            Each vasana is a window into your conditioning. Observe without
            judgment — simply notice what arises and how often.
          </p>

          <button
            type="button"
            onClick={handleSignIn}
            disabled={busy}
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-parchment/20 bg-raised py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-parchment/90 transition-all hover:border-parchment/30 hover:bg-surface active:scale-[0.98] disabled:opacity-40"
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
            {busy ? "Entering…" : "Enter"}
          </button>
          {error && <p className="mt-4 text-center text-xs text-ember">{error}</p>}
        </div>
      </div>
    </main>
  );
}

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-void">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-parchment/10 bg-surface/80 px-8 py-7">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ash/20 border-t-gold/55" />
        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-ash/70">
          Loading
        </p>
      </div>
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
  const [undoEntry, setUndoEntry] = useState(null);
  const undoTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

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

  const neutralCount = todayEntries
    .filter((e) => e.vasanaType === NEUTRAL)
    .reduce((sum, e) => sum + e.count, 0);

  const totalCount = nourishingCount + limitingCount + neutralCount;

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

  function queueUndo(entry) {
    setUndoEntry(entry);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setUndoEntry(null);
      undoTimerRef.current = null;
    }, 5000);
  }

  async function removeEntry(entry) {
    setFocusedEntryId((prev) => (prev === entry.id ? null : prev));
    await deleteDoc(doc(db, "entries", entry.id));
    queueUndo(entry);
  }

  async function undoRemove() {
    if (!undoEntry) return;

    const entry = undoEntry;
    setUndoEntry(null);
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    await addDoc(collection(db, "entries"), {
      ...createEntry({
        vasanaId: entry.vasanaId,
        vasanaText: entry.vasanaText,
        vasanaType: entry.vasanaType,
        date: today,
        count: entry.count,
      }),
      createdAt: serverTimestamp(),
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
    setUndoEntry(null);
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    await signOut(auth);
  }

  // ── Auth / loading gates ──────────────────────────────────────────────────────
  if (user === undefined) return <LoadingScreen />;
  if (user === null) return <SignInScreen onSignIn={handleSignIn} />;
  if (dataLoading) return <LoadingScreen />;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <main className="relative min-h-screen overflow-hidden bg-void text-parchment">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-72 w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(179,155,115,0.07),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 h-64 w-full bg-[radial-gradient(ellipse_at_bottom,rgba(163,190,140,0.08),transparent_68%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-md px-3 pb-8 pt-3 sm:px-6 sm:pb-12 sm:pt-8">
        <div className="min-h-[calc(100vh-1.5rem)] rounded-[2rem] border border-parchment/10 bg-surface/85 p-4 shadow-card backdrop-blur-sm sm:min-h-[calc(100vh-4rem)] sm:p-6">
          {/* ── Header ── */}
          <header className="mb-6 flex items-start justify-between">
            <div>
              <p className="mb-2 inline-flex items-center rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/70">
                Today {formatToday()}
              </p>
              <h1 className="font-display text-[clamp(1.8rem,6vw,2.25rem)] leading-none text-parchment">
                Vasana
              </h1>
              <p className="mt-1 text-xs tracking-wide text-ash/80">
                Witness with softness, record with clarity.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="group inline-flex items-center gap-2 rounded-full border border-parchment/15 bg-void/50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-ash transition-all hover:border-parchment/30 hover:text-parchment active:scale-[0.98]"
              title="Sign out"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Exit
            </button>
          </header>

          {/* Stats Summary */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-parchment/10 bg-raised/60">
            <div className="grid grid-cols-3 divide-x divide-parchment/10">
              <div className="px-3 py-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-ash/70">
                  Nourishing
                </p>
                <p className="mt-1 text-[1.9rem] font-light tabular-nums text-moss">
                  {nourishingCount}
                </p>
              </div>
              <div className="px-3 py-3 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-ash/70">
                  Limiting
                </p>
                <p className="mt-1 text-[1.9rem] font-light tabular-nums text-ember">
                  {limitingCount}
                </p>
              </div>
              <div className="px-3 py-3 text-right">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-ash/70">
                  Neutral
                </p>
                <p className="mt-1 text-[1.9rem] font-light tabular-nums text-clay">
                  {neutralCount}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-parchment/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-ash/70">
              <span>Total today</span>
              <span className="tabular-nums text-parchment/85">{totalCount}</span>
            </div>
          </div>

          {/* ── Input + list section ── */}
          <section className="space-y-8">
            {/* Input form */}
            <div className="relative overflow-hidden rounded-[1.75rem] border border-parchment/10 bg-void/40 p-4">
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-moss/10 blur-2xl" />
              <div className="relative space-y-4">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder="What tendency appeared right now?"
                  className="w-full appearance-none resize-none rounded-2xl border border-parchment/10 bg-surface/80 px-4 py-3 text-base leading-relaxed text-parchment outline-none transition placeholder:text-ash/60 focus:border-gold/40"
                />

                <div className="grid grid-cols-3 gap-2">
                  {VASANA_TYPES.map((type) => {
                    const meta = TYPE_META[type];
                    const isActive = draft.trim().length > 0;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => addVasana(type)}
                        disabled={!isActive}
                        className={[
                          "inline-flex items-center justify-center rounded-xl px-2 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-all active:scale-[0.97] disabled:opacity-25 disabled:grayscale",
                          meta.btnClass,
                        ].join(" ")}
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── In Focus card ── */}
          {focusedEntry &&
            (() => {
              const meta = TYPE_META[focusedEntry.vasanaType];
              return (
                <div className="relative rounded-[1.75rem] border border-gold/30 bg-gold/[0.05] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.26em] text-gold/75">
                      In Focus
                    </h3>
                    <button
                      type="button"
                      onClick={() => toggleFocus(focusedEntry.id)}
                      className="text-[10px] font-bold uppercase tracking-[0.2em] text-ash/70 transition-colors hover:text-parchment"
                    >
                      Clear
                    </button>
                  </div>
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
                    className="group relative w-full cursor-pointer select-none rounded-[1.5rem] border border-gold/20 bg-void/40 p-6 text-center transition-all hover:bg-gold/[0.08] active:scale-[0.99]"
                  >
                    <div className="mb-6 flex flex-col items-center gap-2">
                      <span className="text-6xl font-extralight tracking-tight text-gold">
                        {focusedEntry.count}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold/60">
                        Occurrences
                      </span>
                    </div>

                    <p className="text-lg font-light leading-relaxed text-parchment">
                      {focusedEntry.vasanaText}
                    </p>

                    <div className="mt-8 flex justify-center">
                      <span
                        className={[
                          "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]",
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
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeEntry(focusedEntry)}
                      className="inline-flex items-center rounded-lg border border-ember/25 bg-ember/[0.08] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-ember/80 transition-all hover:bg-ember/[0.16] hover:text-ember"
                    >
                      Remove From Today
                    </button>
                  </div>
                </div>
              );
            })()}

          {/* ── Today's entry list ── */}
          {(() => {
            const listed = todayEntries
              .map((e, i) => ({ entry: e, idx: i }))
              .filter(({ entry }) => entry.id !== focusedEntryId);

            if (todayEntries.length === 0 && visibleYesterdayEntries.length === 0) {
              return (
                <div className="flex flex-col items-center rounded-[1.75rem] border border-parchment/10 bg-void/30 px-6 py-16 text-center">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-parchment/10 bg-parchment/[0.03] text-ash/40">
                    <svg
                      className="h-7 w-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <h3 className="font-display text-xl text-parchment/70">
                    Quiet mind, clear slate
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-ash/70">
                    When a thought pattern appears, capture it once. Repetitions are one tap away.
                  </p>
                </div>
              );
            }

            if (listed.length === 0) return null;

            return (
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-ash/50">
                  Recent
                </h3>
                <div className="grid gap-3">
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
                          "group relative flex items-center justify-between gap-4 rounded-2xl border bg-void/30 p-4 transition-all hover:bg-surface/60 active:scale-[0.99]",
                          meta.cardBorderClass,
                        ].join(" ")}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex items-center gap-2">
                            <span
                              className={[
                                "h-1.5 w-1.5 rounded-full",
                                meta.dotClass,
                              ].join(" ")}
                            />
                            <span
                              className={[
                                "text-[9px] font-bold uppercase tracking-[0.2em]",
                                meta.countTextClass,
                              ].join(" ")}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-sm leading-relaxed text-parchment/90">
                            {entry.vasanaText}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span
                            className={[
                              "text-2xl font-light tabular-nums leading-none",
                              meta.countTextClass,
                            ].join(" ")}
                          >
                            {entry.count}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeEntry(entry);
                              }}
                              className="inline-flex h-8 items-center justify-center rounded-lg border border-ember/25 bg-ember/[0.1] px-3 text-[9px] font-bold uppercase tracking-[0.16em] text-ember/90 transition-all hover:bg-ember/[0.2] sm:opacity-0 sm:group-hover:opacity-100"
                            >
                              Remove
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFocus(entry.id);
                              }}
                              className="inline-flex h-8 items-center justify-center rounded-lg border border-gold/20 bg-gold/[0.06] px-3 text-[9px] font-bold uppercase tracking-[0.16em] text-gold/85 transition-all hover:bg-gold/[0.14] sm:opacity-0 sm:group-hover:opacity-100"
                            >
                              Focus
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ── Yesterday's entries ── */}
          {visibleYesterdayEntries.length > 0 && (
            <section className="relative overflow-hidden rounded-[1.75rem] border border-parchment/10 bg-void/30 px-4 py-5">
              <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(216,222,233,0.24),transparent)]" />

              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-ash/55">
                    Yesterday
                  </h3>
                  <p className="mt-2 max-w-sm text-xs leading-relaxed text-ash/60">
                    These were tracked yesterday. Tap any row to bring it back
                    into today as a fresh entry.
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-parchment/10 bg-surface/40 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-ash/50">
                  {visibleYesterdayEntries.length} items
                </span>
              </div>

              <div className="grid gap-2">
                {visibleYesterdayEntries.map((entry) => {
                  const meta = TYPE_META[entry.vasanaType];

                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => reactivateEntry(entry)}
                      className="group flex w-full items-center justify-between gap-4 rounded-xl border border-parchment/10 bg-void/20 px-4 py-3 text-left opacity-55 transition-all grayscale hover:bg-surface/55 hover:opacity-100 hover:grayscale-0 active:scale-[0.99]"
                      aria-label={`Revive yesterday's vasana: ${entry.vasanaText}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center gap-2">
                          <span
                            className={[
                              "h-1.5 w-1.5 rounded-full",
                              meta.dotClass,
                            ].join(" ")}
                          />
                          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-ash/45">
                            {meta.label}
                          </span>
                        </div>
                        <p className="truncate text-xs leading-relaxed text-parchment/72">
                          {entry.vasanaText}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs tabular-nums text-ash/45">
                          {entry.count}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gold/70 opacity-0 transition-opacity group-hover:opacity-100">
                          Revive
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
          </section>
        </div>
      </div>

      {undoEntry && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
          <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-4 rounded-2xl border border-parchment/20 bg-surface/95 px-4 py-3 shadow-card backdrop-blur-sm">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-ash/60">
                Removed from today
              </p>
              <p className="truncate text-xs text-parchment/85">{undoEntry.vasanaText}</p>
            </div>
            <button
              type="button"
              onClick={undoRemove}
              className="shrink-0 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-gold transition-all hover:bg-gold/20"
            >
              Undo
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
