import * as Dialog from "@radix-ui/react-dialog";
import { accountsCopy } from "../accountsCopy";
import { SteamPlaytime } from "../components/SteamPlaytime";
import { GameActivity } from '../components/GameActivity';
import { GameSaves } from '../components/GameSaves';
import { X, SlidersHorizontal, Link, ArrowLeft, CheckCircle, Clock, FilmSlate, GameController, HardDrives, Play, Star, Trophy } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { NexusButton } from "../components/NexusButton";
import { TrailerDialog } from "../components/TrailerDialog";
import { ScreenshotGallery } from "../components/ScreenshotGallery";
import { SteamAchievements } from "../components/SteamAchievements";
import { useLibraryGames } from "../hooks/useLibraryGames";
import { useNexusStore } from "../state/useNexusStore";
import { applyImageFallback } from "../utils/imageFallback";
import { libraryClient } from "../services/libraryClient";
import { setupCopy } from '../setupCopy';

type DetailTab = "overview" | "media" | "achievements";

interface GameDetailScreenProps { onLaunch: () => void; }

export function GameDetailScreen({ onLaunch }: GameDetailScreenProps) {
  const { t } = useTranslation();
  const { gameId } = useParams();
  const games = useLibraryGames();
  const navigate = useNavigate();
  const location = useLocation();
  const locale = useNexusStore((state) => state.locale);
  const copy=setupCopy[locale], reducedMotion=useReducedMotion(),tabs=useRef<HTMLElement>(null);
  const setSelectedGame = useNexusStore((state) => state.setSelectedGame);
  const completeLibraryScan = useNexusStore((state) => state.completeLibraryScan);
  const libraryScanState = useNexusStore((state) => state.libraryScanState);
  const game = games.find((item) => item.id === gameId) ?? games.find((item) => item.legacyId === gameId);
  const [tab, setTab] = useState<DetailTab>("overview");
  const [trailerOpen, setTrailerOpen] = useState(false);
  const customizeTrigger = useRef<HTMLButtonElement>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const updateGame = async (action: () => ReturnType<typeof libraryClient.scan>) => {
    try {
      const result = await action();
      completeLibraryScan(result.games, result.root, result.roots, result.manualGames, result.scanErrors);
      setEditMessage("detail.updateSuccess");
    } catch (error) { setEditMessage(error instanceof Error ? error.message : "detail.updateError"); }
  };

  useEffect(() => { if (game) setSelectedGame(game.id); }, [game, setSelectedGame]);
  useEffect(()=>{setTab('overview');setTrailerOpen(false);setCustomizeOpen(false);setEditTitle('');setEditMessage('');},[gameId]);
  if (!game && (libraryScanState === "idle" || libraryScanState === "scanning")) return <div className="route-loading"><span />{t("detail.loading")}</div>;
  if (!game) return <Navigate to="/library" replace />;

  return (
    <section className="game-detail-screen game-detail-visual" aria-labelledby="game-detail-title">
      <button className="game-detail__back" onClick={() => location.key === "default" ? navigate("/library", { replace: true }) : navigate(-1)} type="button"><ArrowLeft size={20} />{t("detail.back")}</button>
      <div className="game-detail__hero">
        <div className="game-detail__cover"><img src={game.artwork} alt="" decoding="async" onError={event=>applyImageFallback(event,[...(game.artworkFallbacks||[]),game.heroArtwork])}/></div>
        <span className="screen-kicker">{game.source} · {game.genre[locale]}</span>
        {game.logoArtwork ? <img className="game-detail__logo" src={game.logoArtwork} alt="" onError={(event) => applyImageFallback(event, [...(game.heroArtworkFallbacks || []), game.artwork])} /> : null}
        <h1 className={game.logoArtwork ? "game-detail__title game-detail__title--with-logo" : "game-detail__title"} id="game-detail-title">{game.title}</h1>
        <span className="game-detail__availability" data-ready={game.installed}><i />{t(game.installed ? "detail.ready" : "detail.installRequired")}</span>

        <div className="game-detail__tags">{game.features.map((feature) => <span key={feature.fr}><CheckCircle size={15} weight="fill" />{feature[locale]}</span>)}</div>
        <div className="game-detail__actions">
          <NexusButton data-sfx={game.installed ? "launch" : undefined} onClick={game.installed ? onLaunch : () => navigate("/settings?section=play")} icon={game.installed ? <Play size={18} weight="fill" /> : <GameController size={18} />}>{t(game.installed ? "action.play" : "action.configure")}</NexusButton>
          {game.trailer.url ? <NexusButton variant="ghost" onClick={() => setTrailerOpen(true)} icon={<FilmSlate size={20} />}>{t("detail.trailer")}</NexusButton> : null}
        </div>
        <div className="game-detail__utilities">{game.discovered?<><button className="screen-tool" type="button" ref={customizeTrigger} onClick={()=>setCustomizeOpen(true)}><SlidersHorizontal size={16}/>{accountsCopy[locale].customize}</button><GameSaves key={game.id} gameId={game.id} title={game.title} locale={locale}/></>:null}<button className="screen-tool" type="button" onClick={()=>navigate("/settings?section=accounts")}><Link size={16}/>{accountsCopy[locale].settings}</button></div>
      </div>

      <div className="game-detail__facts" aria-label={t("detail.quickInfo")}>
        <SteamPlaytime appId={game.steamAppId} locale={locale}/>
        {game.discovered || game.playtimeHours > 0 ? <div><Clock size={22} /><span><small>{t(game.discovered ? "detail.nexusPlaytime" : "detail.playtime")}</small><strong>{game.discovered ? t("detail.playtimeValue", { hours: Math.floor(game.playtimeHours), minutes: Math.floor((game.playtimeHours * 60) % 60) }) : `${game.playtimeHours.toLocaleString(locale)} h`}</strong></span></div> : null}
        {game.achievementProgress.total > 0 ? <div><Trophy size={22} /><span><small>{t("detail.achievements")}</small><strong>{game.achievementProgress.unlocked}/{game.achievementProgress.total}</strong><progress aria-label={t('detail.achievements')} max={game.achievementProgress.total} value={game.achievementProgress.unlocked}/></span></div> : null}
        {game.rating > 0 ? <div><Star size={22} /><span><small>{t("detail.community")}</small><strong>{game.rating}/100</strong></span></div> : null}
        {game.lastPlayedAt?<div><Clock size={22} /><span><small>{t('detail.lastPlayed')}</small><strong>{game.lastPlayed[locale]}</strong></span></div>:null}
      </div>

      <nav className="game-detail__tabs" ref={tabs} role="tablist" aria-label={t("detail.tabs")} onKeyDown={event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();event.stopPropagation();
        const buttons=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role=tab]'));
        const index=buttons.indexOf(document.activeElement as HTMLButtonElement),current=index<0?buttons.findIndex(button=>button.dataset.active==='true'):index;
        const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(current+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
        buttons[next]?.click();buttons[next]?.focus();
      }}>
        <button role="tab" id="detail-tab-overview" aria-controls="detail-panel-overview" aria-selected={tab==='overview'} tabIndex={tab==='overview'?0:-1} data-active={tab === "overview"} onClick={() => setTab("overview")} type="button">{t("detail.overview")}</button>
        {game.trailer.url || game.screenshots?.length ? <button role="tab" id="detail-tab-media" aria-controls="detail-panel-media" aria-selected={tab==='media'} tabIndex={tab==='media'?0:-1} data-active={tab === "media"} onClick={() => setTab("media")} type="button">{t("detail.media")}</button> : null}
        <button role="tab" id="detail-tab-achievements" aria-controls="detail-panel-achievements" aria-selected={tab==='achievements'} tabIndex={tab==='achievements'?0:-1} data-active={tab === "achievements"} onClick={() => setTab("achievements")} type="button">{t("detail.achievementsTab")}</button>
      </nav>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div className="game-detail__panel" role="tabpanel" id={`detail-panel-${tab}`} aria-labelledby={`detail-tab-${tab}`} tabIndex={0} key={tab} initial={reducedMotion?false:{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion?0:-3 }} transition={{ duration: reducedMotion?0:.18 }}>
          {tab === "overview" ? <>
            {game.discovered?<GameActivity gameId={game.id} locale={locale}/>:null}
            <div className="game-detail__summary"><span className="screen-kicker">{t("detail.about")}</span><p>{game.description[locale]}</p></div>
            <dl className="game-detail__specs"><div><dt>{t("detail.developer")}</dt><dd>{game.developer}</dd></div><div><dt>{t("detail.publisher")}</dt><dd>{game.publisher}</dd></div><div><dt>{t("detail.release")}</dt><dd>{game.releaseDate}</dd></div>{game.ageRating !== "Non renseigné" ? <div><dt>{t("detail.rating")}</dt><dd>{game.ageRating}</dd></div> : null}</dl>
            <div className="game-detail__technical">{game.metadataProvider?<span>{t('detail.metadata')} · {game.metadataProvider}</span>:null}{game.executablePath?<span>{t('detail.executable')} · {game.executablePath.split(/[\\/]/).pop()}</span>:null}</div>
            {game.screenshots?.length?<section className="game-detail__moments" aria-label={copy.media}><header><span className="screen-kicker">{copy.media}</span><button className="screen-tool" type="button" onClick={()=>{setTab('media');tabs.current?.querySelector<HTMLButtonElement>('#detail-tab-media')?.focus();}}>{copy.allMedia}</button></header><ScreenshotGallery images={game.screenshots.slice(0,3)} title={game.title}/></section>:null}
          </> : null}
          {tab === "media" ? <div className="game-media-panel">{game.trailer.url ? <button className="game-detail__media" onClick={() => setTrailerOpen(true)} type="button"><img src={game.artwork} alt="" onError={(event) => applyImageFallback(event, [...(game.artworkFallbacks || []), game.heroArtwork])} /><span><Play size={26} weight="fill" /><strong>{game.trailer.title[locale]}</strong><small>{game.trailers?.length || 1} · {t('trailer.label')}</small></span></button> : null}{game.screenshots?.length ? <ScreenshotGallery images={game.screenshots} title={game.title} /> : null}</div> : null}
          {tab === "achievements" ? <SteamAchievements appId={game.steamAppId} locale={locale} /> : null}
        </motion.div>
      </AnimatePresence>
      <div className="game-detail__source"><GameController size={18} /><span>{t("detail.source", { source: game.source })}</span><HardDrives size={18} /><span>{game.libraryPath}</span></div>
      {game.discovered ? <Dialog.Root open={customizeOpen} onOpenChange={setCustomizeOpen}><Dialog.Portal><Dialog.Overlay className="trailer-overlay"/><Dialog.Content className="account-dialog game-customize-dialog" aria-describedby={undefined} onCloseAutoFocus={event=>{event.preventDefault();customizeTrigger.current?.focus();}}><Dialog.Title>{accountsCopy[locale].customize} · {game.title}</Dialog.Title><Dialog.Close className="trailer-dialog__close" aria-label={t("action.close")}><X size={22}/></Dialog.Close><div className="game-detail__customize"><span className="screen-kicker">{t("detail.customize")}</span><label>{t("detail.gameTitle")} <input aria-label={t("detail.gameTitle")} onChange={(event) => setEditTitle(event.target.value)} placeholder={game.title} value={editTitle} /></label><button className="screen-tool" disabled={!editTitle.trim()} onClick={() => void updateGame(() => libraryClient.setTitle(game.id, editTitle))} type="button">{t("detail.saveTitle")}</button>{window.nexusDesktop ? <><button className="screen-tool" onClick={() => void updateGame(async () => (await libraryClient.chooseExecutable(game.id)) ?? libraryClient.scan())} type="button">{t("detail.chooseExecutable")}</button><button className="screen-tool" onClick={() => void updateGame(async () => (await libraryClient.chooseArtwork(game.id, "gridArtwork")) ?? libraryClient.scan())} type="button">{t("detail.chooseCover")}</button><button className="screen-tool" onClick={() => void updateGame(async () => (await libraryClient.chooseArtwork(game.id, "heroArtwork")) ?? libraryClient.scan())} type="button">{t("detail.chooseBackground")}</button><button className="screen-tool" onClick={() => void updateGame(async () => (await libraryClient.chooseArtwork(game.id, "logoArtwork")) ?? libraryClient.scan())} type="button">{t("detail.chooseLogo")}</button></> : null}{editMessage ? <span role="status">{editMessage.startsWith("detail.") ? t(editMessage) : editMessage}</span> : null}</div></Dialog.Content></Dialog.Portal></Dialog.Root> : null}
      <TrailerDialog game={game} locale={locale} open={trailerOpen} onOpenChange={setTrailerOpen} />
    </section>
  );
}
