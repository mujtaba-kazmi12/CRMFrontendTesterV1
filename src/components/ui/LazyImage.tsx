import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  imageUrls?: string[]; // All image URLs to validate
  onLoad?: () => void;
  onError?: () => void;
  width?: number;
  height?: number;
  aspectRatio?: string; // e.g., "16/9", "4/3", "1/1"
  priority?: boolean; // For LCP images - disables lazy loading and enables preloading
}

export function LazyImage({ 
  src, 
  alt, 
  className = '', 
  imageUrls = [],
  onLoad,
  onError,
  width,
  height,
  aspectRatio,
  priority = false
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [allImagesValid, setAllImagesValid] = useState<boolean | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Set up intersection observer for lazy loading (skip if priority)
  useEffect(() => {
    if (priority) {
      // For priority images, immediately set in view
      setIsInView(true);
      return;
    }

    if (!imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority]);

  // Validate all images when in view
  useEffect(() => {
    if (!isInView) return;

    const validateAllImages = async () => {
      // If no imageUrls provided, just validate the single src
      const urlsToValidate = imageUrls.length > 0 ? imageUrls : [src];
      
      try {
        // Check all images
        const imageChecks = await Promise.all(
          urlsToValidate.map(url => {
            return new Promise<boolean>((resolve) => {
              const img = new Image();
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
              img.src = url;
              // 10 second timeout
              setTimeout(() => resolve(false), 10000);
            });
          })
        );

        // ALL images must be valid
        const allValid = imageChecks.every(isValid => isValid);
        setAllImagesValid(allValid);

        if (allValid) {
          // All images are valid, show the first one
          setCurrentSrc(src);
          setIsLoaded(true);
          setHasError(false);
          onLoad?.();
        } else {
          // At least one image is broken, trigger error
          setHasError(true);
          onError?.();
        }
      } catch (error) {
        setHasError(true);
        setAllImagesValid(false);
        onError?.();
      }
    };

    validateAllImages();
  }, [isInView, src, imageUrls, onLoad, onError]);

  // Don't render anything if any image is broken
  if (hasError || allImagesValid === false) {
    return null;
  }

  // Calculate container style for preventing layout shift
  const containerStyle: React.CSSProperties = {};
  if (width && height) {
    containerStyle.width = width;
    containerStyle.height = height;
  } else if (aspectRatio) {
    containerStyle.aspectRatio = aspectRatio;
  }

  return (
    <div 
      className={`relative overflow-hidden ${className}`} 
      ref={imgRef}
      style={containerStyle}
    >
      {/* Skeleton placeholder with fixed dimensions */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700">
          <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse"></div>
        </div>
      )}
      
      {/* Actual image */}
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => {
            setIsLoaded(true);
            onLoad?.();
          }}
          onError={() => {
            setHasError(true);
            onError?.();
          }}
        />
      )}
    </div>
  );
} 