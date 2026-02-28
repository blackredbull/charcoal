import React from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Server, MonitorPlay } from 'lucide-react';
import { cn } from '../../lib/utils';
import EpisodeSelector from '../shared/EpisodeSelector';
import SourcesMenu from './SourcesMenu';

interface BottomBarProps {
  onBack: () => void;
  backUrl: string;
  onPrevious: () => void;
  onNext: () => void;
  onSourceChange: (source: string) => void;
  selectedSource: string;
  showTitle?: string;
  episodeTitle?: string;
  seasons?: any[];
  currentSeason?: string;
  currentEpisode?: string;
  selectedSeason: number;
  onSeasonChange: (season: number) => void;
  onEpisodeSelect: (season: number, episode: number) => void;
  isFirstEpisode: boolean;
  isLastEpisode: boolean;
  tvId: number;
  isMovie?: boolean;
  isLandscape?: boolean;
  useCustomPlayer?: boolean;
  onTogglePlayer?: () => void;
  hasCustomPlayer?: boolean;
}

const BottomBar: React.FC<BottomBarProps> = ({
  onBack,
  backUrl,
  onPrevious,
  onNext,
  onSourceChange,
  selectedSource,
  showTitle,
  episodeTitle,
  seasons,
  currentSeason,
  currentEpisode,
  selectedSeason,
  onSeasonChange,
  onEpisodeSelect,
  isFirstEpisode,
  isLastEpisode,
  tvId,
  isMovie,
  isLandscape,
  useCustomPlayer,
  onTogglePlayer,
  hasCustomPlayer,
}) => {
  const [isEpisodeMenuOpen, setIsEpisodeMenuOpen] = React.useState(false);
  const [isSourcesMenuOpen, setIsSourcesMenuOpen] = React.useState(false);
  const episodeButtonRef = React.useRef<HTMLButtonElement>(null);
  const sourcesButtonRef = React.useRef<HTMLButtonElement>(null);

  return (
    <div className={cn(
      "relative flex items-center justify-between gap-2 p-2 md:p-3 bg-black/95 backdrop-blur-lg border-t border-white/10",
      isLandscape && "border-b border-t-0"
    )}>
      <button
        onClick={onBack}
        className="h-10 px-3 md:px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl flex items-center gap-2 transition-all duration-200 border border-white/10 hover:border-white/20 flex-shrink-0 active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-bold text-sm hidden md:inline">Back</span>
      </button>

      <div className="relative flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10 flex-1 max-w-[calc(100%-160px)] md:max-w-[500px]">
        {!isMovie && (
          <button
            onClick={onPrevious}
            disabled={isFirstEpisode}
            className="h-8 px-2 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center justify-center transition-all duration-200 border border-white/10 hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <button
          ref={episodeButtonRef}
          onClick={() => setIsEpisodeMenuOpen(!isEpisodeMenuOpen)}
          className="h-8 px-3 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center justify-center transition-all duration-200 border border-white/10 hover:border-accent flex-1 min-w-0 overflow-hidden active:scale-95"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-bold w-full min-w-0">
            <span className="truncate text-center">{showTitle}</span>
            {!isMovie && currentSeason && currentEpisode && (
              <span className="flex items-center gap-2 flex-shrink-0">
                <span className="text-white/20">•</span>
                <span className="text-accent">
                  S{currentSeason.padStart(2, '0')}E{currentEpisode.padStart(2, '0')}
                </span>
              </span>
            )}
          </div>
        </button>
        {!isMovie && (
          <button
            onClick={onNext}
            disabled={isLastEpisode}
            className="h-8 px-2 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center justify-center transition-all duration-200 border border-white/10 hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {isEpisodeMenuOpen && !isMovie && (
          <EpisodeSelector
            isOpen={isEpisodeMenuOpen}
            onClose={() => setIsEpisodeMenuOpen(false)}
            seasons={seasons}
            selectedSeason={selectedSeason}
            currentSeason={currentSeason}
            currentEpisode={currentEpisode}
            onSeasonChange={onSeasonChange}
            onEpisodeSelect={onEpisodeSelect}
            tvId={tvId}
            isLandscape={isLandscape}
            autoNavigate={false}
            showResumeButton={false}
            modalOffset={48}
            modalWidth="w-[90%] md:w-[800px] lg:w-[1000px] xl:w-[1200px]"
            variant="grid"
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        {hasCustomPlayer && (
          <button
            onClick={onTogglePlayer}
            className={cn(
              "h-10 px-3 md:px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl flex items-center gap-2 transition-all duration-200 border border-white/10 hover:border-accent flex-shrink-0 active:scale-95",
              useCustomPlayer && "bg-accent/20 border-accent/50 text-accent hover:bg-accent/30"
            )}
            title={useCustomPlayer ? "Switch to Embed Player" : "Switch to Custom Player"}
          >
            <MonitorPlay className="w-4 h-4" />
            <span className="font-bold text-sm hidden lg:inline">
              {useCustomPlayer ? "Embed" : "Custom"}
            </span>
          </button>
        )}

        <div className="relative">
          <button
            ref={sourcesButtonRef}
            onClick={() => setIsSourcesMenuOpen(!isSourcesMenuOpen)}
            className={cn(
              "h-10 px-3 md:px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl flex items-center gap-2 transition-all duration-200 border border-white/10 hover:border-accent flex-shrink-0 active:scale-95",
              !useCustomPlayer && "bg-accent/20 border-accent/50 text-accent hover:bg-accent/30"
            )}
          >
            <Server className="w-4 h-4" />
            <span className="font-bold text-sm hidden md:inline">Source</span>
          </button>

          <SourcesMenu
            isOpen={isSourcesMenuOpen}
            onClose={() => setIsSourcesMenuOpen(false)}
            selectedSource={selectedSource}
            onSourceSelect={(source) => {
              onSourceChange(source);
              if (useCustomPlayer && onTogglePlayer) onTogglePlayer();
              setIsSourcesMenuOpen(false);
            }}
            isLandscape={isLandscape}
          />
        </div>
      </div>
    </div>
  );
};

export default BottomBar;
