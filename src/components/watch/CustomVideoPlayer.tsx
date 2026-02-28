import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import HlsLib from 'hls.js';
import { BackendApiResponse, BackendSource, BackendSubtitle } from '../../api/player-types';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  List,
  Settings2,
  Subtitles,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Monitor,
  Check,
  Eye
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';

const Hls = HlsLib;

interface VideoPlayerProps {
  id?: number;
  apiResponse: BackendApiResponse;
  onEpisodeNext?: () => void;
  onEpisodePrevious?: () => void;
  currentEpisodeInfo?: { season: number; episode: number; total: number };
  isMovie?: boolean;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  showTitle?: string;
  seasons?: any[];
  onEpisodeSelect?: (season: number, episode: number) => void;
  isFirstEpisode?: boolean;
  isLastEpisode?: boolean;
  onBack?: () => void;
  onTogglePlayer?: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
}

const formatQuality = (quality: string): string => {
  if (!quality) return 'Auto';
  const lower = quality.toLowerCase();

  if (lower === 'unknown' || lower === '') return 'SD';
  if (lower.includes('up to hd') || lower === 'hd' || (lower.includes('hd') && !lower.match(/\d/))) return 'HD';

  const cleanQuality = lower.replace(/[^0-9]/g, '');

  if (cleanQuality.includes('2160') || lower.includes('4k')) return '4K';
  if (cleanQuality.includes('1440') || lower.includes('2k')) return '2K';
  if (cleanQuality.includes('1080')) return '1080p';
  if (cleanQuality.includes('720')) return '720p';
  if (cleanQuality.includes('480')) return '480p';
  if (cleanQuality.includes('360')) return '360p';

  if (cleanQuality) return `${cleanQuality}p`;

  return 'SD';
};

const QualitySelector = ({
  sources,
  currentSource,
  onSelect
}: {
  sources: BackendSource[],
  currentSource: BackendSource | null,
  onSelect: (src: BackendSource) => void
}) => {
  const groupedSources = useMemo(() => {
    const groups: Record<string, BackendSource[]> = {};
    sources.forEach(src => {
      const q = formatQuality(src.quality);
      if (!groups[q]) groups[q] = [];
      groups[q].push(src);
    });

    // Custom sorting order as requested: HD, 1080p, and then descending quality
    const sortOrder = ['HD', '1080p', '4K', '2K', '720p', '480p', '360p', 'SD'];

    return Object.keys(groups)
      .sort((a, b) => {
        const indexA = sortOrder.indexOf(a);
        const indexB = sortOrder.indexOf(b);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        // Default to numeric comparison for unknown qualities
        const valA = parseInt(a) || 0;
        const valB = parseInt(b) || 0;
        return valB - valA;
      })
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {} as Record<string, BackendSource[]>);
  }, [sources]);

  return (
    <div className="w-72 max-h-80 overflow-y-auto custom-scrollbar bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
      <div className="px-2 py-2 mb-2 text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Available Qualities</div>
      <div className="space-y-3">
        {Object.entries(groupedSources).map(([quality, items]) => (
          <div key={quality} className="space-y-1.5 p-1 bg-white/[0.03] rounded-xl border border-white/5">
            <div className="px-3 py-1 text-xs font-bold text-white/40 flex items-center justify-between">
              <span>{quality}</span>
              <span className="text-[10px] opacity-50">{items.length} {items.length > 1 ? 'Sources' : 'Source'}</span>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {items.map((src, i) => (
                <button
                  key={`${quality}-${i}`}
                  onClick={() => onSelect(src)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-all group relative overflow-hidden",
                    currentSource?.url === src.url
                      ? "bg-accent text-white font-bold shadow-lg shadow-accent/20"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <span className="opacity-40 font-mono">#{i + 1}</span>
                    <span className="uppercase text-[10px] tracking-widest">{src.type}</span>
                  </div>
                  <div className="flex items-center gap-2 relative z-10">
                    {currentSource?.url === src.url && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SubtitleSelector = ({
  subtitles,
  currentSubtitle,
  onSelect
}: {
  subtitles: BackendSubtitle[],
  currentSubtitle: BackendSubtitle | null,
  onSelect: (sub: BackendSubtitle | null) => void
}) => (
  <div className="w-56 max-h-72 overflow-y-auto custom-scrollbar bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-2xl">
    <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-white/40 font-bold">Subtitles</div>
    <div className="space-y-1">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-all",
          currentSubtitle === null 
            ? "bg-accent/20 text-accent font-semibold" 
            : "text-white/70 hover:bg-white/5 hover:text-white"
        )}
      >
        <span>Off</span>
        {currentSubtitle === null && <Check className="w-4 h-4" />}
      </button>
      {subtitles.map((sub, i) => (
        <button
          key={i}
          onClick={() => onSelect(sub)}
          className={cn(
            "w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-all",
            currentSubtitle?.url === sub.url 
              ? "bg-accent/20 text-accent font-semibold" 
              : "text-white/70 hover:bg-white/5 hover:text-white"
          )}
        >
          <span>{sub.label}</span>
          {currentSubtitle?.url === sub.url && <Check className="w-4 h-4" />}
        </button>
      ))}
    </div>
  </div>
);

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  id,
  apiResponse,
  isMovie,
  seasonNumber,
  episodeNumber,
  episodeTitle,
  showTitle,
  seasons,
  onEpisodeSelect,
  isFirstEpisode,
  isLastEpisode,
  onBack,
  onTogglePlayer,
  onEpisodeNext,
  onEpisodePrevious,
  onProgress
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const { watchHistory } = useStore();
  const initialSource = useMemo(() => {
    const sHD = apiResponse.sources.find(s => formatQuality(s.quality) === 'HD');
    if (sHD) return sHD;
    const s1080 = apiResponse.sources.find(s => formatQuality(s.quality) === '1080p');
    return s1080 || apiResponse.sources[0] || null;
  }, [apiResponse.sources]);

  const [currentSource, setCurrentSource] = useState<BackendSource | null>(initialSource);
  const [triedSources, setTriedSources] = useState<Set<string>>(new Set());
  const [currentSubtitle, setCurrentSubtitle] = useState<BackendSubtitle | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showQuality, setShowQuality] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [showEpisodeSelector, setShowEpisodeSelector] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(seasonNumber || 1);

  useEffect(() => {
    setSelectedSeason(seasonNumber || 1);
  }, [seasonNumber]);

  useEffect(() => {
    if (!videoRef.current || !currentSource) return;

    const video = videoRef.current;
    setIsLoading(true);
    setProgress(0);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    video.src = '';

    if (currentSource.type === 'hls') {
      if (Hls.isSupported()) {
        const hls = new Hls({
          capLevelToPlayerSize: true,
          autoStartLoad: true,
          lowLatencyMode: false,
        });

        const onHlsError = (error: any) => {
          console.error('HLS Error:', error);
          setIsLoading(false);
        };

        hls.on(Hls.Events.ERROR, onHlsError);
        hls.loadSource(currentSource.url);
        hls.attachMedia(video);
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = currentSource.url;
      }
    } else {
      video.src = currentSource.url;
    }

    const handleTimeUpdate = () => {
      if (video.duration && !isNaN(video.duration)) {
        const currentProgress = (video.currentTime / video.duration) * 100;
        setProgress(currentProgress);
        onProgress?.(video.currentTime, video.duration);
      }
    };

    const handleDurationChange = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      console.error('Video Player Error');
      if (currentSource) {
        setTriedSources(prev => new Set(prev).add(currentSource.url));

        // Find next best source
        const remainingSources = apiResponse.sources.filter(s => !triedSources.has(s.url) && s.url !== currentSource.url);
        if (remainingSources.length > 0) {
          // Priority: HD, 1080p, others
          const sHD = remainingSources.find(s => formatQuality(s.quality) === 'HD');
          const s1080 = remainingSources.find(s => formatQuality(s.quality) === '1080p');
          setCurrentSource(sHD || s1080 || remainingSources[0]);
        }
      }
      setIsLoading(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [currentSource, apiResponse.sources, triedSources]);

  const togglePlay = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, []);

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current || !duration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(clickX / rect.width, 1));
    const newTime = percentage * duration;

    videoRef.current.currentTime = newTime;
    setProgress(percentage * 100);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const vol = Number(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (!showQuality && !showSubtitles && !showEpisodeSelector) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    if (showQuality || showSubtitles || showEpisodeSelector) {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  }, [showQuality, showSubtitles, showEpisodeSelector]);

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const skip = (amount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentSeasonData = seasons?.find(s => s.season_number === selectedSeason);

  return (
    <div
      className="relative w-full h-full bg-black overflow-hidden group select-none font-sans"
      onMouseMove={handleMouseMove}
      onClick={() => togglePlay()}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
        crossOrigin="anonymous"
      >
        {currentSubtitle && (
          <track
            key={`${currentSubtitle.url}-${currentSubtitle.label}`}
            kind="subtitles"
            src={currentSubtitle.url}
            label={currentSubtitle.label}
            srcLang="en"
            default
          />
        )}
      </video>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-20">
          <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Top Header */}
      {showControls && (
        <div className="absolute top-0 left-0 right-0 p-4 md:p-8 flex items-start justify-between z-40 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-95 group"
                title="Back"
              >
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              </button>
            )}

            <div className="h-8 w-[1px] bg-white/10 mx-1" />

            {showTitle && (
              <button
                onClick={(e) => {
                  if (!isMovie && seasons) {
                    e.stopPropagation();
                    setShowEpisodeSelector(!showEpisodeSelector);
                    setShowQuality(false);
                    setShowSubtitles(false);
                  }
                }}
                className={cn(
                  "flex flex-col text-left px-4 py-2 rounded-xl transition-all group/title",
                  !isMovie && seasons ? "hover:bg-white/10 cursor-pointer" : "cursor-default"
                )}
              >
                <div className="flex items-center gap-3">
                  <h1 className="text-white text-base md:text-lg font-bold tracking-tight group-hover/title:text-accent transition-colors">
                    {showTitle}
                  </h1>
                  {!isMovie && seasons && (
                    <div className={cn(
                      "p-1 rounded-md transition-all",
                      showEpisodeSelector ? "bg-accent/20 text-accent" : "bg-white/10 text-white/40 group-hover/title:bg-accent/20 group-hover/title:text-accent"
                    )}>
                      <List className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                {!isMovie && seasonNumber && episodeNumber && (
                  <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-wider mt-0.5">
                    S{seasonNumber} • E{episodeNumber} {episodeTitle && <span className="text-white/20 ml-1">· {episodeTitle}</span>}
                  </p>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
             {onTogglePlayer && (
              <button
                onClick={onTogglePlayer}
                className="px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all flex items-center gap-2.5 active:scale-95"
                title="Switch Player"
              >
                <Monitor className="w-5 h-5" />
                <span className="hidden sm:inline font-bold text-sm">Embed Mode</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modern Landscape Episode Selector */}
      {!isMovie && showEpisodeSelector && seasons && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center animate-in fade-in zoom-in duration-300" onClick={(e) => { e.stopPropagation(); setShowEpisodeSelector(false); }}>
          <div className="w-full max-w-6xl h-[85vh] bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-4">
                <List className="w-6 h-6 text-accent" />
                <h2 className="text-white font-bold text-2xl tracking-tight">Episodes</h2>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                   {seasons.map((season) => (
                    <button
                      key={season.season_number}
                      onClick={() => setSelectedSeason(season.season_number)}
                      className={cn(
                        "px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap",
                        selectedSeason === season.season_number
                          ? "bg-accent text-white shadow-lg shadow-accent/20"
                          : "text-white/40 hover:text-white/80"
                      )}
                    >
                      S{season.season_number}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowEpisodeSelector(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all active:scale-95 border border-white/5 hover:border-white/10"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentSeasonData?.episodes.map((episode: any) => {
                  const airDate = episode.air_date ? new Date(episode.air_date) : null;
                  const isUpcoming = airDate ? airDate > new Date() : false;
                  const formattedDate = airDate ? airDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: airDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                  }) : 'TBA';

                  const historyItem = watchHistory.find(h =>
                    h.id === Number(id) &&
                    h.mediaType === 'tv' &&
                    h.season === selectedSeason &&
                    h.episode === episode.episode_number
                  );

                  const watchedProgress = historyItem?.progress
                    ? (historyItem.progress.watched / historyItem.progress.duration) * 100
                    : 0;
                  const isCompleted = historyItem?.isCompleted;

                  return (
                    <button
                      key={episode.episode_number}
                      disabled={isUpcoming}
                      onClick={() => {
                        onEpisodeSelect?.(selectedSeason, episode.episode_number);
                        setShowEpisodeSelector(false);
                      }}
                      className={cn(
                        "group flex flex-col gap-3 p-3 rounded-2xl transition-all text-left border relative overflow-hidden",
                        episodeNumber === episode.episode_number && seasonNumber === selectedSeason
                          ? "bg-accent/10 border-accent/40 ring-1 ring-accent/20"
                          : "bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/10",
                        isUpcoming && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="w-full aspect-video bg-white/5 rounded-xl overflow-hidden relative flex-shrink-0 shadow-lg group-hover:scale-[1.02] transition-transform">
                        {episode.still_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500${episode.still_path}`}
                            alt={episode.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/10">
                            <Play className="w-12 h-12 fill-current" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />

                        {isUpcoming && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                            <div className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-2xl">
                              Upcoming
                            </div>
                          </div>
                        )}

                        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                          {isCompleted && (
                            <div className="px-2 py-1 bg-green-500/80 backdrop-blur-md text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              Watched
                            </div>
                          )}
                          {episode.runtime && (
                            <div className="px-2 py-1 bg-black/80 backdrop-blur-md text-white rounded-lg text-[10px] font-bold uppercase tracking-wider">
                              {episode.runtime}m
                            </div>
                          )}
                        </div>

                        {episodeNumber === episode.episode_number && seasonNumber === selectedSeason && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-accent text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-lg animate-pulse">
                            Watching
                          </div>
                        )}

                        {/* Progress Bar */}
                        {watchedProgress > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                            <div
                              className="h-full bg-accent"
                              style={{ width: `${watchedProgress}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 px-1">
                        <h3 className={cn(
                          "text-sm font-bold leading-tight line-clamp-1 mb-1",
                          episodeNumber === episode.episode_number && seasonNumber === selectedSeason
                            ? "text-accent"
                            : "text-white"
                        )}>
                          {episode.episode_number}. {episode.name}
                        </h3>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                            {formattedDate}
                          </p>
                        </div>
                        <p className="text-[11px] text-white/50 line-clamp-2 mt-2 leading-relaxed">
                          {episode.overview || "No description available for this episode."}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 md:p-6 border-t border-white/10 bg-white/5 flex items-center justify-end gap-3">
                <button
                  disabled={isFirstEpisode}
                  onClick={() => onEpisodePrevious?.()}
                  className="flex items-center justify-center gap-2 py-2.5 px-5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-white rounded-xl border border-white/10 transition-all text-sm font-bold active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  disabled={isLastEpisode}
                  onClick={() => onEpisodeNext?.()}
                  className="flex items-center justify-center gap-2 py-2.5 px-5 bg-accent hover:bg-accent/90 disabled:opacity-30 text-white rounded-xl shadow-lg shadow-accent/20 transition-all text-sm font-bold active:scale-95"
                >
                  Next Episode
                  <ChevronRight className="w-4 h-4" />
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Controls Overlay */}
      <div
        className={cn(
          "absolute inset-0 transition-all duration-500 flex flex-col justify-end p-6 md:p-10 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none z-30",
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        {/* Progress Bar Container */}
        <div
          ref={progressBarRef}
          className="w-full mb-6 group/progress relative pointer-events-auto cursor-pointer py-4"
          onClick={handleProgressBarClick}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Progress Track */}
          <div className="relative h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden transition-all group-hover/progress:h-3">
            <div
              className="absolute top-0 left-0 h-full bg-accent transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Progress Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all transform -translate-x-1/2 opacity-0 group-hover/progress:opacity-100 scale-50 group-hover/progress:scale-100"
            style={{ left: `${progress}%` }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between md:justify-start gap-4 md:gap-8">
            <div className="flex items-center gap-3 md:gap-5">
              <button
                onClick={(e) => skip(-10, e)}
                className="text-white/70 hover:text-white transition-all p-3 rounded-xl hover:bg-white/10 active:scale-95"
                title="Rewind 10s"
              >
                <RotateCcw className="w-7 h-7" />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 md:w-8 md:h-8 fill-current" />
                ) : (
                  <Play className="w-7 h-7 md:w-8 md:h-8 fill-current ml-1" />
                )}
              </button>

              <button
                onClick={(e) => skip(10, e)}
                className="text-white/70 hover:text-white transition-all p-3 rounded-xl hover:bg-white/10 active:scale-95"
                title="Forward 10s"
              >
                <RotateCw className="w-7 h-7" />
              </button>
            </div>

            <div className="flex items-center gap-4 text-white/90 font-bold tabular-nums text-sm md:text-lg">
              <span className="opacity-100">{formatTime(videoRef.current?.currentTime || 0)}</span>
              <span className="text-white/20">/</span>
              <span className="text-white/50">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 md:gap-5">
             <div className="flex items-center gap-2 group/volume">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setVolume(volume === 0 ? 1 : 0);
                  if (videoRef.current) videoRef.current.volume = volume === 0 ? 1 : 0;
                }}
                className="text-white/70 hover:text-white transition-all p-3 rounded-xl hover:bg-white/10 active:scale-90"
              >
                {volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
              <div className="w-0 group-hover/volume:w-24 overflow-hidden transition-all duration-300">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-accent"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQuality(!showQuality);
                    setShowSubtitles(false);
                  }}
                  className={cn(
                    "px-4 py-2.5 rounded-xl transition-all flex items-center gap-2.5 active:scale-95",
                    showQuality ? "bg-accent text-white" : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Settings2 className="w-5 h-5" />
                  <span className="hidden sm:inline font-bold text-sm">{currentSource && formatQuality(currentSource.quality)}</span>
                </button>
                {showQuality && (
                  <div className="absolute bottom-full right-0 mb-4 animate-in fade-in slide-in-from-bottom-2">
                    <QualitySelector
                      sources={apiResponse.sources}
                      currentSource={currentSource}
                      onSelect={(src) => {
                        setCurrentSource(src);
                        setShowQuality(false);
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSubtitles(!showSubtitles);
                    setShowQuality(false);
                  }}
                  className={cn(
                    "px-4 py-2.5 rounded-xl transition-all flex items-center gap-2.5 active:scale-95",
                    showSubtitles ? "bg-accent text-white" : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Subtitles className="w-5 h-5" />
                  <span className="hidden sm:inline font-bold text-sm">Captions</span>
                </button>
                {showSubtitles && (
                  <div className="absolute bottom-full right-0 mb-4 animate-in fade-in slide-in-from-bottom-2">
                    <SubtitleSelector
                      subtitles={apiResponse.subtitles}
                      currentSubtitle={currentSubtitle}
                      onSelect={(sub) => {
                        setCurrentSubtitle(sub);
                        setShowSubtitles(false);
                      }}
                    />
                  </div>
                )}
              </div>

              <button
                onClick={(e) => toggleFullscreen(e)}
                className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-95"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          background: #fff;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
};
