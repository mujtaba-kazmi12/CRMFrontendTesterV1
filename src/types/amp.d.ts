declare namespace JSX {
  interface IntrinsicElements {
    'amp-img': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src: string;
        alt: string;
        width: string;
        height: string;
        layout?: 'responsive' | 'fixed' | 'fill' | 'fixed-height' | 'flex-item' | 'intrinsic';
        fallback?: string;
        'data-priority'?: string;
      },
      HTMLElement
    >;
    'amp-sidebar': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        layout?: string;
        side?: 'left' | 'right';
      },
      HTMLElement
    >;
  }
}