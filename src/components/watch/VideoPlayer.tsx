import React, { useState, useEffect } from 'react';
import { VideoPlayer as CustomVideoPlayer } from './CustomVideoPlayer';
import { BackendApiResponse } from '../../api/player-types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface VideoPlayerProps {
  id?: number;
  videoUrl?: string;
  jellyData?: BackendApiResponse | null;
  useCustomPlayer: boolean;
  isMovie?: boolean;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  showTitle?: string;
  seasons?: any[];
  onEpisodeNext?: () => void;
  onEpisodePrevious?: () => void;
  onEpisodeSelect?: (season: number, episode: number) => void;
  isFirstEpisode?: boolean;
  isLastEpisode?: boolean;
  onBack?: () => void;
  onTogglePlayer?: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  id,
  videoUrl,
  jellyData,
  useCustomPlayer,
  isMovie,
  seasonNumber,
  episodeNumber,
  episodeTitle,
  showTitle,
  seasons,
  onEpisodeNext,
  onEpisodePrevious,
  onEpisodeSelect,
  isFirstEpisode,
  isLastEpisode,
  onBack,
  onTogglePlayer,
  onProgress,
}) => {
  const [showEpisodeSelector, setShowEpisodeSelector] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(seasonNumber || 1);

  useEffect(() => {
    setSelectedSeason(seasonNumber || 1);
  }, [seasonNumber]);

  if (useCustomPlayer && jellyData) {
    return (
      <div className="relative w-full h-full bg-black overflow-hidden">
        <CustomVideoPlayer
          id={id}
          apiResponse={jellyData}
          isMovie={isMovie}
          seasonNumber={seasonNumber}
          episodeNumber={episodeNumber}
          episodeTitle={episodeTitle}
          showTitle={showTitle}
          seasons={seasons}
          onEpisodeSelect={onEpisodeSelect}
          onEpisodeNext={onEpisodeNext}
          onEpisodePrevious={onEpisodePrevious}
          isFirstEpisode={isFirstEpisode}
          isLastEpisode={isLastEpisode}
          onBack={onBack}
          onTogglePlayer={onTogglePlayer}
          onProgress={onProgress}
        />
      </div>
    );
  }

  if (!videoUrl) return null;

  return (
    <div className="absolute inset-0">
      <iframe
        key={videoUrl}
        src={videoUrl}
        className="w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
};

export default VideoPlayer;
