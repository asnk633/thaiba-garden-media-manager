export type UiStatus = "Pending" | "Working On" | "On Hold" | "Completed";
export type ApiStatus = "pending" | "working" | "on_hold" | "completed";

export const uiFromApiStatus = (s?: ApiStatus): UiStatus =>
  s === "working" ? "Working On" : s === "completed" ? "Completed" : s === "on_hold" ? "On Hold" : "Pending";

export const apiFromUiStatus = (u: UiStatus): ApiStatus =>
  u === "Working On" ? "working" : u === "On Hold" ? "on_hold" : u === "Completed" ? "completed" : "pending";
