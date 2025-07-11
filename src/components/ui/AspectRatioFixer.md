# Aspect Ratio Reference for CLS Fix

## Image Size to Aspect Ratio Mapping

### Large Images (Main story, featured)
- `h-80` (320px height) → `aspectRatio="16/9"`
- `h-64` (256px height) → `aspectRatio="16/9"`
- `h-48` (192px height) → `aspectRatio="16/9"`

### Medium Images (Secondary stories)
- `h-40` (160px height) → `aspectRatio="4/3"`

### Small Images (Sidebar, thumbnails)
- `w-20 h-20` (80x80px) → `aspectRatio="1/1"`
- `w-16 h-16` (64x64px) → `aspectRatio="1/1"`

### Search Results
- `h-48` in search results → `aspectRatio="16/9"`

### Carousel Images
- `h-40` in carousel → `aspectRatio="4/3"`

## Files that need updating:
1. ✅ ArticlesSSR.tsx - Updated with AdPlaceholder and aspect ratios
2. ✅ CategoryPageSSR.tsx - Partially updated, needs remaining LazyImage instances
3. ✅ CategoryPage.tsx - Updated with AdPlaceholder
4. ✅ Articles.tsx - Updated with AdPlaceholder
5. ✅ PostViewSSR.tsx - Updated with AdPlaceholder
6. ✅ PostView.tsx - No placeholder images found
7. ✅ LazyImage.tsx - Updated with aspect ratio support
8. ✅ AdPlaceholder.tsx - New component created 