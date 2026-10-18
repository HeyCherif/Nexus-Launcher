import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, FolderSimplePlus, GameController, GlobeHemisphereWest, Sparkle, Trophy, Check } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNexusStore } from "../state/useNexusStore";
import type { Locale, ThemeId } from "../types";
import { NexusLogo } from "./NexusLogo";
import { useSteamNotifications } from "../hooks/useSteamNotifications";
import { steamConsoleCopy } from "../steamConsoleCopy";
import { SetupDevicePanel } from './SetupDevicePanel';
import { setupCopy } from '../setupCopy';
import { libraryClient } from '../services/libraryClient';

interface OnboardingProps { open: boolean; onComplete: () => void; onAddFolder: () => Promise<{ folder: string; count: number } | null>; }

const steps = ["library", "personalize", "control"] as const;

export function Onboarding({ open, onComplete, onAddFolder }: OnboardingProps) {
  const { i18n, t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [importMessage, setImportMessage] = useState("");
  const [importing, setImporting] = useState(false);
  const [folder, setFolder] = useState("");
  const [libraryChoice, setLibraryChoice] = useState(false);
  const [notifyChoice,setNotifyChoice]=useState(false);
  const notifications=useSteamNotifications(open),notifyCopy=steamConsoleCopy[useNexusStore(state=>state.locale)];
  const notifyInitialized=useRef(false);
  useEffect(()=>{if(open&&notifications.status&&!notifyInitialized.current){notifyInitialized.current=true;setNotifyChoice(notifications.status.enabled||['downloading','installing'].includes(notifications.status.state));}},[open,notifications.status]);
  const frame = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const importRevision = useRef(0);
  const locale = useNexusStore((state) => state.locale);
  const theme = useNexusStore((state) => state.theme);
  const games = useNexusStore((state) => state.discoveredGames);
  const scanState = useNexusStore((state) => state.libraryScanState);
  const detectedLibrary = scanState === 'ready' && games.length > 0;
  const copy=setupCopy[locale];
  const setLocale = useNexusStore((state) => state.setLocale);
  const setTheme = useNexusStore((state) => state.setTheme);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { importRevision.current++; setImporting(false); if (open) { setStep(0); setLibraryChoice(false); setFolder(""); setImportMessage(""); } }, [open]);
  const focusStep = useCallback((node: HTMLDivElement | null) => {
    if (!node || !open) return;
    requestAnimationFrame(() => {
      if (!node.isConnected) return;
      for (const panel of frame.current?.querySelectorAll<HTMLElement>('.onboarding__layout, .onboarding__journey') || []) panel.scrollTop = 0;
      node.querySelector<HTMLHeadingElement>('h1')?.focus({ preventScroll: true });
    });
  }, [open]);
  const addFolder = async () => {
    if (importing) return;
    const revision = importRevision.current;
    setImporting(true); setImportMessage("");
    try {
      const result = await onAddFolder();
      if (mounted.current && revision === importRevision.current && result) { setFolder(result.folder); setLibraryChoice(true); setImportMessage(t("onboarding.folderReady", { count: result.count })); }
    } catch (error) { if (mounted.current && revision === importRevision.current) setImportMessage(error instanceof Error ? error.message : t("settings.addError")); }
    finally { if (mounted.current && revision === importRevision.current) setImporting(false); }
  };
  const useStores=async()=>{
    if(importing)return;
    const revision=importRevision.current;
    setImporting(true);setImportMessage('');
    const store=useNexusStore.getState();store.beginLibraryScan();
    try{
      const result=await libraryClient.scan(undefined,true);
      store.completeLibraryScan(result.games,result.root,result.roots,result.manualGames,result.scanErrors);
      if(mounted.current&&revision===importRevision.current){setLibraryChoice(true);setImportMessage(t('onboarding.autoReady',{count:result.games.length}));}
    }catch(error){const message=error instanceof Error?error.message:t('settings.addError');store.failLibraryScan(message);if(mounted.current&&revision===importRevision.current)setImportMessage(message);}
    finally{if(mounted.current&&revision===importRevision.current)setImporting(false);}
  };

  const chooseLocale = (value: Locale) => {
    setLocale(value);
    void i18n.changeLanguage(value);
    document.documentElement.lang = value;
    document.documentElement.dir = i18n.dir(value);
  };

  const next = () => {
    if (step === steps.length - 1) {
      if(notifyChoice&&!notifications.status?.enabled&&!notifications.busy)void notifications.activate();
      else if(!notifyChoice){void notifications.desktop?.cancelSteamNotificationSetup();if(notifications.status?.enabled)void notifications.disable();}
      onComplete();
    }
    else setStep((current) => current + 1);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.section className="onboarding" role="dialog" aria-modal="true" aria-label={t("onboarding.label")} initial={false} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.28 }} onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), summary')).filter(node=>node.getClientRects().length>0);
          if (!buttons.length) return;
          event.preventDefault();
          const index = buttons.indexOf(document.activeElement as HTMLElement);
          buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
        }}>
          <motion.div className="onboarding__ambient" initial={reducedMotion ? false : { opacity: 0, scale: 0.88 }} animate={{ opacity: 0.62, scale: 1 }} transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }} />
          <button className="onboarding__skip" disabled={importing} onClick={onComplete} type="button">{t("onboarding.later")}</button>
          <div className="onboarding__frame" ref={frame}>
            <header className="onboarding__brand"><NexusLogo/><span>{t('onboarding.version')}</span></header>
            <div className="onboarding__layout">
            <div className="onboarding__journey">
            <nav className="onboarding__chapters" aria-label={t('onboarding.label')}>{steps.map((item,index)=><button key={item} type="button" aria-current={step===index?'step':undefined} disabled={index>step||importing} onClick={()=>setStep(index)}><span>{String(index+1).padStart(2,'0')}</span>{copy.steps[index]}</button>)}</nav>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                className="onboarding__step"
                ref={focusStep}
                key={steps[step]}
                initial={reducedMotion ? false : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
                transition={{ duration: reducedMotion?0:.3,ease:[.22,1,.36,1] }}
              >
                {step === 0 ? (
                  <>
                    <span className="onboarding__eyebrow">{copy.steps[0]}</span>
                    <h1 tabIndex={-1}>{copy.hero}</h1>
                    <p>{copy.description}</p>
                    {detectedLibrary && !importMessage ? <div className="onboarding__detected" role="status"><Check size={20}/><span><strong>{games.length} {copy.games}</strong><small>{copy.useDetected}</small></span></div> : null}
                    <div className="onboarding__folder-actions">
                      <button className="onboarding__next" disabled={importing} onClick={() => void addFolder()} type="button"><FolderSimplePlus size={22} />{t(importing ? "onboarding.scanning" : "onboarding.chooseFolder")}</button>
                      <button className="onboarding__auto" disabled={importing} aria-pressed={libraryChoice && !folder} onClick={() => void useStores()} type="button">{t("onboarding.useStores")}</button>
                      <button className="onboarding__defer" disabled={importing} onClick={()=>setStep(1)} type="button">{copy.addLater}</button>
                    </div>
                    {folder ? <p className="onboarding__folder-path">{folder}</p> : null}
                    {importMessage ? <p className="onboarding__import-status" role="status">{importMessage}</p> : null}
                  </>
                ) : null}

                {step === 1 ? (
                  <>
                    <div className="onboarding__icon"><GlobeHemisphereWest size={34} weight="light" /></div>
                    <span className="onboarding__eyebrow">{t("onboarding.yours")}</span>
                    <h1 tabIndex={-1}>{copy.personalize}</h1>
                    <p>{copy.personalizeDesc}</p>
                    <div className="onboarding__choices">
                      <div className="choice-group" role="group" aria-label={t("onboarding.language")}>
                        <button data-selected={locale === "fr"} onClick={() => chooseLocale("fr")} type="button">Français</button>
                        <button data-selected={locale === "en"} onClick={() => chooseLocale("en")} type="button">English</button>
                      </div>
                      <div className="choice-group" role="group" aria-label={t("onboarding.theme")}>
                        {(["obsidienne", "solaris"] as ThemeId[]).map((id) => <button className="onboarding__theme" data-theme-preview={id} data-selected={theme === id} aria-pressed={theme===id} key={id} onClick={() => setTheme(id)} type="button"><span className="onboarding__theme-swatch" aria-hidden="true"/><span>{t(`system.${id}`)}</span>{theme===id&&<Check size={16}/>}</button>)}
                      </div>
                    </div>
                  </>
                ) : null}

                {step === 2 ? (
                  <>
                    <div className="onboarding__icon"><GameController size={38} weight="light" /></div>
                    <span className="onboarding__eyebrow">{t("onboarding.control")}</span>
                    <h1 tabIndex={-1}>{copy.ready}</h1>
                    <p>{copy.readyDesc}</p>
                    <div className="onboarding__summary"><div><Check size={18}/><span>{games.length ? `${games.length} ${copy.games}` : copy.emptyLibrary}</span></div><div><GlobeHemisphereWest size={18}/><span>{locale==='fr'?'Français':'English'}</span></div><div><Sparkle size={18}/><span>{t(`system.${theme}`)}</span></div></div>
                    {notifications.desktop?.activateSteamNotifications&&<button className="onboarding-notification-choice" type="button" role="checkbox" aria-checked={notifyChoice} onClick={()=>setNotifyChoice(value=>!value)}><Trophy size={27} weight="duotone"/><span><strong>{notifyCopy.onboarding}</strong><small>{notifications.busy?notifyCopy.downloading+' '+(notifications.status?.progress||0)+'%':notifyCopy.onboardingHint}</small></span><i>{notifyChoice&&<Check size={17} weight="bold"/>}</i></button>}
                    <div className="control-demo" aria-hidden="true"><kbd>↑</kbd><span><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd></span><i /><kbd className="control-demo__confirm">A</kbd></div>
                  </>
                ) : null}
              </motion.div>
            </AnimatePresence>
            </div>
            <SetupDevicePanel open={open} locale={locale}/>
            </div>

            <footer className="onboarding__footer">
              <button className="screen-tool onboarding__back" disabled={step===0||importing} type="button" onClick={()=>setStep(current=>current-1)}><ArrowLeft size={18}/>{copy.back}</button>
              <div className="onboarding__progress" aria-label={t("onboarding.step", { current: step + 1, total: steps.length })}>{steps.map((item, index) => <span data-active={index <= step} key={item} />)}</div>
              <button className="onboarding__next" disabled={importing || (step === 0 && !libraryChoice && !detectedLibrary)} onClick={next} type="button"><span>{step === steps.length - 1 ? t("onboarding.enter") : t("onboarding.continue")}</span><Sparkle size={18} weight="fill" /></button>
            </footer>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
