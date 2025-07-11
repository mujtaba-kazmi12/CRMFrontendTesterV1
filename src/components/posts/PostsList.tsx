'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { 
  FileText, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  FileX,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import { Post, Category } from '../../types/post';
import { api } from '../../lib/api';
import { toast } from '../../hooks/use-toast';
import { cn } from '../../lib/utils';

export function PostsList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [postsWithBrokenImages, setPostsWithBrokenImages] = useState<Set<string>>(new Set());
  const [imageFilter, setImageFilter] = useState<'all' | 'red' | 'blue'>('all');
  
  // Function to check if an image URL is accessible
  const checkImageUrl = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      // Set a timeout to avoid hanging on slow/unresponsive URLs
      setTimeout(() => resolve(false), 5000);
    });
  };

  // Function to validate all images for a post
  const validatePostImages = async (post: Post): Promise<boolean> => {
    if (!post.image_urls || post.image_urls.length === 0) {
      return true; // No images to validate
    }

    const imageChecks = await Promise.all(
      post.image_urls.map(url => checkImageUrl(url))
    );

    // Return true if all images are valid, false if any are broken
    return imageChecks.every(isValid => isValid);
  };

  // Validate images for all posts
  useEffect(() => {
    const validateAllImages = async () => {
      if (posts.length === 0) return;

      const brokenImagePosts = new Set<string>();

      for (const post of posts) {
        const hasValidImages = await validatePostImages(post);
        if (!hasValidImages) {
          brokenImagePosts.add(post._id || post.id);
        }
      }

      setPostsWithBrokenImages(brokenImagePosts);
    };

    validateAllImages();
  }, [posts]);
  
  // Load posts and categories on component mount
  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('crm_token');
      setLoading(true);
      setError(null);
      try {
        const [postsData, categoriesData] = await Promise.all([
          api.get('/posts', token || undefined),
          api.get('/categories', token || undefined),
        ]);
        console.log('Loaded posts:', postsData);
        console.log('Loaded categories:', categoriesData);
        setPosts(postsData);
        setCategories(categoriesData);
      } catch (err) {
        setError('Échec du chargement des articles ou des catégories');
        console.error('Error loading posts or categories:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);
  
  // Filter posts based on search query and image filter
  const filteredPosts = posts.filter(post => {
    // Search filter
    const matchesSearch = (post.title && post.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.content && post.content.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Image filter
    const hasNoImages = !post.image_urls || post.image_urls.length === 0;
    
    let matchesImageFilter = true;
    if (imageFilter === 'red') {
      matchesImageFilter = hasNoImages;
    }
    
    return matchesSearch && matchesImageFilter;
  });
  console.log('Filtered posts:', filteredPosts);

  // Calculate counts for each filter
  const allPostsCount = posts.filter(post => 
    (post.title && post.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (post.content && post.content.toLowerCase().includes(searchQuery.toLowerCase()))
  ).length;
  
  const redPostsCount = posts.filter(post => {
    const matchesSearch = (post.title && post.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.content && post.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const hasNoImages = !post.image_urls || post.image_urls.length === 0;
    return matchesSearch && hasNoImages;
  }).length;
  
  const bluePostsCount = posts.filter(post => {
    const matchesSearch = (post.title && post.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.content && post.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const postId = post._id || post.id;
    const hasNoImages = !post.image_urls || post.image_urls.length === 0;
    const hasBrokenImages = postsWithBrokenImages.has(postId);
    return matchesSearch && hasBrokenImages && !hasNoImages;
  }).length;

  // Pagination calculations
  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, endIndex);

  // Reset to first page when search changes, items per page changes, or image filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage, imageFilter]);

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
  };
  
  // Handle individual post selection
  const handlePostSelect = (postId: string, checked: boolean) => {
    if (checked) {
      setSelectedPosts(prev => [...prev, postId]);
    } else {
      setSelectedPosts(prev => prev.filter(id => id !== postId));
    }
  };

  // Handle select all posts on current page
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentPageIds = currentPosts.map(post => post._id || post.id);
      setSelectedPosts([...selectedPosts.filter(id => !currentPageIds.includes(id)), ...currentPageIds]);
    } else {
      const currentPageIds = currentPosts.map(post => post._id || post.id);
      setSelectedPosts(selectedPosts.filter(id => !currentPageIds.includes(id)));
    }
  };

  // Check if all current page posts are selected
  const isAllSelected = currentPosts.length > 0 && currentPosts.every(post => selectedPosts.includes(post._id || post.id));

  // Pagination handlers
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };
  
  // Open delete modal
  const openDeleteModal = (id: string) => {
    setPostToDelete(id);
    setDeleteModalOpen(true);
  };

  // Handle post deletion
  const handleDelete = async () => {
    if (!postToDelete) return;
    const token = localStorage.getItem('crm_token');
    try {
      // Find the post to delete to get its slug
      const post = posts.find(p => (p._id || p.id) === postToDelete);
      await api.delete(`/posts/${postToDelete}`, token || undefined);
      setPosts(posts.filter(post => (post._id || post.id) !== postToDelete));
      setDeleteModalOpen(false);
      setPostToDelete(null);
      // Notify Google and Bing Indexing APIs
      if (post) {
        const postUrl = `https://handicap-internatioanl.fr/posts/${post.slug}`;
        try {
          await fetch('/api/notify-indexing', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ url: postUrl, type: 'URL_DELETED' }),
          });
        } catch (err) {
          console.error('Failed to notify Google Indexing API:', err);
        }
        try {
          await fetch('/api/notify-bing-indexing', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ url: postUrl }),
          });
        } catch (err) {
          console.error('Failed to notify Bing Indexing API:', err);
        }
      }
      toast({
        title: "Succès",
        description: "Article supprimé avec succès",
      });
    } catch (err) {
      console.error('Error deleting post:', err);
      toast({
        title: "Erreur",
        description: "Échec de la suppression de l'article",
        variant: "destructive",
      });
    }
  };

  // Open bulk delete modal
  const openBulkDeleteModal = () => {
    if (selectedPosts.length === 0) return;
    setBulkDeleteModalOpen(true);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedPosts.length === 0) return;
    const token = localStorage.getItem('crm_token');
    setBulkActionLoading(true);
    try {
      // Find the posts to delete to get their slugs
      const postsToDelete = posts.filter(post => selectedPosts.includes(post._id || post.id));
      // Delete posts in parallel
      await Promise.all(
        selectedPosts.map(postId => api.delete(`/posts/${postId}`, token || undefined))
      );
      // Notify Google and Bing Indexing APIs for each deleted post
      await Promise.all(
        postsToDelete.map(async (post) => {
          const postUrl = `https://handicap-internatioanl.fr/posts/${post.slug}`;
          try {
            await fetch('/api/notify-indexing', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ url: postUrl, type: 'URL_DELETED' }),
            });
          } catch (err) {
            console.error('Failed to notify Google Indexing API:', err);
          }
          try {
            await fetch('/api/notify-bing-indexing', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ url: postUrl }),
            });
          } catch (err) {
            console.error('Failed to notify Bing Indexing API:', err);
          }
        })
      );
      // Update local state
      setPosts(posts.filter(post => !selectedPosts.includes(post._id || post.id)));
      setSelectedPosts([]);
      setBulkDeleteModalOpen(false);

      toast({
        title: "Succès",
        description: `${selectedPosts.length} article${selectedPosts.length > 1 ? 's' : ''} supprimé${selectedPosts.length > 1 ? 's' : ''} avec succès`,
      });
    } catch (err) {
      console.error('Error bulk deleting posts:', err);
      toast({
        title: "Erreur",
        description: "Échec de la suppression en lot",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (newStatus: 'published' | 'draft') => {
    if (selectedPosts.length === 0) return;
    const token = localStorage.getItem('crm_token');
    setBulkActionLoading(true);
    try {
      // Get current posts data for selected posts
      const selectedPostsData = posts.filter(post => selectedPosts.includes(post._id || post.id));

      // Update posts in parallel
      await Promise.all(
        selectedPostsData.map(post => 
          api.put(`/posts/${post._id || post.id}`, {
            ...post,
            status: newStatus
          }, token || undefined)
        )
      );

      // Update local state
      setPosts(posts.map(post => 
        selectedPosts.includes(post._id || post.id)
          ? { ...post, status: newStatus }
          : post
      ));
      setSelectedPosts([]);

      toast({
        title: "Succès",
        description: `${selectedPosts.length} article${selectedPosts.length > 1 ? 's' : ''} ${newStatus === 'published' ? 'publié' : 'mis en brouillon'}${selectedPosts.length > 1 ? 's' : ''} avec succès`,
      });
    } catch (err) {
      console.error('Error updating posts status:', err);
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour du statut en lot",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (id: string, newStatus: 'published' | 'draft') => {
    setUpdatingStatus(id);
    try {
      // Get the current post data
      const currentPost = posts.find(post => (post._id || post.id) === id);
      if (!currentPost) {
        throw new Error('Post not found');
      }

      // Get token before usage
      const token = localStorage.getItem('crm_token');

      // Update the post with new status
      const updatedPost = await api.put(`/posts/${id}`, {
        ...currentPost,
        status: newStatus
      }, token || undefined);

      // Notify Google and Bing Indexing APIs for edit
      const postUrl = `https://handicap-internatioanl.fr/posts/${currentPost.slug}`;
      try {
        await fetch('/api/notify-indexing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ url: postUrl, type: 'URL_UPDATED' }),
        });
      } catch (err) {
        console.error('Failed to notify Google Indexing API:', err);
      }
      try {
        await fetch('/api/notify-bing-indexing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ url: postUrl }),
        });
      } catch (err) {
        console.error('Failed to notify Bing Indexing API:', err);
      }

      // Update the posts state
      setPosts(posts.map(post => 
        (post._id || post.id) === id 
          ? { ...post, status: newStatus }
          : post
      ));

      toast({
        title: "Succès",
        description: `Article ${newStatus === 'published' ? 'publié' : 'mis en brouillon'} avec succès`,
      });
    } catch (err) {
      console.error('Error updating post status:', err);
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour du statut",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper to get category names for a post
  const getCategoryNames = (categoryIds: any[]) => {
    // categoryIds may be array of strings or objects
    return categoryIds.map(cat => {
      if (typeof cat === 'string') {
        const found = categories.find(c => c._id === cat);
        return found ? found.name : cat;
      } else if (cat && cat._id) {
        return cat.name;
      }
      return '';
    }).filter(Boolean);
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }
  
  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
      
        <Button asChild>
          <Link href="/dashboard/posts/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouvel Article
          </Link>
        </Button>
      </div>

      {/* Search and bulk actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          {/* Image Filters */}
          <TooltipProvider>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Filtres d'images:</span>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
            <Button
                      variant={imageFilter === 'all' ? 'default' : 'outline'}
              size="sm"
                      onClick={() => setImageFilter('all')}
                      className="h-8"
            >
                      Tous ({allPostsCount})
            </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Afficher tous les articles</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
            <Button
                      variant={imageFilter === 'red' ? 'default' : 'outline'}
              size="sm"
                      onClick={() => setImageFilter('red')}
                      className={cn(
                        "h-8",
                        imageFilter === 'red' 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'border-red-300 text-red-600 hover:bg-red-50'
                      )}
            >
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      Rouge ({redPostsCount})
            </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Articles sans images disponibles</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
            <Button
                      variant={imageFilter === 'blue' ? 'default' : 'outline'}
              size="sm"
                      onClick={() => setImageFilter('blue')}
                      className={cn(
                        "h-8",
                        imageFilter === 'blue' 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'border-blue-300 text-blue-600 hover:bg-blue-50'
                      )}
            >
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      Bleu ({bluePostsCount})
            </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Articles avec images cassées/inaccessibles</p>
                  </TooltipContent>
                </Tooltip>
              </div>
          </div>
          </TooltipProvider>
        </div>
        
        {selectedPosts.length > 0 && (
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={bulkActionLoading}>
                  Actions en lot ({selectedPosts.length})
                  <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate('published')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Publier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate('draft')}>
                  <FileX className="mr-2 h-4 w-4" />
                  Mettre en brouillon
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={openBulkDeleteModal}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          )}
        </div>

      {/* Posts Table */}
      <div className="border rounded-lg">
        {/* Desktop Table View - Hidden on mobile */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Catégories</TableHead>
                <TableHead>Auteur</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun article trouvé</h3>
                    <p className="text-gray-500 mb-4">
                      {searchQuery ? 'Aucun article ne correspond à votre recherche.' : 'Commencez par créer votre premier article.'}
                    </p>
                    {!searchQuery && (
                      <Button asChild>
                        <Link href="/dashboard/posts/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Créer un Article
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                currentPosts.map((post) => (
                  <TableRow
                    key={post._id || post.id}
                    className={cn(
                      // Highlight row in red if no images available
                      (!post.image_urls || post.image_urls.length === 0) &&
                        'bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800'
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedPosts.includes(post._id || post.id)}
                        onCheckedChange={(checked) => 
                          handlePostSelect(post._id || post.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link 
                        href={`/dashboard/posts/${post._id || post.id}`}
                        className="hover:underline"
                      >
                        {post.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                        {post.status === 'published' ? 'Publié' : 'Brouillon'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getCategoryNames(post.categoryIds).map((categoryName, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {categoryName}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{
                      (typeof post.authorId === 'object' && post.authorId !== null && 'name' in post.authorId)
                        ? (post.authorId as { name: string }).name
                        : post.authorId
                    }</TableCell>
                    <TableCell>{formatDate(post.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/posts/${post.slug}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/posts/${post._id || post.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(post._id || post.id, post.status === 'published' ? 'draft' : 'published')}
                            disabled={updatingStatus === (post._id || post.id)}
                          >
                            {post.status === 'published' ? (
                              <>
                                <FileX className="mr-2 h-4 w-4" />
                                Mettre en brouillon
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Publier
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => openDeleteModal(post._id || post.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View - Shown only on mobile */}
        <div className="md:hidden space-y-3 p-4">
          {currentPosts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun article trouvé</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'Aucun article ne correspond à votre recherche.' : 'Commencez par créer votre premier article.'}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/dashboard/posts/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un Article
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            currentPosts.map((post) => (
              <div
                key={post._id || post.id}
                className={cn(
                  "border rounded-lg p-4 bg-white shadow-sm",
                  // Highlight card in red if no images available
                  (!post.image_urls || post.image_urls.length === 0) &&
                    'bg-red-50 border-red-200'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1">
                    <Checkbox
                      checked={selectedPosts.includes(post._id || post.id)}
                      onCheckedChange={(checked) => 
                        handlePostSelect(post._id || post.id, checked as boolean)
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/dashboard/posts/${post._id || post.id}`}
                        className="font-medium text-sm hover:underline block truncate"
                      >
                        {post.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                          {post.status === 'published' ? 'Publié' : 'Brouillon'}
                        </Badge>
                        {(!post.image_urls || post.image_urls.length === 0) && (
                          <div className="w-2 h-2 bg-red-500 rounded-full" title="Aucune image disponible"></div>
                        )}
                      </div>
                    </div>
                  </div>
                                     <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                       <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                         <MoreHorizontal className="h-4 w-4" />
                       </Button>
                     </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/posts/${post.slug}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/posts/${post._id || post.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleStatusUpdate(post._id || post.id, post.status === 'published' ? 'draft' : 'published')}
                        disabled={updatingStatus === (post._id || post.id)}
                      >
                        {post.status === 'published' ? (
                          <>
                            <FileX className="mr-2 h-4 w-4" />
                            Mettre en brouillon
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Publier
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => openDeleteModal(post._id || post.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {getCategoryNames(post.categoryIds).map((categoryName, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {categoryName}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Par: {
                        (typeof post.authorId === 'object' && post.authorId !== null && 'name' in post.authorId)
                          ? (post.authorId as { name: string }).name
                          : post.authorId
                      }
                    </span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Affichage de {startIndex + 1} à {Math.min(endIndex, filteredPosts.length)} sur {filteredPosts.length} articles
                  </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Lignes par page:</span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => handleItemsPerPageChange(parseInt(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="75">75</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
          {totalPages > 1 && (
          <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
              Précédent
                </Button>
                
            {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = i + 1;
                    return (
                      <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                    onClick={() => handlePageClick(pageNumber)}
                    className="w-8 h-8 p-0"
                      >
                    {pageNumber}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
              Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
        )}
            </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement l'article.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Modal */}
      <AlertDialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer les articles sélectionnés ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement {selectedPosts.length} article{selectedPosts.length > 1 ? 's' : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkActionLoading}
            >
              {bulkActionLoading ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
