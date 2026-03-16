/**
 * @fileoverview Shared data model for Vasana Tracker.
 *
 * Firestore collections
 * ─────────────────────
 *  /vasanas/{vasanaId}   – the tendency itself, created once
 *  /entries/{entryId}    – one document per vasana per calendar day
 *
 * Neither collection is user-partitioned because the app is single-user.
 * If multi-user is ever added, wrap both under /users/{uid}/.
 */

// ─── Vasana types ────────────────────────────────────────────────────────────

export const NOURISHING = "nourishing";
export const LIMITING   = "limiting";
export const NEUTRAL    = "neutral";

/** @type {string[]} */
export const VASANA_TYPES = [NOURISHING, LIMITING, NEUTRAL];

// ─── Factory functions ────────────────────────────────────────────────────────

/**
 * Creates a plain Vasana definition object (before it is persisted).
 *
 * Firestore shape – /vasanas/{id}
 * {
 *   id:         string        Firestore document ID (set after write)
 *   text:       string        Description of the tendency
 *   type:       "nourishing" | "limiting" | "neutral"
 *   createdAt:  Timestamp     Server timestamp
 *   isArchived: boolean       true once the vasana is considered eliminated
 *   archivedAt: Timestamp | null
 * }
 *
 * @param {object} params
 * @param {string} params.text
 * @param {string} params.type
 * @returns {Omit<Vasana, "id" | "createdAt" | "archivedAt">}
 */
export function createVasana({ text, type }) {
  return {
    text,
    type,
    isArchived: false,
  };
}

/**
 * Creates a plain Entry object (before it is persisted).
 *
 * Firestore shape – /entries/{id}
 * {
 *   id:          string   Firestore document ID (set after write)
 *   vasanaId:    string   Reference to /vasanas/{id}
 *   vasanaText:  string   Denormalised – avoids extra reads in stat queries
 *   vasanaType:  string   Denormalised
 *   date:        string   "YYYY-MM-DD" – enables simple range queries
 *   count:       number   Times the vasana arose on this date
 *   createdAt:   Timestamp
 *   updatedAt:   Timestamp
 * }
 *
 * @param {object} params
 * @param {string} params.vasanaId
 * @param {string} params.vasanaText
 * @param {string} params.vasanaType
 * @param {string} params.date        "YYYY-MM-DD"
 * @param {number} [params.count]     Defaults to 1
 * @returns {Omit<Entry, "id" | "createdAt" | "updatedAt">}
 */
export function createEntry({ vasanaId, vasanaText, vasanaType, date, count = 1 }) {
  return {
    vasanaId,
    vasanaText,
    vasanaType,
    date,
    count,
  };
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Returns today's date as a "YYYY-MM-DD" string (local time).
 * @returns {string}
 */
export function getTodayStr() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

/**
 * Returns yesterday's date as a "YYYY-MM-DD" string (local time).
 * @returns {string}
 */
export function getYesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

/**
 * Returns the first day of the current month as "YYYY-MM-DD".
 * @returns {string}
 */
export function getMonthStartStr() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    "01",
  ].join("-");
}

/**
 * Returns the "YYYY-MM-DD" string for N days ago (local time).
 * @param {number} n
 * @returns {string}
 */
export function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

// ─── UI-only display metadata (not persisted) ─────────────────────────────────

export const TYPE_META = {
  [NOURISHING]: {
    label:          "Nourishing",
    dotClass:       "bg-moss",
    btnClass:       "border border-moss/40 bg-moss/20 text-moss",
    pillClass:      "bg-moss/20 text-moss",
    countTextClass: "text-moss",
    cardBg:         "rgba(114,168,116,0.07)",
    cardBorderClass:"border-moss/20",
  },
  [LIMITING]: {
    label:          "Limiting",
    dotClass:       "bg-ember",
    btnClass:       "border border-ember/40 bg-ember/20 text-ember",
    pillClass:      "bg-ember/20 text-ember",
    countTextClass: "text-ember",
    cardBg:         "rgba(201,122,85,0.07)",
    cardBorderClass:"border-ember/20",
  },
  [NEUTRAL]: {
    label:          "Neutral",
    dotClass:       "bg-clay",
    btnClass:       "border border-clay/40 bg-clay/20 text-clay",
    pillClass:      "bg-clay/20 text-clay",
    countTextClass: "text-clay",
    cardBg:         "rgba(122,112,104,0.07)",
    cardBorderClass:"border-clay/20",
  },
};
