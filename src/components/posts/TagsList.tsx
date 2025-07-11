'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { api } from '../../lib/api';
import { Tag } from '../../types/post';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Plus } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
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
import { toast } from '../../hooks/use-toast';

export function TagsList() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const token = localStorage.getItem('crm_token');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get('/tags', token || undefined);
        setTags(data);
      } catch (err) {
        setError('Failed to load tags');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/tags', { name, slug }, token || undefined);
      setName('');
      setSlug('');
      const data = await api.get('/tags', token || undefined);
      setTags(data);
      toast({
        title: 'Success',
        description: response?.message || 'Tag created successfully!',
        variant: 'default',
      });
    } catch (err: any) {
      let errorMsg = 'An error occurred';
      if (typeof err === 'string') {
        try {
          const parsed = JSON.parse(err);
          errorMsg = parsed.error || parsed.message || err;
        } catch {
          errorMsg = err;
        }
      } else if (err?.error) {
        errorMsg = err.error;
      } else if (err?.message) {
        try {
          const parsed = JSON.parse(err.message);
          errorMsg = parsed.error || parsed.message || err.message;
        } catch {
          errorMsg = err.message;
        }
      }
      setError(errorMsg);
      toast({
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id || tag._id || '');
    setEditName(tag.name);
    setEditSlug(tag.slug);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      const response = await api.put(`/tags/${editingId}`, { name: editName, slug: editSlug }, token || undefined);
      setEditingId(null);
      setEditName('');
      setEditSlug('');
      const data = await api.get('/tags', token || undefined);
      setTags(data);
      toast({
        title: 'Success',
        description: response?.message || 'Tag updated successfully!',
        variant: 'default',
      });
    } catch (err: any) {
      let errorMsg = 'Failed to update tag';
      if (typeof err === 'string') {
        try {
          const parsed = JSON.parse(err);
          errorMsg = parsed.error || parsed.message || err;
        } catch {
          errorMsg = err;
        }
      } else if (err?.error) {
        errorMsg = err.error;
      } else if (err?.message) {
        try {
          const parsed = JSON.parse(err.message);
          errorMsg = parsed.error || parsed.message || err.message;
        } catch {
          errorMsg = err.message;
        }
      }
      setError(errorMsg);
      toast({
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this tag?')) return;
    try {
      await api.delete(`/tags/${id}`, token || undefined);
      setTags(tags.filter(t => (t.id || t._id) !== id));
      toast({
        title: "Success",
        description: "Tag deleted successfully",
      });
    } catch (err) {
      setError('Failed to delete tag');
      toast({
        title: "Error",
        description: "Failed to delete tag",
        variant: "destructive",
      });
    }
  };

  // Handle individual tag selection
  const handleTagSelect = (tagId: string, checked: boolean) => {
    if (checked) {
      setSelectedTags(prev => [...prev, tagId]);
    } else {
      setSelectedTags(prev => prev.filter(id => id !== tagId));
    }
  };

  // Handle select all tags
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTags(tags.map(tag => tag.id || tag._id || ''));
    } else {
      setSelectedTags([]);
    }
  };

  // Check if all tags are selected
  const isAllSelected = tags.length > 0 && selectedTags.length === tags.length;

  // Open bulk delete modal
  const openBulkDeleteModal = () => {
    if (selectedTags.length === 0) return;
    setBulkDeleteModalOpen(true);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedTags.length === 0) return;

    setBulkActionLoading(true);
    try {
      // Delete tags in parallel
      await Promise.all(
        selectedTags.map(tagId => api.delete(`/tags/${tagId}`, token || undefined))
      );

      // Update local state
      setTags(tags.filter(tag => !selectedTags.includes(tag.id || tag._id || '')));
      setSelectedTags([]);
      setBulkDeleteModalOpen(false);

      toast({
        title: "Success",
        description: `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} deleted successfully`,
      });
    } catch (err) {
      console.error('Error deleting tags:', err);
      toast({
        title: "Error",
        description: "Failed to delete some tags",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  return (
    <Card className="w-[90%] mx-auto">
      <CardHeader>
        <CardTitle>Tags</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[80vh] overflow-y-auto">
        {error && <div className="mb-2 text-red-500">{error}</div>}
        
        {/* Add Tag Form - Mobile Responsive */}
        <form onSubmit={handleCreate} className="space-y-3 lg:space-y-0 lg:flex lg:gap-2 lg:items-center p-4 bg-gray-50 rounded-lg mb-4">
          <div className="flex-1 space-y-3 lg:space-y-0 lg:flex lg:gap-2">
            <Input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Tag Name" 
              required 
              className="w-full lg:flex-1"
            />
            <Input 
              value={slug} 
              onChange={e => setSlug(e.target.value)} 
              placeholder="Slug (URL)" 
              required 
              className="w-full lg:flex-1"
            />
          </div>
          <Button type="submit" className="w-full lg:w-auto">
            <Plus size={16} className="mr-2" />Add
          </Button>
        </form>

        {/* Bulk Actions Bar */}
        {selectedTags.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-blue-50 border border-blue-200 rounded-md mb-4 gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-900">
                {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={openBulkDeleteModal}
                disabled={bulkActionLoading}
                className="w-full sm:w-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {bulkActionLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-8">Loading tags...</div>
        ) : tags.length === 0 ? (
          <div className="text-center p-8 border rounded-md">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No tags found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new tag</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden lg:block border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.map(tag => (
                    <TableRow key={tag.id || tag._id}>
                      {editingId === (tag.id || tag._id) ? (
                        <TableCell colSpan={4}>
                          <form onSubmit={handleUpdate} className="flex gap-2 w-full">
                            <Input value={editName} onChange={e => setEditName(e.target.value)} required />
                            <Input value={editSlug} onChange={e => setEditSlug(e.target.value)} required />
                            <Button type="submit" size="sm">Save</Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                          </form>
                        </TableCell>
                      ) : (
                        <>
                          <TableCell className="w-[50px]">
                            <Checkbox
                              checked={selectedTags.includes(tag.id || tag._id || '')}
                              onCheckedChange={(checked) => handleTagSelect(tag.id || tag._id || '', checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>{tag.name}</TableCell>
                          <TableCell>{tag.slug}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(tag)}>
                                  <Edit className="mr-2 h-4 w-4" />Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(tag.id || tag._id || '')}>
                                  <Trash2 className="mr-2 h-4 w-4" />Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View - Shown only on mobile */}
            <div className="lg:hidden space-y-3">
              {tags.map(tag => (
                <div key={tag.id || tag._id} className="border rounded-lg p-4 bg-white shadow-sm">
                  {editingId === (tag.id || tag._id) ? (
                    <form onSubmit={handleUpdate} className="space-y-3">
                      <Input 
                        value={editName} 
                        onChange={e => setEditName(e.target.value)} 
                        required 
                        placeholder="Tag Name"
                        className="w-full"
                      />
                      <Input 
                        value={editSlug} 
                        onChange={e => setEditSlug(e.target.value)} 
                        required 
                        placeholder="Slug"
                        className="w-full"
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" className="flex-1">Save</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)} className="flex-1">Cancel</Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1">
                          <Checkbox
                            checked={selectedTags.includes(tag.id || tag._id || '')}
                            onCheckedChange={(checked) => handleTagSelect(tag.id || tag._id || '', checked as boolean)}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm">{tag.name}</h3>
                            <p className="text-xs text-muted-foreground">Slug: {tag.slug}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                                                     <DropdownMenuTrigger asChild>
                             <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                               <MoreHorizontal className="h-4 w-4" />
                             </Button>
                           </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(tag)}>
                              <Edit className="mr-2 h-4 w-4" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(tag.id || tag._id || '')}>
                              <Trash2 className="mr-2 h-4 w-4" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>

      {/* Bulk Delete Modal */}
      <AlertDialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Tags</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''}? This action cannot be undone and will permanently remove all selected tags from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={bulkActionLoading}
            >
              {bulkActionLoading ? 'Deleting...' : `Delete ${selectedTags.length} Tag${selectedTags.length > 1 ? 's' : ''}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
} 
