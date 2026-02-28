import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronDown, ChevronLeft, ChevronRight, List, Play, Check, StepForward } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getImageUrl } from '../../api/config';
import { useStore } from '../../store/useStore';
import { getVideoProgress } from '../../lib/watch';

interface Episode {
  episode_number: number;
  name: string;
  overview: string;
  still_path: string;
  runtime?: number;
  air_date?: string;
}

interface Season {
  season_number: number;
  name: string;
  episodes: Episode[];
}

interface EpisodeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  seasons: Season[];
  tvId: number;
  title?: string;
  // Optional props for watch page integration
  selectedSeason?: number;
  currentSeason?: string;
  currentEpisode?: string;
  onSeasonChange?: (season: number) => void;
  onEpisodeSelect?: (season: number, episode: number) => void;
  // Layout options
  isLandscape?: boolean;
  showResumeButton?: boolean;
  autoNavigate?: boolean;
  // New customization props
  modalOffset?: number;
  modalWidth?: string;
  hideTitle?: boolean;
  variant?: 'list' | 'grid';
}

const EpisodeSelector: React.FC<EpisodeSelectorProps> = ({
  isOpen,
  onClose,
  seasons,
  tvId,
  title,
  selectedSeason: propSelectedSeason,
  currentSeason,
  currentEpisode,
  onSeasonChange,
  onEpisodeSelect,
  isLandscape = false,
  showResumeButton = true,
  autoNavigate = true,
  modalOffset,
  modalWidth = 'w-[80%]',
  hideTitle = false,
  variant = 'list',
}) => {
  const navigate = useNavigate();
  const [internalSelectedSeason, setInternalSelectedSeason] = useState(1);
  const { watchHistory } = useStore();
  
  // Use prop season if provided, otherwise use internal state
  const selectedSeason = propSelectedSeason ?? internalSelectedSeason;
  const currentSeasonData = seasons?.find(s => s.season_number === selectedSeason);

  // Get resume info from both sources
  const resumeInfo = getVideoProgress();
  const historyInfo = watchHistory.find(
    item => item.mediaType === 'tv' && item.id === tvId
  );

  // Use the most recent progress for resume button
  const currentProgress = resumeInfo?.id === tvId && resumeInfo?.mediaType === 'tv'
    ? resumeInfo
    : historyInfo;

  useEffect(() => {
    if (seasons.length > 0 && seasons[0] && !propSelectedSeason) {
      setInternalSelectedSeason(seasons[0].season_number);
    }
  }, [seasons, propSelectedSeason]);

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null;
    return minutes >= 60
      ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
      : `${minutes}m`;
  };

  const formatAirDate = (date?: string) => {
    if (!date) return 'TBA';
    const airDate = new Date(date);
    const now = new Date();
    const isInFuture = airDate > now;

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: airDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    }).format(airDate) + (isInFuture ? ' (Upcoming)' : '');
  };

  const getEpisodeProgress = (seasonNumber: number, episodeNumber: number) => {
    // Check video progress first
    if (resumeInfo?.id === tvId &&
        resumeInfo?.season === seasonNumber &&
        resumeInfo?.episode === episodeNumber) {
      return {
        progress: (resumeInfo.timestamp / resumeInfo.duration) * 100,
        isCompleted: resumeInfo.isCompleted || (resumeInfo.timestamp / resumeInfo.duration) >= 0.9,
        isWatching: !resumeInfo.isCompleted && resumeInfo.timestamp > 0,
        remainingTime: formatDuration(Math.floor((resumeInfo.duration - resumeInfo.timestamp) / 60))
      };
    }

    // Fall back to history progress
    const historyProgress = watchHistory.find(
      item => item.mediaType === 'tv' && item.id === tvId && item.season === seasonNumber && item.episode === episodeNumber
    );

    if (historyProgress?.progress) {
      const watched = historyProgress.progress.watched;
      const duration = historyProgress.progress.duration;
      const remaining = Math.max(0, duration - watched);

      return {
        progress: (watched / duration) * 100,
        isCompleted: historyProgress.isCompleted || (watched / duration) >= 0.9,
        isWatching: !historyProgress.isCompleted && watched > 0,
        remainingTime: formatDuration(Math.floor(remaining / 60))
      };
    }

    return null;
  };

  // Sort episodes by completion status if in list mode
  const sortedEpisodes = useMemo(() => {
    if (!currentSeasonData?.episodes) return [];

    if (variant === 'grid') return currentSeasonData.episodes;

    return [...currentSeasonData.episodes].sort((a, b) => {
      const progressA = getEpisodeProgress(selectedSeason, a.episode_number);
      const progressB = getEpisodeProgress(selectedSeason, b.episode_number);

      if (progressA?.isCompleted && !progressB?.isCompleted) return 1;
      if (!progressA?.isCompleted && progressB?.isCompleted) return -1;
      return a.episode_number - b.episode_number;
    });
  }, [currentSeasonData, selectedSeason, watchHistory, resumeInfo]);

  const handleSeasonChange = (newSeason: number) => {
    if (onSeasonChange) {
      onSeasonChange(newSeason);
    } else {
      setInternalSelectedSeason(newSeason);
    }
  };

  const handleEpisodeSelect = (season: number, episode: number) => {
    if (onEpisodeSelect) {
      onEpisodeSelect(season, episode);
    }
    
    if (autoNavigate) {
      navigate(`/watch/tv/${tvId}?season=${season}&episode=${episode}`);
    }
    
    onClose();
  };

  const handleResumeClick = () => {
    if (currentProgress?.season && currentProgress?.episode) {
      handleEpisodeSelect(currentProgress.season, currentProgress.episode);
    }
  };

  if (!isOpen) return null;

  // Determine layout classes based on context
  const getLayoutClasses = () => {
    if (isLandscape) {
      const topOffset = modalOffset ? `calc(50% + ${modalOffset}px)` : '50%';
      return `fixed left-1/2 -translate-x-1/2 -translate-y-1/2 ${modalWidth} max-w-[600px] h-[85vh] rounded-lg`;
    }
    return `fixed inset-x-0 bottom-0 h-[80vh] rounded-t-2xl md:${modalWidth} md:max-w-[600px] md:right-auto md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 md:bottom-auto md:rounded-lg md:max-h-[90vh]`;
  };

  const getModalStyle = () => {
    if (isLandscape && modalOffset) {
      return { top: `calc(50% + ${modalOffset}px)` };
    }
    return {};
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "z-50 bg-light-bg dark:bg-dark-bg shadow-2xl border border-border-light dark:border-border-dark flex flex-col transition-all duration-300 backdrop-blur-lg",
          getLayoutClasses(),
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
        )}
        style={getModalStyle()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">Episodes</h2>
            {!hideTitle && title && <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">• {title}</span>}
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-light-surface dark:bg-dark-surface hover:bg-light-text-secondary/10 dark:hover:bg-dark-text-secondary/10 rounded-lg border border-border-light dark:border-border-dark hover:border-border-light/50 dark:hover:border-border-dark/50 transition-all active:scale-95"
            title="Close"
          >
            <X className="w-4 h-4 text-light-text-primary dark:text-dark-text-primary" />
          </button>
        </div>


        {/* Season Selector */}
        <div className="px-4 py-3 border-b border-border-light dark:border-border-dark">
          <div className="relative">
            <select
              value={selectedSeason}
              onChange={(e) => handleSeasonChange(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-light-surface dark:bg-dark-surface hover:bg-light-text-secondary/10 dark:hover:bg-dark-text-secondary/10 border border-border-light dark:border-border-dark hover:border-accent/50 rounded-lg text-light-text-primary dark:text-dark-text-primary appearance-none focus:outline-none focus:border-accent transition-all pr-10 font-medium backdrop-blur-sm"
            >
              {seasons.map((season) => (
                <option
                  key={season.season_number}
                  value={season.season_number}
                  className="bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary"
                >
                  {season.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none text-light-text-secondary/60 dark:text-dark-text-secondary/60" />
          </div>
        </div>

        {/* Episodes List/Grid */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2 md:p-4">
          <div className={cn(
            variant === 'list' ? "space-y-2" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          )}>
            {sortedEpisodes.map((episode, index) => {
              const duration = formatDuration(episode.runtime);
              const progress = getEpisodeProgress(selectedSeason, episode.episode_number);
              const isCurrent = (currentSeason && currentEpisode)
                ? (selectedSeason === Number(currentSeason) && episode.episode_number === Number(currentEpisode))
                : (resumeInfo?.season === selectedSeason && resumeInfo?.episode === episode.episode_number);

              const airDate = episode.air_date ? new Date(episode.air_date) : null;
              const isUpcoming = airDate ? airDate > new Date() : false;

              if (variant === 'list') {
                return (
                  <button
                    key={episode.episode_number}
                    disabled={isUpcoming}
                    onClick={() => handleEpisodeSelect(selectedSeason, episode.episode_number)}
                    className={cn(
                      "w-full px-3 py-3 hover:bg-white/10 flex gap-3 group relative rounded-lg transition-all border",
                      isCurrent ? "bg-accent/20 border-accent/50" : "bg-white/5 border-white/10 hover:border-white/20",
                      (progress?.isCompleted || isUpcoming) && "opacity-60"
                    )}
                  >
                    {/* Episode Thumbnail */}
                    <div className="w-28 aspect-video bg-light-surface dark:bg-dark-surface flex-shrink-0 rounded-md border border-border-light dark:border-border-dark overflow-hidden relative">
                      {episode.still_path ? (
                        <img
                          src={getImageUrl(episode.still_path, 'w300')}
                          alt={episode.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/5" />
                      )}
                      {duration && (
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/80 text-white rounded text-xs font-medium border border-white/20">
                          {duration}
                        </span>
                      )}
                      {progress?.remainingTime && !progress.isCompleted && (
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-accent/80 text-white rounded text-xs font-medium border border-accent/20">
                          {progress.remainingTime} left
                        </span>
                      )}
                      {isUpcoming && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-white/80">Upcoming</span>
                        </div>
                      )}
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                        <div className="w-8 h-8 bg-accent hover:bg-accent/90 rounded flex items-center justify-center transition-all shadow-lg border border-accent/50">
                          {progress?.isCompleted ? (
                            <Check className="w-4 h-4 text-white scale-100 group-hover:scale-110 transition-transform" />
                          ) : (isCurrent || progress?.isWatching) ? (
                            <StepForward className="w-4 h-4 text-white scale-100 group-hover:scale-110 transition-transform" />
                          ) : (
                            <Play className="w-4 h-4 text-white scale-100 group-hover:scale-110 transition-transform" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Episode Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "font-semibold text-sm",
                          isCurrent ? "text-accent" : "text-white"
                        )}>
                          {index + 1}. {episode.name}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 line-clamp-2 mb-1">
                        {episode.overview || 'No description available'}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-white/40">
                          {formatAirDate(episode.air_date)}
                        </span>
                        {progress?.remainingTime && (
                          <span className="text-xs text-white/40">
                            {progress.remainingTime} left
                          </span>
                        )}
                      </div>
                      {/* Progress Bar */}
                      {progress && (
                        <div className="mt-1.5">
                          <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent transition-all duration-300"
                              style={{ width: `${Math.min(progress.progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              }

              // Grid variant
              return (
                <button
                  key={episode.episode_number}
                  disabled={isUpcoming}
                  onClick={() => handleEpisodeSelect(selectedSeason, episode.episode_number)}
                  className={cn(
                    "group flex flex-col gap-3 p-3 rounded-2xl transition-all text-left border relative overflow-hidden",
                    isCurrent
                      ? "bg-accent/10 border-accent/40 ring-1 ring-accent/20"
                      : "bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/10",
                    isUpcoming && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="w-full aspect-video bg-white/5 rounded-xl overflow-hidden relative flex-shrink-0 shadow-lg transition-all">
                    {episode.still_path ? (
                      <img
                        src={getImageUrl(episode.still_path, 'w500')}
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

                    <div className="absolute bottom-2 left-2">
                      {duration && (
                        <div className="px-2 py-1 bg-black/80 backdrop-blur-md text-white rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          {duration}
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                      {progress?.isCompleted ? (
                        <div className="px-2 py-1 bg-green-500/80 backdrop-blur-md text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Watched
                        </div>
                      ) : (progress?.remainingTime && (
                        <div className="px-2 py-1 bg-accent/80 backdrop-blur-md text-white rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          {progress.remainingTime} left
                        </div>
                      ))}
                    </div>

                    {isCurrent && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-accent text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-lg animate-pulse">
                        Watching
                      </div>
                    )}

                    {progress && !isCurrent && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${Math.min(progress.progress, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 px-1">
                    <h3 className={cn(
                      "text-sm font-bold leading-tight line-clamp-1 mb-1",
                      isCurrent ? "text-accent" : "text-white"
                    )}>
                      {episode.episode_number}. {episode.name}
                    </h3>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                        {formatAirDate(episode.air_date)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer with Resume and Navigation */}
        <div className="p-4 md:p-6 border-t border-border-light dark:border-border-dark bg-light-surface/50 dark:bg-dark-surface/50 flex items-center justify-between gap-3">
          <div>
            {showResumeButton && currentProgress?.season && currentProgress?.episode && (
              <button
                onClick={handleResumeClick}
                className="flex items-center justify-center gap-2 py-2.5 px-5 bg-accent hover:bg-accent/90 text-white rounded-xl shadow-lg shadow-accent/20 transition-all text-sm font-bold active:scale-95"
              >
                <StepForward className="w-4 h-4" />
                Resume
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              disabled={isFirstEpisode}
              onClick={() => onEpisodePrevious?.()}
              className="flex items-center justify-center gap-2 py-2.5 px-5 bg-light-surface/60 dark:bg-dark-surface/60 hover:bg-light-text-secondary/10 dark:hover:bg-dark-text-secondary/10 disabled:opacity-30 disabled:hover:bg-light-surface/60 dark:disabled:hover:bg-dark-surface/60 text-light-text-primary dark:text-dark-text-primary rounded-xl border border-border-light dark:border-border-dark transition-all text-sm font-bold active:scale-95"
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
    </>
  );
};

export default EpisodeSelector;
