'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ObraMediaAsset } from '@/types/obra';

interface ObraPhotoGalleryProps {
  mediaAssets: ObraMediaAsset[];
}

function isImage(asset: ObraMediaAsset): boolean {
  if (asset.content_type && asset.content_type.startsWith('image/')) {
    return true;
  }
  if (asset.url) {
    const ext = asset.url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext ?? '');
  }
  return false;
}

export default function ObraPhotoGallery({ mediaAssets }: ObraPhotoGalleryProps) {
  const images = useMemo(() => mediaAssets.filter(isImage), [mediaAssets]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeLightbox();
      } else if (event.key === 'ArrowLeft') {
        goPrev();
      } else if (event.key === 'ArrowRight') {
        goNext();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, closeLightbox, goPrev, goNext]);

  if (images.length === 0) {
    return (
      <div className="rounded-3xl bg-surface-container-lowest p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-xl font-bold text-primary">Galeria de Fotos</h2>
          <span className="text-sm text-on-surface-variant">0 imagens</span>
        </div>
        <div className="mt-4 flex h-40 items-center justify-center rounded-2xl bg-surface-container-low text-sm text-on-surface-variant">
          Nenhuma foto disponível
        </div>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className="rounded-3xl bg-surface-container-lowest p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-xl font-bold text-primary">Galeria de Fotos</h2>
        <span className="text-sm text-on-surface-variant">
          {images.length} {images.length === 1 ? 'imagem' : 'imagens'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        {images.map((asset, index) => (
          <button
            key={asset.id ?? `img-${index}`}
            type="button"
            onClick={() => openLightbox(index)}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.url ?? ''}
              alt={asset.titulo ?? `Foto ${index + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {lightboxOpen && currentImage && (
        <div
          className="fixed inset-0 z-80 flex items-center justify-center backdrop-blur-2xl bg-inverse-surface/80 animate-fade-in"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-inverse-surface text-inverse-on-surface transition-colors hover:bg-inverse-on-surface hover:text-inverse-surface focus:outline-none focus:ring-2 focus:ring-inverse-primary"
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-inverse-surface text-inverse-on-surface transition-colors hover:bg-inverse-on-surface hover:text-inverse-surface focus:outline-none focus:ring-2 focus:ring-inverse-primary"
                aria-label="Anterior"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-inverse-surface text-inverse-on-surface transition-colors hover:bg-inverse-on-surface hover:text-inverse-surface focus:outline-none focus:ring-2 focus:ring-inverse-primary"
                aria-label="Próxima"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </>
          )}

          <div
            className="mx-4 max-h-[85vh] max-w-4xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage.url ?? ''}
              alt={currentImage.titulo ?? `Foto ${currentIndex + 1}`}
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-ambient-lg"
            />
            {currentImage.titulo && (
              <p className="mt-3 text-center font-body text-sm text-inverse-on-surface">
                {currentImage.titulo}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
