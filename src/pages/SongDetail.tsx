import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Tag, Check } from "lucide-react";
import { motion } from "framer-motion";
import AudioPlayer from "@/components/AudioPlayer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { songsAPI, Song, paymentsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const SongDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data, isLoading, error } = useQuery({
    queryKey: ['song', id],
    queryFn: () => songsAPI.getSong(id!),
    enabled: !!id,
  });

  const song: Song | undefined = data?.song;

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      // Create Razorpay order
      const orderData = await paymentsAPI.createOrder([id!]);

      // Initialize Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'Harmony Hub',
        description: `Purchase: ${song?.title} by ${song?.artist}`,
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            await paymentsAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              purchaseId: orderData.purchaseId,
            });

            toast({
              title: t('payment.success'),
              description: t('song.owned')
            });

            // Refresh data
            queryClient.invalidateQueries({ queryKey: ['song', id] });
            queryClient.invalidateQueries({ queryKey: ['purchased-songs'] });
          } catch (error: any) {
            toast({
              title: t('payment.verificationFailed'),
              description: error.response?.data?.message || t('common.error'),
              variant: 'destructive'
            });
          }
        },
        prefill: {
          email: user?.email,
          name: user?.name,
        },
        theme: {
          color: '#7c3aed', // Purple theme
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    },
    onError: (err: any) => {
      toast({
        title: t('payment.failed'),
        description: err.response?.data?.message || t('common.error'),
        variant: 'destructive'
      });
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
        <p className="text-muted-foreground">{t('song.songNotFound')}</p>
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
          {t('song.backToMarketplace')}
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
                      toast({ title: t('auth.login'), description: t('song.purchaseToListen'), variant: 'destructive' });
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
                  {isPurchased ? t('song.owned') : t('song.buyNow')}
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
