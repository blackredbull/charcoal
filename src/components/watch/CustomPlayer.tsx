import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { Settings, Subtitles, Volume2, Loader2, AlertCircle, RefreshCcw } from 'lucide-react';
import { useJellySources } from '../../api/hooks/useJelly';
import { JellySource, JellySubtitle, JellyAudioTrack } from '../../api/services/jelly';
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const [selectedSource, setSelectedSource] = useState<JellySource | null>(null);
  const [selectedSubtitle, setSelectedSubtitle] = useState<JellySubtitle | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<JellyAudioTrack | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showSettings, setShowSettings] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'none' | 'quality' | 'subtitle' | 'audio'>('none');

  // Load last selected quality from localStorage
  useEffect(() => {
    if (jellyData?.sources?.length) {
      const cachedQuality = localStorage.getItem('player-quality');
      const source = jellyData.sources.find(s => s.quality === cachedQuality) || jellyData.sources[0];
      setSelectedSource(source);
    }
  }, [jellyData]);

  const initPlayer = useCallback(() => {
    if (!videoRef.current || !selectedSource) return;

    const video = videoRef.current;
    setError(null);

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (selectedSource.type === 'hls') {
      if (Hls.isSupported()) {
        const hls = new Hls({
          capLevelToPlayerSize: true,
          autoStartLoad: true,
        });
        hls.loadSource(selectedSource.url);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setError('Playback failed. Please try another source or quality.');
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = selectedSource.url;
      } else {
        setError('HLS playback is not supported in this browser.');
      }
    } else {
      video.src = selectedSource.url;
    }
  }, [selectedSource]);

  useEffect(() => {
    initPlayer();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [initPlayer]);

  const handleQualityChange = (source: JellySource) => {
    setSelectedSource(source);
    localStorage.setItem('player-quality', source.quality);
    setActiveMenu('none');
  };

  const handleSubtitleChange = (sub: JellySubtitle | null) => {
    setSelectedSubtitle(sub);
    setActiveMenu('none');
  };

  const handleAudioChange = (audio: JellyAudioTrack) => {
    setSelectedAudio(audio);
    setActiveMenu('none');
    // Note: Implementing multiple audio tracks in HLS.js or native video might require more logic
    // depending on if they are separate streams or embedded. 
    // For now we just update state.
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (videoRef.current.paused) videoRef.current.play();
        else videoRef.current.pause();
      } else if (e.code === 'ArrowRight') {
        videoRef.current.currentTime += 10;
      } else if (e.code === 'ArrowLeft') {
        videoRef.current.currentTime -= 10;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleVideoClick = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) videoRef.current.play();
    else videoRef.current.pause();
  };

  const handleDoubleVideoClick = (e: React.MouseEvent) => {
    if (!videoRef.current) return;
    const rect = videoRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > rect.width / 2) {
      videoRef.current.currentTime += 10;
    } else {
      videoRef.current.currentTime -= 10;
    }
  };

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  // Fallback to embed if no sources or error
  if ((!jellyData?.sources?.length && !isLoading) || isError || error) {
    if (embedUrl) {
      return (
        <div className="absolute inset-0">
          <iframe
            src={embedUrl}
            className="w-full h-full"
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
          {error || "We couldn't find any direct links for this content."}
        </p>
        <button
          onClick={() => { setError(null); refetch(); }}
          className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
        >
          <RefreshCcw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div 
      className="absolute inset-0 bg-black group overflow-hidden"
      onMouseMove={() => {
        setShowControls(true);
        // Hide controls after 3 seconds of inactivity
        const timer = setTimeout(() => setShowControls(false), 3000);
        return () => clearTimeout(timer);
      }}
    >
      <video
        ref={videoRef}
        className="w-full h-full cursor-pointer"
        playsInline
        autoPlay
        controls={showControls}
        onClick={(e) => {
          if (e.detail === 1) {
            handleVideoClick();
          } else if (e.detail === 2) {
            handleDoubleVideoClick(e);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
      >
        {selectedSubtitle && (
          <track
            key={selectedSubtitle.url}
            src={selectedSubtitle.url}
            kind="subtitles"
            label={selectedSubtitle.label}
            srcLang="en"
            default
          />
        )}
      </video>

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      {/* Custom Overlays for Quality/Subtitle/Audio Selection */}
      <div className={cn(
        "absolute top-4 right-4 flex flex-col gap-2 transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        <button
          onClick={() => setActiveMenu(activeMenu === 'quality' ? 'none' : 'quality')}
          className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm border border-white/10"
          title="Quality"
        >
          <Settings className="w-5 h-5" />
        </button>

        {jellyData?.subtitles?.length > 0 && (
          <button
            onClick={() => setActiveMenu(activeMenu === 'subtitle' ? 'none' : 'subtitle')}
            className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm border border-white/10"
            title="Subtitles"
          >
            <Subtitles className="w-5 h-5" />
          </button>
        )}

        {selectedSource?.audioTracks?.length && selectedSource.audioTracks.length > 1 && (
          <button
            onClick={() => setActiveMenu(activeMenu === 'audio' ? 'none' : 'audio')}
            className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm border border-white/10"
            title="Audio Tracks"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Menus */}
      {activeMenu !== 'none' && (
        <>
          <div
            className="absolute inset-0 z-40"
            onClick={() => setActiveMenu('none')}
          />
          <div className="absolute top-16 right-4 w-48 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
          <div className="p-3 border-b border-white/10">
            <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">
              {activeMenu === 'quality' ? 'Quality' : activeMenu === 'subtitle' ? 'Subtitles' : 'Audio Track'}
            </h4>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {activeMenu === 'quality' && jellyData.sources.map((source) => (
              <button
                key={source.url}
                onClick={() => handleQualityChange(source)}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/10",
                  selectedSource?.quality === source.quality ? "text-red-500 font-bold" : "text-white"
                )}
              >
                {source.quality}
              </button>
            ))}

            {activeMenu === 'subtitle' && (
              <>
                <button
                  onClick={() => handleSubtitleChange(null)}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/10",
                    !selectedSubtitle ? "text-red-500 font-bold" : "text-white"
                  )}
                >
                  Off
                </button>
                {jellyData.subtitles.map((sub) => (
                  <button
                    key={sub.url}
                    onClick={() => handleSubtitleChange(sub)}
                    className={cn(
                      "w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/10",
                      selectedSubtitle?.url === sub.url ? "text-red-500 font-bold" : "text-white"
                    )}
                  >
                    {sub.label}
                  </button>
                ))}
              </>
            )}

            {activeMenu === 'audio' && selectedSource?.audioTracks?.map((audio) => (
              <button
                key={audio.label}
                onClick={() => handleAudioChange(audio)}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/10",
                  selectedAudio?.label === audio.label ? "text-red-500 font-bold" : "text-white"
                )}
              >
                {audio.label} ({audio.language})
              </button>
            ))}
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default CustomPlayer;
