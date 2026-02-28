import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video as VideoIcon, List, X, ChevronLeft, ChevronRight, Play, Check, Eye, SkipForward, Flame } from 'lucide-react';
import { useStore, WatchStatus } from '../store/useStore';
import { useTVDetails } from '../api/hooks/useTVDetails';
import DetailsBanner from '../components/shared/DetailsBanner';
import RelatedVideos from '../components/shared/RelatedVideos';
import SimilarContent from '../components/shared/SimilarContent';
import { cn } from '../lib/utils';

const TVDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { details, isLoading, contentRating, seasons } = useTVDetails(id);
  const { addToWatchlist, removeFromWatchlist, getWatchlistItem, watchHistory } = useStore();

  const [isEpisodeSelectorOpen, setIsEpisodeSelectorOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);

  const season = searchParams.get('season') || '1';
  const episode = searchParams.get('episode') || '1';

  const watchlistItem = getWatchlistItem(Number(id), 'tv');
  const resumeInfo = watchHistory.find(h => h.id === Number(id) && h.mediaType === 'tv');

  const currentSeasonData = seasons?.find(s => s.season_number === selectedSeason);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isLoading || !details) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  const year = new Date(details.first_air_date).getFullYear();

  const handleWatchlistAdd = (status: WatchStatus) => {
    addToWatchlist({
      id: Number(id),
      mediaType: 'tv',
      title: details.name,
      posterPath: details.poster_path,
      addedAt: Date.now(),
      status,
    });
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsEpisodeSelectorOpen(true);
  };

  const youtubeVideos = (details.videos?.results.filter(video =>
    video.site === 'YouTube' &&
    (video.type === 'Trailer' || video.type === 'Teaser' || video.type === 'Behind the Scenes')
  ) || []).slice(0, 7);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen space-y-12 pb-20"
    >
      <DetailsBanner
        type="tv"
        title={details.name}
        year={year}
        overview={details.overview}
        posterPath={details.poster_path}
        backdropPath={details.backdrop_path}
        rating={details.vote_average}
        contentRating={contentRating}
        genres={details.genres}
        watchlistItem={watchlistItem}
        onWatchlistAdd={handleWatchlistAdd}
        onWatchlistRemove={() => removeFromWatchlist(Number(id), 'tv')}
        id={id!}
        season={season}
        episode={episode}
        watchHistory={watchHistory}
        onPlayClick={handlePlayClick}
        numberOfSeasons={details.number_of_seasons}
      />

      {youtubeVideos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative px-4 md:px-0"
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="px-4 md:px-8 py-6 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-xl border border-accent/30">
                <VideoIcon className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Related Videos</h2>
              <span className="text-white/40 ml-auto font-mono text-sm">{youtubeVideos.length} Items</span>
            </div>
            <div className="p-4 md:p-8">
              <RelatedVideos videos={youtubeVideos} />
            </div>
          </div>
        </motion.div>
      )}

      {details.similar?.results && details.similar.results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative px-4 md:px-0"
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="px-4 md:px-8 py-6 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-xl border border-accent/30">
                <Flame className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Similar Titles</h2>
              <span className="text-white/40 ml-auto font-mono text-sm">{details.similar.results.length} Items</span>
            </div>
            <div className="p-4 md:p-8">
              <SimilarContent items={details.similar.results} mediaType="tv" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Modern Episode Selector Modal – aligned with VideoPlayer style */}
      {isEpisodeSelectorOpen && seasons && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center animate-in fade-in zoom-in duration-300"
          onClick={() => setIsEpisodeSelectorOpen(false)}
        >
          <div
            className="w-full max-w-6xl h-[90vh] md:h-[85vh] bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-8 border-b border-white/10 bg-white/5 gap-4">
              <div className="flex items-center gap-4">
                <List className="w-5 h-5 md:w-6 md:h-6 text-accent" />
                <h2 className="text-white font-bold text-lg md:text-2xl tracking-tight">Episodes</h2>
              </div>
              <div className="flex items-center gap-3 md:gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                  {seasons.map((season) => (
                    <button
                      key={season.season_number}
                      onClick={() => setSelectedSeason(season.season_number)}
                      className={cn(
                        "px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold text-xs md:text-sm transition-all whitespace-nowrap",
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
                  onClick={() => setIsEpisodeSelectorOpen(false)}
                  className="p-2 md:p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all active:scale-95 border border-white/5 hover:border-white/10"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {currentSeasonData?.episodes.map((episode: any) => {
                  const airDate = episode.air_date ? new Date(episode.air_date) : null;
                  const isUpcoming = airDate ? airDate > new Date() : false;
                  const formattedDate = airDate
                    ? airDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: airDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                      })
                    : 'TBA';

                  const historyItem = watchHistory.find(
                    h =>
                      h.id === Number(id) &&
                      h.mediaType === 'tv' &&
                      h.season === selectedSeason &&
                      h.episode === episode.episode_number
                  );

                  const watchedProgress = historyItem?.progress
                    ? (historyItem.progress.watched / historyItem.progress.duration) * 100
                    : 0;
                  const isCompleted = historyItem?.isCompleted;

                  const isCurrentEpisode =
                    Number(season) === selectedSeason && Number(episode.episode_number) === Number(episode);

                  return (
                    <button
                      key={episode.episode_number}
                      disabled={isUpcoming}
                      onClick={() => {
                        navigate(`/watch/tv/${id}?season=${selectedSeason}&episode=${episode.episode_number}`);
                        setIsEpisodeSelectorOpen(false);
                      }}
                      className={cn(
                        "group flex flex-col gap-3 p-3 rounded-2xl transition-all text-left border relative overflow-hidden",
                        isCurrentEpisode
                          ? "bg-accent/10 border-accent/40 ring-1 ring-accent/20"
                          : "bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/10",
                        isUpcoming && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="w-full aspect-video bg-white/5 rounded-xl overflow-hidden relative flex-shrink-0 shadow-lg transition-transform">
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

                        <div className="absolute bottom-2 left-2">
                          {episode.runtime && (
                            <div className="px-2 py-1 bg-black/80 backdrop-blur-md text-white rounded-lg text-[10px] font-bold uppercase tracking-wider">
                              {episode.runtime}m
                            </div>
                          )}
                        </div>

                        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                          {isCompleted ? (
                            <div className="px-2 py-1 bg-green-500/80 backdrop-blur-md text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              Watched
                            </div>
                          ) : historyItem?.progress && (
                            <div className="px-2 py-1 bg-accent/80 backdrop-blur-md text-white rounded-lg text-[10px] font-bold uppercase tracking-wider">
                              {Math.max(1, Math.floor((historyItem.progress.duration - historyItem.progress.watched) / 60))}m left
                            </div>
                          )}
                        </div>

                        {isCurrentEpisode && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-accent text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-lg animate-pulse">
                            Watching
                          </div>
                        )}

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
                        <h3
                          className={cn(
                            "text-sm font-bold leading-tight line-clamp-1 mb-1",
                            isCurrentEpisode ? "text-accent" : "text-white"
                          )}
                        >
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

            {/* Bottom controls section – like in VideoPlayer */}
            <div className="p-4 md:p-6 border-t border-white/10 bg-white/5 flex items-center justify-end gap-3">
              {/* Resume button – styled like Next Episode from VideoPlayer */}
              {resumeInfo && !resumeInfo.isCompleted && (
                <button
                  onClick={() => {
                    navigate(`/watch/tv/${id}?season=${resumeInfo.season}&episode=${resumeInfo.episode}`);
                    setIsEpisodeSelectorOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 px-5 bg-accent hover:bg-accent/90 text-white rounded-xl shadow-lg shadow-accent/20 transition-all text-sm font-bold active:scale-95"
                >
                  <SkipForward className="w-4 h-4 fill-current" />
                  Resume S{resumeInfo.season}:E{resumeInfo.episode}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TVDetails;
