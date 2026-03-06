import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { songsAPI } from "../lib/api";

interface AudioPlayerProps {
  title: string;
  artist: string;
  songId?: string; // Song ID instead of direct src
  src?: string; // actual audio url (for backwards compatibility)
  isPreview?: boolean;
  maxDuration?: number;
}

const AudioPlayer = ({ title, artist, songId, src: directSrc, isPreview = true, maxDuration = 120 }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [src, setSrc] = useState<string>(directSrc || '');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastUpdateRef = useRef(0);
  const isSeeking = useRef(false);
  const blobUrlRef = useRef<string>('');
  const duration = maxDuration;

  // Fetch audio blob and create object URL
  useEffect(() => {
    if (songId) {
      const fetchAudio = async () => {
        try {
          const blob = await songsAPI.getAudioStream(songId);
          // Revoke old blob URL to free memory
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
          }
          // Create new blob URL
          const blobUrl = URL.createObjectURL(blob);
          blobUrlRef.current = blobUrl;
          setSrc(blobUrl);
          console.log('Audio blob loaded:', songId);
        } catch (error) {
          console.error('Failed to load audio:', error);
          setSrc('');
        }
      };

      fetchAudio();
    } else if (directSrc) {
      setSrc(directSrc);
    }

    return () => {
      // Clean up blob URL on unmount
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = '';
      }
    };
  }, [songId, directSrc]);

  // Only update audio currentTime when user manually seeks
  useEffect(() => {
    if (audioRef.current && isSeeking.current) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Don't render if no src
  if (!src) {
    return (
      <div className="glass-strong rounded-2xl p-5">
        <div className="text-center text-muted-foreground">
          <p>Audio not available</p>
          {isPreview && <p className="text-xs mt-2">Purchase this song to listen</p>}
        </div>
      </div>
    );
  }

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Only update display every 100ms, don't reset audio element
  const handleTimeUpdate = () => {
    if (audioRef.current && !isSeeking.current) {
      const now = Date.now();
      if (now - lastUpdateRef.current >= 100) {
        setCurrentTime(audioRef.current.currentTime);
        lastUpdateRef.current = now;
      }
    }
  };

  const progressPercent = (currentTime / duration) * 100;

  return (
    <div className="glass-strong rounded-2xl p-5">
      <audio
        ref={audioRef}
        src={src}
        crossOrigin="anonymous"
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onError={(e) => {
          console.error('Audio loading error:', e);
          const audio = e.currentTarget;
          console.error('Audio error code:', audio.error?.code);
          console.error('Audio error message:', audio.error?.message);
        }}
        onLoadStart={() => console.log('Audio load start')}
        muted={isMuted}
      />

      <div className="flex items-center gap-4">
        {/* Info & Controls */}
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-semibold text-foreground truncate">{title}</h4>
          <p className="text-sm text-muted-foreground">{artist}</p>

          {/* Progress */}
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <div
              className="flex-1 h-1.5 rounded-full bg-muted cursor-pointer relative"
              onClick={(e) => {
                if (!audioRef.current) return;
                isSeeking.current = true;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = x / rect.width;
                const newTime = percent * duration;
                audioRef.current.currentTime = newTime;
                setCurrentTime(newTime);
                setTimeout(() => { isSeeking.current = false; }, 100);
              }}
            >
              <motion.div
                className="h-full rounded-full bg-primary relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary glow-primary" />
              </motion.div>
            </div>
            <span className="text-xs text-muted-foreground w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <SkipBack className="w-5 h-5" />
        </button>
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-all glow-primary"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-primary-foreground" />
          ) : (
            <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
          )}
        </button>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <SkipForward className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors ml-4"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {isPreview && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          Preview limited to {Math.floor(maxDuration / 60)} minutes
        </p>
      )}
    </div>
  );
};

export default AudioPlayer;
