// src/lib/dragUtils.ts
export const STATUS_COLUMN_IDS = ["todo", "inprogress", "review", "done"];

export function mapStatusToColumnId(status: string) {
  switch (status) {
    case "pending":
    case "todo":
      return "todo";
    case "in_progress":
    case "inprogress":
      return "inprogress";
    case "review":
      return "review";
    case "done":
    case "completed":
      return "done";
    default:
      return "todo";
  }
}

