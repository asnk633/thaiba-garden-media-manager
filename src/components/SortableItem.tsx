// src/components/SortableItem.tsx
"use client";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SortableItem({ id, children, columnId }: { id: string; children: React.ReactNode; columnId?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
  } as React.CSSProperties;

  // expose column id for drag metadata
  const dataAttr = { "data-column-id": columnId };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} data-column-id={columnId}>
      {children}
    </div>
  );
}
