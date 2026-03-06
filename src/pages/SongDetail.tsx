import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Tag, Check } from "lucide-react";
import { motion } from "framer-motion";
import AudioPlayer from "@/components/AudioPlayer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { songsAPI, Song, purchasesAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const SongDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['song', id],
    queryFn: () => songsAPI.getSong(id!),
    enabled: !!id,
  });

  const song: Song | undefined = data?.song;

  const purchaseMutation = useMutation({
    mutationFn: () => purchasesAPI.createPurchase({ songIds: [id!], paymentMethod: 'card' }),
    onSuccess: () => {
      toast({ title: 'Purchased!', description: 'You now own this song.' });
      queryClient.invalidateQueries({ queryKey: ['song', id] });
      queryClient.invalidateQueries({ queryKey: ['purchased-songs'] });
    },
    onError: (err: any) => {
      toast({ title: 'Purchase failed', description: err.response?.data?.message || 'Try again', variant: 'destructive' });
    },
  });

  const formatPrice = (price: number) => `₹${price.toLocaleString("en-IN")}`;

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-muted-foreground">Song not found.</p>
      </div>
    );
  }

  const isPurchased = song.soldTo?.includes(user?.id || '');

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
          className="max-w-2xl"
        >
          {/* Details */}
          <div className="flex flex-col">
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
                songId={song._id}
                isPreview={!isPurchased}
                maxDuration={isPurchased ? song.duration : 60}
              />

              <div className="flex items-center justify-between mt-6">
                <span className="font-display text-3xl font-bold text-foreground">
                  {formatPrice(song.price)}
                </span>
                <button
                  onClick={() => {
                    if (!user) {
                      toast({ title: 'Please login', description: 'You need to be logged in to purchase.', variant: 'destructive' });
                      return;
                    }
                    if (isPurchased) return;
                    purchaseMutation.mutate();
                  }}
                  disabled={purchaseMutation.isPending || isPurchased}
                  className="px-6 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all glow-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchaseMutation.isPending ? (
                    <div className="w-4 h-4 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : isPurchased ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <ShoppingCart className="w-5 h-5" />
                  )}
                  {isPurchased ? 'Owned' : 'Buy Now'}
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
