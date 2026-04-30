"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

function Digit({ digit }: { digit: string }) {
  const isNumber = !isNaN(parseInt(digit));

  if (!isNumber) return <span className="tabular-nums">{digit}</span>;

  return (
    <span className="relative inline-block h-[1em] w-[0.6em] overflow-hidden tabular-nums leading-none">
      <motion.span
        initial={{ y: "0%" }}
        animate={{ y: `-${parseInt(digit) * 10}%` }}
        transition={{ type: "spring", stiffness: 80, damping: 20, mass: 1, delay: Math.random() * 0.2 }}
        className="absolute top-0 left-0 w-full flex flex-col"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="h-[1em] flex items-center justify-center shrink-0">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export default function SlotCounter({ value }: { value: string | number }) {
  const str = String(value);
  const digits = useMemo(() => str.split(""), [str]);

  return (
    <span key={str} className="inline-flex items-baseline">
      {digits.map((d, i) => (
        <Digit key={`${i}-${d}`} digit={d} />
      ))}
    </span>
  );
}
