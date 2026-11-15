/**
 * Crew select structure: order, player tag and colour scheme. Names and
 * texts come from `en.crew.members`; the screen-time share is real (Mad
 * hosts ~90 % of streams, Co ~10 %), the guest slot is open.
 */
export const crewOrder = ["mad", "co", "guest"] as const;
export type CrewId = (typeof crewOrder)[number];

type Scheme = {
  /** Player tag shown on the card. */
  tag: string;
  /** Screen time share, 0–1. */
  share: number;
  /** Card when not selected. */
  idle: string;
  /** Card when selected. */
  active: string;
  /** Player-tag colour when not selected. */
  tagIdle: string;
  /** Meter fill. */
  fill: string;
};

export const crewScheme: Record<CrewId, Scheme> = {
  mad: {
    tag: "P1",
    share: 0.9,
    idle: "bg-ink-2 text-paper",
    active: "bg-bordeaux text-paper",
    tagIdle: "text-bordeaux-hi",
    fill: "bg-bordeaux-hi",
  },
  co: {
    tag: "P2",
    share: 0.1,
    idle: "bg-ink-2 text-paper",
    active: "bg-tq text-ink",
    tagIdle: "text-tq",
    fill: "bg-tq",
  },
  guest: {
    tag: "P?",
    share: 0,
    idle: "bg-transparent text-paper outline-2 -outline-offset-2 outline-dashed outline-line",
    active: "bg-paper text-ink",
    tagIdle: "text-muted",
    fill: "bg-paper",
  },
};
