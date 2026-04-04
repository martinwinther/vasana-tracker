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
    <main className="flex min-h-screen items-center justify-center bg-void px-6">
      <div className="w-full max-w-sm">
        <div className="mb-12 text-center">
          <h1 className="font-display text-4xl tracking-tight text-parchment">
            Vasana
          </h1>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.4em] text-ash/40">
            Witness. Know. Be.
          </p>
        </div>

        <div className="rounded-3xl border border-parchment/5 bg-surface p-8 shadow-card">
          <p className="text-center text-sm leading-relaxed text-ash/80">
            Each vasana is a window into your conditioning. Observe without
            judgment — simply notice what arises and how often.
          </p>

          <button
            type="button"
            onClick={handleSignIn}
            disabled={busy}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-parchment/10 bg-raised py-4 text-sm font-bold uppercase tracking-widest text-parchment/80 transition-all hover:border-parchment/20 hover:bg-surface active:scale-[0.98] disabled:opacity-40"
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
          {error && <p className="mt-4 text-center text-xs text-ember/80">{error}</p>}
        </div>
      </div>
    </main>
  );
}

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-void">
      <div className="flex flex-col items-center gap-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-ash/10 border-t-ash/40" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-ash/30">
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
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-12 pt-4 sm:px-6 sm:pt-8">
        {/* ── Header ── */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl tracking-tight text-parchment">
              Vasana
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-ash/50">
              Witnessing the tendency
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-parchment/10 transition-all hover:border-parchment/30 hover:bg-surface"
            title="Sign out"
          >
            <svg
              className="h-4 w-4 text-ash transition-colors group-hover:text-parchment"
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
          </button>
        </header>

        {/* Stats Summary */}
        <div className="mb-10 grid grid-cols-3 gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ash/40">
              Nourishing
            </span>
            <span className="mt-1 text-2xl font-light text-moss">
              {nourishingCount}
            </span>
          </div>
          <div className="flex flex-col border-x border-parchment/5 px-4 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ash/40">
              Limiting
            </span>
            <span className="mt-1 text-2xl font-light text-ember">
              {limitingCount}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ash/40">
              Today
            </span>
            <span className="mt-1 text-sm font-medium text-parchment/80">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* ── Input + list section ── */}
        <section className="space-y-12">
          {/* Input form */}
          <div className="relative overflow-hidden rounded-3xl border border-parchment/5 bg-surface p-6 shadow-card">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-parchment/[0.02] blur-2xl" />
            <div className="relative space-y-4">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder="Notice a tendency…"
                className="w-full appearance-none resize-none bg-transparent px-0 text-lg text-parchment outline-none transition placeholder:text-ash/30"
              />

              <div className="flex flex-wrap gap-2">
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
                        "flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all active:scale-[0.97] disabled:opacity-20 disabled:grayscale",
                        meta.btnClass,
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "h-1.5 w-1.5 rounded-full",
                          meta.dotClass,
                        ].join(" ")}
                      />
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
                <div className="relative">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold/60">
                      In Focus
                    </h3>
                    <button
                      type="button"
                      onClick={() => toggleFocus(focusedEntry.id)}
                      className="text-[10px] font-bold uppercase tracking-widest text-ash/40 transition-colors hover:text-ash"
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
                    className="group relative w-full cursor-pointer select-none rounded-[2rem] border border-gold/20 bg-gold/[0.03] p-8 text-center transition-all hover:bg-gold/[0.05] active:scale-[0.99]"
                  >
                    <div className="mb-6 flex flex-col items-center gap-2">
                      <span className="text-6xl font-extralight tracking-tight text-gold">
                        {focusedEntry.count}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold/50">
                        Occurrences
                      </span>
                    </div>

                    <p className="text-xl font-light leading-relaxed text-parchment">
                      {focusedEntry.vasanaText}
                    </p>

                    <div className="mt-8 flex justify-center">
                      <span
                        className={[
                          "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest",
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
                <div className="flex flex-col items-center px-6 py-20 text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-parchment/[0.02] text-ash/20">
                    <svg
                      className="h-8 w-8"
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
                  <h3 className="font-display text-xl text-parchment/40">
                    The slate is clear
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-ash/40">
                    Observe the mind. When a pattern arises, record its quality.
                  </p>
                </div>
              );
            }

            if (listed.length === 0) return null;

            return (
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-ash/30">
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
                          "group relative flex items-center justify-between gap-4 rounded-2xl border bg-surface/40 p-4 transition-all hover:bg-surface active:scale-[0.99]",
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
                                "text-[9px] font-bold uppercase tracking-widest",
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

                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span
                            className={[
                              "text-xl font-light tabular-nums leading-none",
                              meta.countTextClass,
                            ].join(" ")}
                          >
                            {entry.count}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFocus(entry.id);
                            }}
                            className="text-[9px] font-bold uppercase tracking-widest text-ash/30 opacity-0 transition-all group-hover:opacity-100 hover:text-gold"
                          >
                            Focus
                          </button>
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
            <div className="pt-8">
              <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-ash/20">
                Yesterday
              </h3>

              <div className="grid gap-2">
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
                    className="group flex items-center justify-between gap-4 rounded-xl border border-parchment/[0.03] bg-parchment/[0.01] px-4 py-3 opacity-40 transition-all hover:bg-parchment/[0.03] hover:opacity-100 active:scale-[0.99]"
                  >
                    <p className="min-w-0 flex-1 truncate text-xs text-parchment/60">
                      {entry.vasanaText}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs tabular-nums text-ash/30">
                        {entry.count}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-accent opacity-0 transition-opacity group-hover:opacity-100">
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
