'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, ImageIcon, FolderIcon, FileTextIcon } from 'lucide-react';
import { api } from '@/lib/api';

interface Post {
  _id: string;
  title: string;
  slug: string;
  content: string;
  createdAt: string;
  categoryIds: Array<{ name: string; slug: string }>;
  status: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  parentId: string | null;
  createdAt: string;
}

export default function SitemapPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [postsData, categoriesData] = await Promise.all([
          api.get('/posts'),
          api.get('/categories')
        ]);
        
        // Filter only published posts
        setPosts(postsData.filter((post: Post) => post.status === 'published'));
        setCategories(categoriesData);
      } catch (err) {
        setError('Failed to load sitemap data');
        console.error('Error fetching sitemap data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to count images in post content
  const countImages = (content: string): number => {
    if (!content) return 0;
    const imgMatches = content.match(/<img[^>]*>/gi);
    return imgMatches ? imgMatches.length : 0;
  };

  // Function to get category hierarchy
  const getCategoryHierarchy = () => {
    const parentCategories = categories.filter(cat => !cat.parentId);
    const subcategories = categories.filter(cat => cat.parentId);
    
    return parentCategories.map(parent => ({
      ...parent,
      subcategories: subcategories.filter(sub => sub.parentId === parent._id)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading sitemap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const categoryHierarchy = getCategoryHierarchy();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Site Map
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Explore our complete content structure including all articles and categories
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Posts Section */}
          <Card className="h-fit">
            <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <FileTextIcon className="h-5 w-5" />
                All Articles ({posts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {posts.map((post, index) => (
                  <div
                    key={post._id}
                    className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/${post.slug}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium line-clamp-2 mb-2 block"
                        >
                          {post.title}
                        </Link>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {new Date(post.createdAt).toLocaleDateString()}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <ImageIcon className="h-4 w-4" />
                            {countImages(post.content)} images
                          </div>
                        </div>

                        {post.categoryIds && post.categoryIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {post.categoryIds.map((category, catIndex) => (
                              <Badge
                                key={catIndex}
                                variant="secondary"
                                className="text-xs"
                              >
                                {category.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                        #{index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Categories Section */}
          <Card className="h-fit">
            <CardHeader className="bg-green-50 dark:bg-green-900/20">
              <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <FolderIcon className="h-5 w-5" />
                Categories & Structure ({categories.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {categoryHierarchy.map((category) => (
                  <div key={category._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Link
                        href={`/${category.slug}`}
                        className="text-lg font-semibold text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                      >
                        {category.name}
                      </Link>
                      <Badge variant="outline" className="text-xs">
                        Parent Category
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <CalendarIcon className="h-4 w-4 inline mr-1" />
                      Created: {new Date(category.createdAt).toLocaleDateString()}
                    </div>

                    {category.subcategories.length > 0 && (
                      <div className="ml-4 space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Subcategories ({category.subcategories.length}):
                        </h4>
                        {category.subcategories.map((subcategory) => (
                          <div
                            key={subcategory._id}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                          >
                            <Link
                              href={`/${category.slug}/${subcategory.slug}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                            >
                              {subcategory.name}
                            </Link>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {new Date(subcategory.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Standalone categories (no parent) that aren't already shown */}
                {categories.filter(cat => !cat.parentId && !categoryHierarchy.find(h => h._id === cat._id)).map((category) => (
                  <div key={category._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/${category.slug}`}
                        className="text-lg font-semibold text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                      >
                        {category.name}
                      </Link>
                      <Badge variant="outline" className="text-xs">
                        Category
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      <CalendarIcon className="h-4 w-4 inline mr-1" />
                      Created: {new Date(category.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {posts.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total Articles</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {categories.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total Categories</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {posts.reduce((total, post) => total + countImages(post.content), 0)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total Images</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 