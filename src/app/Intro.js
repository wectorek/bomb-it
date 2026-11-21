"use client";

import { useEffect, useRef } from "react";
import styles from "./Intro.module.css";
import { createIntroAudio } from "./introSound";

const BEES = [
  { color: "blue", className: styles.beeBlue },
  { color: "red", className: styles.beeRed },
  { color: "green", className: styles.beeGreen },
  { color: "purple", className: styles.beePurple },
];

export default function Intro({ onPlay }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = createIntroAudio();
    audioRef.current = audio;
    if (!audio) {
      return undefined;
    }
    // Przeglądarki blokują dźwięk bez gestu, więc startujemy od razu,
    // a przy blokadzie przy pierwszym dotknięciu strony.
    audio.start();
    const unlock = () => audio.start();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      audio.close();
      audioRef.current = null;
    };
  }, []);

  return (
    <div className={styles.intro}>
      <div className={styles.stage} aria-hidden="true">
        {BEES.map((bee) => (
          <img
            key={bee.color}
            className={`${styles.bee} ${bee.className}`}
            src={`/bees/${bee.color}/down.png`}
            alt=""
            draggable={false}
          />
        ))}
        <img className={styles.bomb} src="/objects/bomb.png" alt="" />
        <span className={styles.flash} />
        <img className={styles.boom} src="/objects/explosion-2.png" alt="" />
      </div>
      <h1 className={styles.title}>
        {"Bomb It".split("").map((letter, index) => (
          <span
            key={index}
            className={styles.letter}
            style={{ animationDelay: `${2.1 + index * 0.07}s` }}
          >
            {letter === " " ? "\u00A0" : letter}
          </span>
        ))}
      </h1>
      <p className={styles.tagline}>Bomby, pszczoły i labirynt.</p>
      <button type="button" className={styles.play} onClick={() => {
          audioRef.current?.click();
          onPlay();
        }}>
        Graj
      </button>
    </div>
  );
}
