"use client";

import { useState } from "react";
import { BookmarkCard } from "./BookmarkCard";
import type { BookmarkItem } from "./BookmarksList";
import styles from "./BookmarksList.module.css";

/** Flat compact-row list for a single content type — used by the Deep
 *  Dives / Insight Cards / Builder Logs tabs, which are already filtered
 *  to one type so (unlike the Home tab's BookmarksList) there's no
 *  grouping or preview cap to apply. */
export function BookmarkTypeList({ items: initialItems }: { items: BookmarkItem[] }) {
  const [items, setItems] = useState(initialItems);

  const handleRemoved = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <BookmarkCard key={item.id} item={item} onRemoved={handleRemoved} />
      ))}
    </div>
  );
}
