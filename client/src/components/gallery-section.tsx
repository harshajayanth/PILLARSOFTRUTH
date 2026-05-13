import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { motion } from "framer-motion";

import { GalleryItem } from "@shared/schema";

import LoadingSpinner from "@/components/ui/loading-spinner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { X } from "lucide-react";

export default function GallerySection() {
  const [openGallery, setOpenGallery] =
    useState(false);

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  const {
    data: galleryItems = [],
    isLoading,
    error,
  } = useQuery<GalleryItem[]>({
    queryKey: ["/api/gallery"],

    queryFn: async () => {
      const res = await fetch("/api/gallery");

      if (!res.ok) {
        throw new Error(
          "Failed to fetch gallery"
        );
      }

      return res.json();
    },
  });

  /* -------------------------------------------------------------------------- */
  /* SHOW ONLY FIRST 7 INITIALLY */
  /* -------------------------------------------------------------------------- */

  const previewImages =
    galleryItems.slice(0, 7);

  /* -------------------------------------------------------------------------- */

  return (
    <section
      id="gallery"
      className="py-20 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="text-center mb-12">

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Community Gallery
          </h2>

          <p className="text-gray-600 mt-3">
            Moments from sessions,
            gatherings, and fellowship
          </p>
        </div>

        {/* LOADING */}

        {isLoading ? (
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center text-red-600">
            Failed to load gallery images.
            Please try again later.
          </div>
        ) : (
          <>
            {/* ---------------------------------------------------------------- */}
            {/* PREVIEW GRID */}
            {/* ---------------------------------------------------------------- */}

            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.4,
              }}
            >
              {previewImages.map(
                (
                  item: GalleryItem,
                  index
                ) => (
                  <motion.div
                    key={item.id}
                    whileHover={{
                      scale: 1.02,
                    }}
                    className={`relative overflow-hidden rounded-2xl shadow-md cursor-pointer group ${
                      index === 0
                        ? "col-span-2 row-span-2"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedImage(
                        item.imageUrl
                      );

                      setOpenGallery(true);
                    }}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      onError={(e) => {
                        e.currentTarget.src =
                          "/images/placeholder.png";
                      }}
                      className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                        index === 0
                          ? "h-[420px]"
                          : "h-[200px]"
                      }`}
                    />

                    {/* OVERLAY */}

                    {index === 5 &&
                      galleryItems.length >
                        6 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <p className="text-white text-2xl font-bold">
                            +
                            {galleryItems.length -
                              6}
                          </p>
                        </div>
                      )}
                  </motion.div>
                )
              )}
            </motion.div>

            {/* EMPTY */}

            {galleryItems.length ===
              0 && (
              <div className="text-center text-gray-600 mt-8">
                No gallery images available
                at the moment.
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* GALLERY MODAL */}
            {/* ---------------------------------------------------------------- */}

            <Dialog
              open={openGallery}
              onOpenChange={
                setOpenGallery
              }
            >
              <DialogContent className="max-w-7xl w-full max-h-[90vh] overflow-y-auto">

                <DialogHeader className="mb-4">

                  <div className="flex items-center justify-between">

                    <DialogTitle className="text-2xl font-bold">
                      Community Gallery
                    </DialogTitle>
                  </div>
                </DialogHeader>

                {/* WINDOWS / PINTEREST STYLE GRID */}

                <div
                  className="
                    columns-1
                    sm:columns-2
                    md:columns-3
                    lg:columns-4
                    gap-4
                    space-y-4
                  "
                >
                  {galleryItems.map(
                    (
                      item: GalleryItem
                    ) => (
                      <motion.div
                        key={item.id}
                        whileHover={{
                          scale: 1.02,
                        }}
                        className={`relative overflow-hidden rounded-2xl shadow-lg border cursor-pointer break-inside-avoid mb-4 bg-white ${
                          selectedImage ===
                          item.imageUrl
                            ? "ring-4 ring-primary"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedImage(
                            item.imageUrl
                          )
                        }
                      >
                        <img
                          src={
                            item.imageUrl
                          }
                          alt={item.title}
                          onError={(e) => {
                            e.currentTarget.src =
                              "/images/placeholder.png";
                          }}
                          className="
                            w-full
                            h-auto
                            object-contain
                            transition-transform
                            duration-300
                            hover:scale-[1.01]
                          "
                        />

                        {/* IMAGE TITLE */}

                        {/* <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-3">
                          <p className="text-sm font-medium truncate">
                            {item.title}
                          </p>
                        </div> */}
                      </motion.div>
                    )
                  )}
                </div>

                {/* SELECTED IMAGE PREVIEW */}

                {/* {selectedImage && (
                  <div className="mt-8">

                    <div className="rounded-2xl overflow-hidden border shadow-lg">

                      <img
                        src={
                          selectedImage
                        }
                        alt="Selected"
                        className="w-full max-h-[600px] object-contain bg-black"
                      />
                    </div>
                  </div>
                )} */}
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </section>
  );
}