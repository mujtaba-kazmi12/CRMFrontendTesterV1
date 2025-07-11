import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Handicap International - AMP',
  description: 'Fast mobile experience for Handicap International news and articles',
  other: {
    'format-detection': 'telephone=no',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function AMPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: '1.6',
      color: '#333',
      margin: '0',
      padding: '0',
      background: '#fff',
      minHeight: '100vh'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
          /* AMP Custom Styles */
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background: #fff;
          }
          
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 16px;
          }
          
          /* Header Styles */
          .header {
            background: #fff;
            border-bottom: 1px solid #e5e5e5;
            padding: 16px 0;
            position: sticky;
            top: 0;
            z-index: 100;
          }
          
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .logo {
            font-size: 24px;
            font-weight: 700;
            color: #333;
            text-decoration: none;
          }
          
          .menu-toggle {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            padding: 8px;
          }
          
          /* Navigation Styles */
          .nav-categories {
            background: #f8f9fa;
            padding: 12px 0;
            overflow-x: auto;
            white-space: nowrap;
          }
          
          .nav-list {
            display: flex;
            gap: 8px;
            padding: 0 16px;
          }
          
          .nav-item {
            background: #fff;
            color: #333;
            padding: 8px 16px;
            border-radius: 20px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            border: 1px solid #e5e5e5;
            flex-shrink: 0;
          }
          
          .nav-item.active {
            background: #333;
            color: #fff;
          }
          
          /* Article Grid Styles */
          .articles-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
            padding: 20px 0;
          }
          
          @media (min-width: 768px) {
            .articles-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          
          @media (min-width: 1024px) {
            .articles-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
          
          /* Article Card Styles */
          .article-card {
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e5e5e5;
            transition: box-shadow 0.2s;
          }
          
          .article-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          
          .article-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
          }
          
          .article-content {
            padding: 16px;
          }
          
          .article-title {
            font-size: 18px;
            font-weight: 600;
            line-height: 1.4;
            margin: 0 0 8px 0;
          }
          
          .article-title a {
            color: #333;
            text-decoration: none;
          }
          
          .article-excerpt {
            font-size: 14px;
            color: #666;
            line-height: 1.5;
            margin: 0 0 12px 0;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .article-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #999;
          }
          
          .article-date {
            font-size: 12px;
            color: #999;
          }
          
          .read-more {
            background: #333;
            color: #fff;
            padding: 6px 12px;
            border-radius: 4px;
            text-decoration: none;
            font-size: 12px;
            font-weight: 500;
          }
          
          /* Hero Section */
          .hero-section {
            margin-bottom: 30px;
          }
          
          .hero-card {
            background: #fff;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e5e5e5;
          }
          
          .hero-image {
            width: 100%;
            height: 250px;
            object-fit: cover;
          }
          
          @media (min-width: 768px) {
            .hero-image {
              height: 300px;
            }
          }
          
          .hero-content {
            padding: 20px;
          }
          
          .hero-title {
            font-size: 24px;
            font-weight: 700;
            line-height: 1.3;
            margin: 0 0 12px 0;
          }
          
          .hero-title a {
            color: #333;
            text-decoration: none;
          }
          
          .hero-excerpt {
            font-size: 16px;
            color: #666;
            line-height: 1.6;
            margin: 0 0 16px 0;
          }
          
          /* Badges */
          .badge {
            display: inline-block;
            padding: 4px 8px;
            background: #f0f0f0;
            color: #666;
            font-size: 10px;
            border-radius: 12px;
            margin-right: 4px;
            margin-bottom: 4px;
          }
          
          .badge-tag {
            background: #e3f2fd;
            color: #1976d2;
          }
          
          /* Sidebar */
          .sidebar {
            background: #fff;
            width: 300px;
            height: 100vh;
            position: fixed;
            top: 0;
            left: 0;
            transform: translateX(-100%);
            transition: transform 0.3s;
            z-index: 1000;
            padding: 20px;
            overflow-y: auto;
          }
          
          .sidebar.open {
            transform: translateX(0);
          }
          
          .sidebar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e5e5e5;
          }
          
          .sidebar-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
          }
          
          .sidebar-nav {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          .sidebar-nav li {
            margin-bottom: 8px;
          }
          
          .sidebar-nav a {
            display: block;
            padding: 12px 16px;
            color: #333;
            text-decoration: none;
            border-radius: 6px;
            transition: background-color 0.2s;
          }
          
          .sidebar-nav a:hover {
            background: #f5f5f5;
          }
          
          /* Loading States */
          .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 40px;
            color: #666;
          }
          
          /* Responsive adjustments */
          @media (max-width: 767px) {
            .container {
              padding: 0 12px;
            }
            
            .hero-title {
              font-size: 20px;
            }
            
            .hero-excerpt {
              font-size: 14px;
            }
            
            .article-title {
              font-size: 16px;
            }
          }

          /* Magazine Layout Responsive Styles */
          @media (min-width: 768px) {
            .magazine-hero {
              grid-template-columns: 2fr 1fr !important;
            }
            
            .modern-layout {
              grid-template-columns: repeat(3, 1fr) !important;
            }
            
            .nav-categories {
              overflow-x: visible;
            }
            
            .nav-list {
              justify-content: center;
            }
          }

          /* Badge styles for categories and tags */
          .badge {
            display: inline-block;
            padding: 4px 8px;
            font-size: 10px;
            border-radius: 12px;
            margin-right: 4px;
            margin-bottom: 4px;
            text-decoration: none;
          }
          
          .badge-category {
            background: #f0f0f0;
            color: #666;
            border: 1px solid #e0e0e0;
          }
          
          .badge-tag {
            background: #e3f2fd;
            color: #1976d2;
          }

          /* AMP Carousel custom styles */
          amp-carousel {
            border-radius: 8px;
            overflow: hidden;
          }
          
          amp-carousel .amp-carousel-button {
            background: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            width: 40px;
            height: 40px;
          }

          /* Loading spinner animation */
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          /* Skeleton loading animation */
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          /* Hide scrollbars for navigation */
          .scrollbar-hide {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;  /* Chrome, Safari and Opera */
          }
        `}} />
      {children}
    </div>
  );
}