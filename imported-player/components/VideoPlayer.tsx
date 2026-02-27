import React, { useEffect, useRef, useState, useCallback } from 'react';
import HlsLib from 'hls.js';
import { BackendApiResponse, BackendSource, BackendSubtitle } from '../types/api';

const Hls = HlsLib;

interface VideoPlayerProps {
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
}

const formatQuality = (quality: string): string => {
  if (!quality) return 'Auto';
  const lower = quality.toLowerCase();

  // Handle "unknown" or empty
  if (lower === 'unknown' || lower === '') return 'SD';

  // Handle "up to HD" type strings
  if (lower.includes('up to hd') || (lower.includes('hd') && !lower.match(/\d/))) return 'HD';

  // Extract numbers
  const cleanQuality = lower.replace(/[^0-9]/g, '');

  if (cleanQuality.includes('2160') || lower.includes('4k')) return '4K';
  if (cleanQuality.includes('1440') || lower.includes('2k')) return '2K';
  if (cleanQuality.includes('1080')) return '1080p';
  if (cleanQuality.includes('720')) return '720p';
  if (cleanQuality.includes('480')) return '480p';
  if (cleanQuality.includes('360')) return '360p';

  // If we have a number, append 'p'
  if (cleanQuality) return `${cleanQuality}p`;

  return 'SD';
};

// million-ignore
const SourceList = ({
  sources,
  currentSource,
  onSelect
}: {
  sources: BackendSource[],
  currentSource: BackendSource | null,
  onSelect: (src: BackendSource) => void
}) => (
  <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
    {sources.map((src, i) => (
      <button
        key={i}
        onClick={() => onSelect(src)}
        className={`w-full text-left px-3.5 py-2.5 rounded-lg hover:bg-white/5 text-sm flex justify-between items-center transition-all border ${currentSource === src ? 'bg-accent/10 border-accent/50 text-accent' : 'border-white/5 text-gray-300 hover:border-white/10'}`}
      >
        <div className="flex flex-col gap-0.5">
          <span className="font-bold tracking-tight">{formatQuality(src.quality)}</span>
          <span className="text-[10px] opacity-40 uppercase font-medium tracking-wide">{src.type.toUpperCase()}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-white/50 uppercase font-medium tracking-tight border border-white/5">{src.provider.name}</span>
        </div>
      </button>
    ))}
  </div>
);

// million-ignore
const SubtitleList = ({
  subtitles,
  currentSubtitle,
  onSelect
}: {
  subtitles: BackendSubtitle[],
  currentSubtitle: BackendSubtitle | null,
  onSelect: (sub: BackendSubtitle | null) => void
}) => (
  <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
    <button
      onClick={() => onSelect(null)}
      className={`w-full text-left px-3.5 py-2.5 rounded-lg hover:bg-white/5 text-sm transition-all border ${currentSubtitle === null ? 'bg-accent/10 border-accent/50 text-accent font-semibold' : 'border-white/5 text-gray-300 hover:border-white/10'}`}
    >
      None (Off)
    </button>
    {subtitles.map((sub, i) => (
      <button
        key={i}
        onClick={() => onSelect(sub)}
        className={`w-full text-left px-3.5 py-2.5 rounded-lg hover:bg-white/5 text-sm transition-all border ${currentSubtitle === sub ? 'bg-accent/10 border-accent/50 text-accent font-semibold' : 'border-white/5 text-gray-300 hover:border-white/10'}`}
      >
        <span>{sub.label}</span>
      </button>
    ))}
  </div>
);

// million-ignore
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
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
  onBack
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [currentSource, setCurrentSource] = useState<BackendSource | null>(apiResponse.sources[0] || null);
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

    // Cleanup existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Reset video element
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
        setProgress((video.currentTime / video.duration) * 100);
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

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentSource]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (videoRef.current && duration && !isNaN(duration)) {
      const time = (Number(e.target.value) / 100) * duration;
      videoRef.current.currentTime = Math.max(0, Math.min(time, duration));
    }
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

  return (
    <div
      className="relative w-full h-full bg-black overflow-hidden group select-none"
      onMouseMove={handleMouseMove}
      onClick={togglePlay}
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

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Title and Back Button Overlay */}
      {showControls && (
        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex items-center justify-between z-30 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10 hover:border-white/20 transition-all"
                title="Back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {showTitle && (
              <div className="backdrop-blur-md bg-black/40 border border-white/10 rounded-lg px-4 py-2">
                <p className="text-white text-sm md:text-base font-semibold truncate">{showTitle}</p>
                {!isMovie && seasonNumber && episodeNumber && (
                  <p className="text-white/70 text-xs md:text-sm">
                    S{String(seasonNumber).padStart(2, '0')}E{String(episodeNumber).padStart(2, '0')} {episodeTitle && `• ${episodeTitle}`}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Episode Selector Overlay - Redesigned for Landscape */}
      {!isMovie && showEpisodeSelector && seasons && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-7xl max-h-[90vh] bg-black/95 border border-white/10 rounded-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
              <h2 className="text-white font-bold text-xl md:text-2xl">Select Episode</h2>
              <button
                onClick={() => setShowEpisodeSelector(false)}
                className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 hover:border-white/20 transition-all"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Season Tabs */}
            <div className="flex gap-2 p-4 md:px-6 overflow-x-auto border-b border-white/10 custom-scrollbar">
              {seasons.map((season) => (
                <button
                  key={season.season_number}
                  onClick={() => setSelectedSeason(season.season_number)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all flex-shrink-0 border ${
                    selectedSeason === season.season_number
                      ? 'bg-accent/20 border-accent/50 text-accent'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  Season {season.season_number}
                </button>
              ))}
            </div>

            {/* Episodes Grid - Landscape Optimized */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {seasons
                  .find((s) => s.season_number === selectedSeason)
                  ?.episodes.map((episode: any) => (
                    <button
                      key={episode.episode_number}
                      onClick={() => {
                        onEpisodeSelect?.(selectedSeason, episode.episode_number);
                        setShowEpisodeSelector(false);
                      }}
                      className={`flex flex-col gap-2 p-3 rounded-lg transition-all border text-left group hover:scale-[1.02] ${
                        episodeNumber === episode.episode_number && seasonNumber === selectedSeason
                          ? 'bg-accent/20 border-accent/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-full aspect-video bg-white/10 rounded-md border border-white/10 overflow-hidden relative">
                        {episode.still_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                            alt={episode.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {episode.runtime && (
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white rounded text-xs font-medium border border-white/20">
                            {episode.runtime}m
                          </span>
                        )}
                      </div>

                      {/* Episode Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                          <span className={`font-semibold text-sm leading-tight ${
                            episodeNumber === episode.episode_number && seasonNumber === selectedSeason
                              ? 'text-accent'
                              : 'text-white'
                          }`}>
                            {episode.episode_number}. {episode.name}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                          {episode.overview || 'No description available'}
                        </p>
                        {episode.air_date && (
                          <span className="text-xs text-white/40 mt-1.5 block">
                            {new Date(episode.air_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 flex flex-col justify-end p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >

        {/* Progress Bar */}
        <div className="w-full mb-2 relative group/progress pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent to-accent/80 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.01"
              value={progress || 0}
              onChange={handleSeek}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Seek"
            />
          </div>
          <div className="absolute -top-1 left-0 w-1 h-4 bg-white rounded-full shadow-lg transition-all transform -translate-x-1/2 group-hover/progress:scale-125" style={{ left: `${progress}%` }}></div>
        </div>

        {/* Duration Labels */}
        <div className="flex items-center justify-between text-xs text-white/70 mb-4 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <span className="tabular-nums">{formatTime(videoRef.current?.currentTime || 0)}</span>
          <span className="tabular-nums">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between text-white pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={(e) => skip(-10, e)}
              className="hover:bg-white/10 hover:text-accent transition-all p-2 rounded-lg active:scale-95"
              title="Rewind 10s"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
            </button>
            <button
              onClick={togglePlay}
              className="hover:bg-accent/20 text-accent hover:text-accent transition-all active:scale-95 p-2 rounded-lg"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <button
              onClick={(e) => skip(10, e)}
              className="hover:bg-white/10 hover:text-accent transition-all p-2 rounded-lg active:scale-95"
              title="Forward 10s"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.5 8c2.65 0 5.05 1 6.9 2.6L22 7v9h-9l3.62-3.62c-1.39-1.16-3.16-1.88-5.12-1.88-3.54 0-6.55 2.31-7.6 5.5l-2.37-.78C2.92 11.03 6.85 8 11.5 8z"/></svg>
            </button>

            <div className="flex items-center gap-2 group/volume md:ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setVolume(volume === 0 ? 1 : 0);
                  if (videoRef.current) videoRef.current.volume = volume === 0 ? 1 : 0;
                }}
                className="hover:bg-white/10 hover:text-accent transition-all p-2 rounded-lg active:scale-95"
                title="Mute"
              >
                {volume === 0 ? (
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                ) : (
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-20 transition-all duration-300 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-accent"
              />
            </div>
          </div>

          {/* Unified Controls Container */}
          <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
            {/* Episodes Button (TV Shows Only) */}
            {!isMovie && seasons && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEpisodeSelector(!showEpisodeSelector);
                }}
                className="px-3 md:px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-accent/20 border border-transparent hover:border-accent/50 rounded-lg transition-all flex items-center gap-2 active:scale-95"
                title="Episodes"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline">Episodes</span>
              </button>
            )}

            {/* Quality Selector */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQuality(!showQuality);
                  setShowSubtitles(false);
                }}
                className="px-3 md:px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-accent/20 border border-transparent hover:border-accent/50 rounded-lg transition-all flex items-center gap-2 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span className="hidden sm:inline">{currentSource && formatQuality(currentSource.quality)}</span>
              </button>
              {showQuality && (
                <div className="absolute bottom-full right-0 mb-3 w-72 bg-black/95 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md">
                  <div className="text-[10px] font-black text-white/50 mb-3 px-2 uppercase tracking-wider">Quality</div>
                  <SourceList
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

            {/* Subtitles Selector */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSubtitles(!showSubtitles);
                  setShowQuality(false);
                }}
                className="px-3 md:px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-accent/20 border border-transparent hover:border-accent/50 rounded-lg transition-all flex items-center gap-2 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="8" width="20" height="12" rx="2" strokeWidth="2"/><path d="M6 15h4M14 15h4M6 12h2M16 12h2" strokeWidth="2" strokeLinecap="round"/></svg>
                <span className="hidden sm:inline">CC</span>
              </button>
              {showSubtitles && (
                <div className="absolute bottom-full right-0 mb-3 w-60 bg-black/95 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md">
                  <div className="text-[10px] font-black text-white/50 mb-3 px-2 uppercase tracking-wider">Captions</div>
                  <SubtitleList
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

            {/* Fullscreen Toggle */}
            <button onClick={(e) => toggleFullscreen(e)} className="hover:bg-accent/20 hover:border-accent/50 transition-all active:scale-95 p-2 border border-transparent rounded-lg" title="Fullscreen">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </div>
  );
};
