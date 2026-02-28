import React, { useRef, useState, useEffect } from 'react';
import { Play, ChevronLeft, ChevronRight, Video as VideoIcon, PlayCircle, ExternalLink, Youtube } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  thumbnail?: string;
}

interface RelatedVideosProps {
  videos: Video[];
}

const RelatedVideos: React.FC<RelatedVideosProps> = ({ videos }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const checkScroll = () => {
      if (!containerRef.current) return;
      
      setShowLeftArrow(containerRef.current.scrollLeft > 0);
      setShowRightArrow(
        containerRef.current.scrollLeft < 
        containerRef.current.scrollWidth - containerRef.current.clientWidth - 10
      );
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll, { passive: true });
      checkScroll();
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
    };
  }, [videos]);

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    
    const scrollAmount = containerRef.current.clientWidth * 0.8;
    const newScrollLeft = direction === 'left' 
      ? containerRef.current.scrollLeft - scrollAmount 
      : containerRef.current.scrollLeft + scrollAmount;
    
    containerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  // Drag to scroll
  const startDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (containerRef.current?.offsetLeft || 0));
    setScrollLeft(containerRef.current?.scrollLeft || 0);
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  const onDrag = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    
    const x = e.pageX - (containerRef.current.offsetLeft || 0);
    const walk = (x - startX) * 2;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  if (!videos || videos.length === 0) {
    return null;
  }

  // Sort videos to prioritize trailers
  const sortedVideos = [...videos].sort((a, b) => {
    if (a.type === 'Trailer' && b.type !== 'Trailer') return -1;
    if (a.type !== 'Trailer' && b.type === 'Trailer') return 1;
    return 0;
  });

  return (
    <div className="relative group/container">
      {/* Navigation Arrows with glassy style */}
      <AnimatePresence>
        {showLeftArrow && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scroll('left')}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 w-12 h-12 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white flex items-center justify-center transition-all hover:bg-accent/80 hover:border-accent hover:scale-110 shadow-2xl"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showRightArrow && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scroll('right')}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 w-12 h-12 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white flex items-center justify-center transition-all hover:bg-accent/80 hover:border-accent hover:scale-110 shadow-2xl"
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Scrollable Container */}
      <div 
        ref={containerRef}
        className="overflow-x-auto scrollbar-none px-2 py-4"
        onMouseDown={startDrag}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onMouseMove={onDrag}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="flex gap-6">
          {sortedVideos.map((video, index) => (
            <motion.a
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              href={`https://www.youtube.com/watch?v=${video.key}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group flex-shrink-0 w-[300px] flex flex-col gap-3 p-3 rounded-2xl transition-all text-left border relative overflow-hidden",
                "bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/10 active:scale-95"
              )}
              onClick={(e) => {
                if (isDragging) {
                  e.preventDefault();
                }
              }}
            >
              {/* Thumbnail Area - from EpisodeSelector Grid */}
              <div className="w-full aspect-video bg-white/5 rounded-xl overflow-hidden relative flex-shrink-0 shadow-lg group-hover:scale-[1.02] transition-transform duration-500">
                <img
                  src={`https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`}
                  alt={video.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => {
                    // Fallback to lower quality if maxres doesn't exist
                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.key}/mqdefault.jpg`;
                  }}
                />
                
                {/* Overlay with Better Icons */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500" />
                
                {/* Play Icon - from EpisodeSelector style */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shadow-2xl border border-white/20 transform scale-75 group-hover:scale-100 transition-transform duration-500">
                    <Youtube className="w-6 h-6 text-white fill-current" />
                  </div>
                </div>

                {/* Tags - from EpisodeSelector style */}
                <div className="absolute bottom-2 left-2">
                  <div className={cn(
                    "px-2 py-1 backdrop-blur-md text-white rounded-lg text-[10px] font-bold uppercase tracking-wider border border-white/10",
                    video.type === 'Trailer' ? "bg-red-600/80" : "bg-black/60"
                  )}>
                    {video.type}
                  </div>
                </div>

                <div className="absolute top-2 right-2">
                  <div className="p-1.5 bg-black/60 backdrop-blur-md text-white rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Info Area */}
              <div className="px-1 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {video.type === 'Trailer' ? (
                    <PlayCircle className="w-4 h-4 text-accent" />
                  ) : (
                    <VideoIcon className="w-4 h-4 text-white/40" />
                  )}
                  <h4 className="font-bold text-sm leading-tight text-white line-clamp-1 group-hover:text-accent transition-colors">
                    {video.name}
                  </h4>
                </div>
                <div className="flex items-center justify-between text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
                  <span>{video.site}</span>
                  {video.official && (
                    <span className="text-green-400">Official</span>
                  )}
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RelatedVideos;
