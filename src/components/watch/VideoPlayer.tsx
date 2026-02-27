import React, { useState, useEffect } from 'react';
import { VideoPlayer as CustomVideoPlayer } from '../../../imported-player/components/VideoPlayer';
import { BackendApiResponse } from '../../../imported-player/types/api';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface VideoPlayerProps {
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
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
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
          apiResponse={jellyData}
          isMovie={isMovie}
          seasonNumber={seasonNumber}
          episodeNumber={episodeNumber}
          episodeTitle={episodeTitle}
          showTitle={showTitle}
          seasons={seasons}
          onEpisodeSelect={onEpisodeSelect}
          isFirstEpisode={isFirstEpisode}
          isLastEpisode={isLastEpisode}
          onBack={onBack}
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
