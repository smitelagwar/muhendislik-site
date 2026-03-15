"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useToast } from "@/components/toast-provider";

interface LikeButtonProps {
  slug: string;
  className?: string;
}

export function LikeButton({ slug, className = "" }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [count, setCount] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("likes");
    const likes: Record<string, boolean> = saved ? JSON.parse(saved) : {};
    const hash = slug.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const initialCount = (hash % 40) + 5 + (likes[slug] ? 1 : 0);

    queueMicrotask(() => {
      setIsLiked(Boolean(likes[slug]));
      setCount(initialCount);
    });
  }, [slug]);

  const toggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const likes: Record<string, boolean> = JSON.parse(localStorage.getItem("likes") || "{}");

    if (likes[slug]) {
      delete likes[slug];
      setCount((current) => current - 1);
      showToast("Beğeni kaldırıldı.", "like");
    } else {
      likes[slug] = true;
      setCount((current) => current + 1);
      showToast("İçerik beğenildi.", "like");
    }

    localStorage.setItem("likes", JSON.stringify(likes));
    setIsLiked(Boolean(likes[slug]));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center gap-1 rounded-lg p-1.5 transition-all duration-200 hover:scale-110 active:scale-95 ${
        isLiked
          ? "bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400"
          : "bg-zinc-100 text-zinc-400 hover:text-pink-500 dark:bg-zinc-800 dark:hover:text-pink-400"
      } ${className}`}
      aria-label={isLiked ? "Beğeniyi kaldır" : "Beğen"}
      title={isLiked ? "Beğeniyi kaldır" : "Beğen"}
    >
      <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
      <span className="text-xs font-medium">{count}</span>
    </button>
  );
}
