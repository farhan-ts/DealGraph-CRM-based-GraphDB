import type { DealStatus, Domain, Stage } from "../api/types";

export const DOMAINS: Domain[] = ["AI", "Cybersecurity", "IoT", "DevOps", "Cloud Migration"];
export const STAGES: Stage[] = ["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION"];

/** Fixed domain colours, used everywhere (chips, charts, graph). Mirrors --color-d-* in index.css. */
export const DOMAIN_COLOR: Record<Domain, string> = {
  AI: "#6a55c9",
  Cybersecurity: "#c0462b",
  IoT: "#10857a",
  DevOps: "#b07a14",
  "Cloud Migration": "#3577b8",
};

/** Stage shades: one hue, darker as the deal progresses. */
export const STAGE_COLOR: Record<Stage, string> = {
  LEAD: "#c9d3e1",
  QUALIFIED: "#93a8c6",
  PROPOSAL: "#5c7aa6",
  NEGOTIATION: "#2c4a78",
};

export const STATUS_COLOR: Record<DealStatus, string> = {
  OPEN: "#44607f",
  WON: "#2f7d4f",
  LOST: "#b42318",
};

export const STAGE_LABEL: Record<Stage, string> = {
  LEAD: "Lead",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
};

export const ACCENT = "#1f4f99";
export const INK_MUTED = "#5b6474";
export const LINE = "#e3e6eb";
