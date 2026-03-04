import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Tag } from "lucide-react";
import { motion } from "framer-motion";
import AudioPlayer from "@/components/AudioPlayer";
import { mockSongs } from "@/lib/mockData";

const SongDetail = () => {
  const { id } = useParams();
  const song = mockSongs.find((s) => s.id === id);

  if (!song) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-muted-foreground">Song not found.</p>
      </div>
    );
  }

  const formatPrice = (price: number) => `₹${price.toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 gap-8"
        >
          {/* Cover */}
          <div className="rounded-2xl overflow-hidden neon-border">
            <img
              src={song.coverImage}
              alt={song.title}
              className="w-full aspect-square object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                {song.title}
              </h1>
              <p className="text-muted-foreground mt-2">{song.artist}</p>

              <div className="flex flex-wrap gap-2 mt-4">
                {song.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20 flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mt-6 text-secondary-foreground leading-relaxed">
                {song.description}
              </p>
            </div>

            <div className="mt-8">
              <AudioPlayer
                title={song.title}
                artist={song.artist}
                coverImage={song.coverImage}
                isPreview
                maxDuration={120}
              />

              <div className="flex items-center justify-between mt-6">
                <span className="font-display text-3xl font-bold text-foreground">
                  {formatPrice(song.price)}
                </span>
                <button className="px-6 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all glow-primary flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SongDetail;
