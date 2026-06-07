"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
  alt: string | null;
  caption: string | null;
}

export function GalerieGrid({ images }: { images: GalleryImage[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const prev = () => setLightbox((i) => (i !== null ? (i - 1 + images.length) % images.length : null));
  const next = () => setLightbox((i) => (i !== null ? (i + 1) % images.length : null));

  return (
    <>
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
        {images.map((img, idx) => (
          <div
            key={img.id}
            className="break-inside-avoid cursor-pointer rounded-xl overflow-hidden group relative"
            onClick={() => setLightbox(idx)}
          >
            <div className="relative aspect-square sm:aspect-auto">
              <Image
                src={img.url}
                alt={img.alt ?? "Création Artisanat Cases"}
                width={400}
                height={400}
                className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {img.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs">{img.caption}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightbox(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <button
            className="absolute left-4 text-white/80 hover:text-white"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <button
            className="absolute right-4 text-white/80 hover:text-white"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            <ChevronRight className="w-10 h-10" />
          </button>
          <div className="max-w-4xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[lightbox].url}
              alt={images[lightbox].alt ?? ""}
              width={1200}
              height={900}
              className="max-h-[80vh] w-auto object-contain rounded-lg"
            />
            {images[lightbox].caption && (
              <p className="text-white/70 text-sm text-center mt-2">{images[lightbox].caption}</p>
            )}
          </div>
          <p className="absolute bottom-4 text-white/40 text-sm">
            {lightbox + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}
