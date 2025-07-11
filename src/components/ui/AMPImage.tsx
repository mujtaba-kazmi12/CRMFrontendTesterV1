interface AMPImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  layout?: 'responsive' | 'fixed' | 'fill' | 'fixed-height' | 'flex-item' | 'intrinsic';
  className?: string;
  fallback?: string;
  priority?: boolean;
}

export function AMPImage({ 
  src, 
  alt, 
  width, 
  height, 
  layout = 'responsive',
  className = '',
  fallback,
  priority = false
}: AMPImageProps) {
  // Clean up src URL
  const cleanSrc = src.startsWith('http') ? src : `https://handicap-internatioanl.fr${src.startsWith('/') ? '' : '/'}${src}`;
  
  const imageProps = {
    src: cleanSrc,
    alt,
    width: width.toString(),
    height: height.toString(),
    layout,
    className,
    ...(priority && { 'data-priority': 'true' })
  };

  if (fallback) {
    return (
      <amp-img {...imageProps}>
        <amp-img 
          fallback="" 
          src={fallback}
          alt={alt}
          width={width.toString()}
          height={height.toString()}
          layout={layout}
        />
      </amp-img>
    );
  }

  return <amp-img {...imageProps} />;
}

export default AMPImage;