import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import type { CSSProperties } from "react";
import type { Game } from "../types";
import { sfx } from "../audio/sfx";
import { useNexusStore } from "../state/useNexusStore";
import { getGameAccent } from "../theme/gameAccents";

type AwakeningStyle = CSSProperties & {
  "--startup-accent": string;
};

type StartupSnapshot = { games: Game[]; selectedGameId: string };

export function StartupSequence({ onComplete }: { onComplete: () => void }) {
  const reducedMotion = useReducedMotion();
  const locale = useNexusStore((state) => state.locale);
  const games = useNexusStore((state) => state.discoveredGames);
  const selectedGameId = useNexusStore((state) => state.selectedGameId);
  const libraryScanState = useNexusStore((state) => state.libraryScanState);
  const skipButton = useRef<HTMLButtonElement>(null);
  const finished = useRef(false);
  const { t } = useTranslation();
  const poster = `/assets/startup/nexus-startup-${locale}-v1-poster.jpg`;
  const [snapshot, setSnapshot] = useState<StartupSnapshot | null>(() =>
    libraryScanState === "ready" || libraryScanState === "error" ? { games, selectedGameId } : null
  );
  useEffect(() => {
    if (snapshot || (libraryScanState !== "ready" && libraryScanState !== "error")) return;
    setSnapshot({ games, selectedGameId });
  }, [games, libraryScanState, selectedGameId, snapshot]);
  const selectedWorld = snapshot?.games.find((game) => game.id === snapshot.selectedGameId) ?? snapshot?.games[0];
  const accent = getGameAccent(selectedWorld?.id ?? "nexus");
  const readyToPlay = Boolean(reducedMotion || snapshot);

  useEffect(() => {
    const origin = document.activeElement;
    skipButton.current?.focus();
    return () => {
      if (origin instanceof HTMLElement && origin.isConnected && origin.matches("button, a[href], input, [tabindex]") && !origin.closest("[inert]")) origin.focus();
    };
  }, []);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (!readyToPlay) return;
    const timer = window.setTimeout(finish, reducedMotion ? 900 : 5_600);
    return () => window.clearTimeout(timer);
  }, [finish, readyToPlay, reducedMotion]);

  useEffect(() => {
    if (readyToPlay && !reducedMotion && "AudioContext" in window) sfx.play("startup");
  }, [readyToPlay, reducedMotion]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!["Enter", "Escape", " "].includes(event.key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      finish();
    };
    let previousPressed = true;
    const timer = window.setInterval(() => {
      const pressed = Array.from(navigator.getGamepads?.() ?? []).some((pad) => pad?.buttons[0]?.pressed || pad?.buttons[1]?.pressed);
      if (pressed && !previousPressed) finish();
      previousPressed = pressed;
    }, 100);
    window.addEventListener("keydown", key, true);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("keydown", key, true);
    };
  }, [finish]);

  const style = { "--startup-accent": accent } as AwakeningStyle;

  return (
    <motion.div
      className="startup-sequence startup-awakening"
      data-mode={reducedMotion ? "still" : "awakening"}
      initial={false}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : .42 }}
      style={style}
      data-state={readyToPlay ? "playing" : "waiting"}
      role="dialog"
      aria-modal="true"
      aria-label={t("onboarding.label")}
    >
      {reducedMotion ? (
        <img className="startup-sequence__film" src={poster} alt="Nexus Launcher" />
      ) : !snapshot ? (
        <div className="startup-awakening__standby" aria-hidden="true"><i /><i /><i /></div>
      ) : (
        <div
          className="startup-awakening__stage"
          data-signature="nexus-portal"
          data-portal-game-id={selectedWorld?.id ?? "nexus"}
          aria-hidden="true"
        >
          <svg className="startup-awakening__portal" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
            <defs>
              <mask id="nexus-portal-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">
                <rect width="1000" height="1000" fill="white" />
                <g className="startup-awakening__portal-cutout" fill="none" stroke="black" strokeWidth="42" strokeLinecap="round" strokeLinejoin="round">
                  <path data-nexus-stroke pathLength="1" d="M360 680V320" />
                  <path data-nexus-stroke pathLength="1" d="M360 320L640 680" />
                  <path data-nexus-stroke pathLength="1" d="M640 680V320" />
                </g>
              </mask>
              <linearGradient id="nexus-portal-light" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--startup-accent)" stopOpacity=".3" />
                <stop offset=".48" stopColor="#f5fbff" />
                <stop offset="1" stopColor="var(--startup-accent)" stopOpacity=".55" />
              </linearGradient>
            </defs>
            <rect className="startup-awakening__veil" width="1000" height="1000" fill="#010306" mask="url(#nexus-portal-mask)" />
            <g className="startup-awakening__trace" fill="none" stroke="url(#nexus-portal-light)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <path pathLength="1" d="M360 680V320" />
              <path pathLength="1" d="M360 320L640 680" />
              <path pathLength="1" d="M640 680V320" />
            </g>
          </svg>
          <div className="startup-awakening__pulse" />
          <div className="startup-awakening__core">
            <strong>NEXUS</strong>
            <small>{locale === "fr" ? "VOTRE MONDE. CONNECTÉ." : "YOUR WORLD. CONNECTED."}</small>
          </div>
          <div className="startup-awakening__grain" />
        </div>
      )}
      <button ref={skipButton} className="startup-sequence__skip" type="button" onClick={finish}>{t("onboarding.skip")} <kbd>↵</kbd></button>
    </motion.div>
  );
}
