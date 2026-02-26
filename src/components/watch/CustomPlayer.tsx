import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MediaPlayer,
  MediaProvider,
  Track,
  isHLSProvider,
  type MediaProviderAdapter,
} from '@vidstack/react';
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from '@vidstack/react/player/layouts/default';

import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

import { Loader2, AlertCircle, RefreshCcw, Settings } from 'lucide-react';
import { useJellySources } from '../../api/hooks/useJelly';
import { JellySource } from '../../api/services/jelly';
import { cn } from '../../lib/utils';

interface CustomPlayerProps {
  tmdbId: string;
  type: 'movie' | 'tv';
  embedUrl?: string; // fallback source
  season?: number;   // for TV
  episode?: number;  // for TV
  useJelly?: boolean; // whether to attempt Jelly direct streams
}

const CustomPlayer: React.FC<CustomPlayerProps> = ({
  tmdbId,
  type,
  embedUrl,
  season,
  episode,
  useJelly = true,
}) => {
  const { data: jellyData, isLoading, isError, refetch } = useJellySources({
    tmdbId,
    type,
    season,
    episode,
    enabled: useJelly
  });

  const player = useRef<any>(null);
  const [selectedSource, setSelectedSource] = useState<JellySource | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Load last selected quality from localStorage
  useEffect(() => {
    if (jellyData?.sources?.length) {
      const cachedQuality = localStorage.getItem('player-quality');
      const source = jellyData.sources.find(s => s.quality === cachedQuality) || jellyData.sources[0];
      setSelectedSource(source);
    }
  }, [jellyData]);

  const onProviderChange = (provider: MediaProviderAdapter | null) => {
    if (isHLSProvider(provider)) {
      provider.config = {
        capLevelToPlayerSize: true,
        autoStartLoad: true,
      };
    }
  };

  const handleQualityChange = (source: JellySource) => {
    setSelectedSource(source);
    localStorage.setItem('player-quality', source.quality);
    setShowQualityMenu(false);
  };

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  // Fallback to embed if no sources or error
  if ((!jellyData?.sources?.length && !isLoading) || isError || localError) {
    if (embedUrl) {
      return (
        <div className="absolute inset-0 bg-black">
          <iframe
            src={embedUrl}
            className="w-full h-full border-none"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      );
    }
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white p-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-bold mb-2">Failed to load video</h3>
        <p className="text-white/60 mb-6 max-w-md">
          {localError || "We couldn't find any direct links for this content."}
        </p>
        <button
          onClick={() => { setLocalError(null); refetch(); }}
          className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
        >
          <RefreshCcw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black overflow-hidden group">
      {selectedSource && (
        <MediaPlayer
          ref={player}
          title={type === 'movie' ? 'Movie' : `S${season} E${episode}`}
          src={selectedSource.url}
          onProviderChange={onProviderChange}
          onError={() => setLocalError('Playback failed. Please try another source.')}
          className="w-full h-full"
          playsInline
          autoPlay
          crossOrigin
        >
          <MediaProvider />
          
          {jellyData?.subtitles?.map((sub) => (
            <Track
              key={sub.url}
              src={sub.url}
              kind="subtitles"
              label={sub.label}
              lang="en"
              type="vtt"
            />
          ))}

          <DefaultVideoLayout
            icons={defaultLayoutIcons}
          />
        </MediaPlayer>
      )}

      {/* Manual Quality Switcher as an overlay if multiple sources exist */}
      {jellyData?.sources && jellyData.sources.length > 1 && (
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => setShowQualityMenu(!showQualityMenu)}
            className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Switch Quality"
          >
            <Settings className="w-5 h-5" />
          </button>

          {showQualityMenu && (
            <>
              <div 
                className="fixed inset-0" 
                onClick={() => setShowQualityMenu(false)}
              />
              <div className="absolute top-12 right-0 w-48 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[60]">
                <div className="p-3 border-b border-white/10">
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">
                    Quality
                  </h4>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {jellyData.sources.map((source) => (
                    <button
                      key={source.url}
                      onClick={() => handleQualityChange(source)}
                      className={cn(
                        "w-full px-4 py-3 text-left text-sm transition-colors hover:bg-white/10",
                        selectedSource?.url === source.url ? "text-red-500 font-bold" : "text-white"
                      )}
                    >
                      <div className="flex flex-col">
                        <span>{source.quality}</span>
                        <span className="text-[10px] text-white/40 uppercase tracking-tight">
                          {source.provider.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomPlayer;
