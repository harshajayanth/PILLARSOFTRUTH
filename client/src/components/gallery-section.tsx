import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { GalleryItem } from "@shared/schema";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function GallerySection() {
  const {
    data: galleryItems = [],
    isLoading,
    error,
  } = useQuery<GalleryItem[]>({
    queryKey: ["/api/gallery"],
    queryFn: async () => {
      const res = await fetch("/api/gallery");
      if (!res.ok) throw new Error("Failed to fetch gallery");
      return res.json();
    },
  });

  return (
    <section id="gallery" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Community Gallery
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center text-red-600">
            Failed to load gallery images. Please try again later.
          </div>
        ) : (
          <>
            <motion.div
              className="flex gap-4 overflow-x-auto pb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {galleryItems?.map((item: GalleryItem) => (
                <div
                  key={item.id}
                  className="min-w-[300px] flex-shrink-0 rounded-xl overflow-hidden shadow-md"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    onError={(e) => {
                      e.currentTarget.src = "/images/placeholder.png"; // fallback image
                    }}
                    className="w-full h-64 object-cover"
                  />
                </div>
              ))}
            </motion.div>

            {(!galleryItems || galleryItems.length === 0) && !isLoading && (
              <div className="text-center text-gray-600">
                No gallery images available at the moment.
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
