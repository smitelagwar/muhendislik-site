"use client";

import { useEffect, useState } from "react";

interface TypingEffectProps {
  words: string[];
  className?: string;
  cursorClassName?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

export function TypingEffect({
  words,
  className = "",
  cursorClassName = "bg-teal-500",
  typingSpeed = 80,
  deletingSpeed = 45,
  pauseDuration = 1800,
}: TypingEffectProps) {
  const [displayText, setDisplayText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (words.length === 0) {
      return;
    }

    const currentWord = words[wordIndex % words.length];

    if (isPaused) {
      const timer = window.setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);

      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(
      () => {
        if (!isDeleting) {
          const nextText = currentWord.substring(0, displayText.length + 1);
          setDisplayText(nextText);

          if (nextText === currentWord) {
            setIsPaused(true);
          }
        } else {
          const nextText = currentWord.substring(0, displayText.length - 1);
          setDisplayText(nextText);

          if (nextText === "") {
            setIsDeleting(false);
            setWordIndex((previous) => (previous + 1) % words.length);
          }
        }
      },
      isDeleting ? deletingSpeed : typingSpeed,
    );

    return () => window.clearTimeout(timer);
  }, [deletingSpeed, displayText, isDeleting, isPaused, pauseDuration, typingSpeed, wordIndex, words]);

  return (
    <span className={className}>
      {displayText}
      <span className={`ml-0.5 inline-block h-[1em] w-0.5 animate-pulse align-middle ${cursorClassName}`} />
    </span>
  );
}
