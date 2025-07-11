'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { api } from '../../lib/api';
import { Category } from '../../types/post';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, ChevronRight, ChevronDown, Plus } from 'lucide-react';
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

// Helper to build a tree from flat categories
function buildCategoryTree(
  categories: Category[],
  parentId: string | null = null
): (Category & { children: ReturnType<typeof buildCategoryTree> })[] {
  return categories
    .filter(cat => cat.parentId === parentId)
    .map(cat => ({
      ...cat,
      children: buildCategoryTree(categories, cat._id),
    }));
}

export function CategoriesList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editParentId, setEditParentId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const token = localStorage.getItem('crm_token');

  // Fetch all categories flat (for tree and parent selection)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get('/categories', token || undefined);
        setCategories(data);
      } catch (err) {
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  // Create category or subcategory
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/categories', { name, slug, parentId: parentId || null }, token || undefined);
      setName('');
      setSlug('');
      setParentId(null);
      const data = await api.get('/categories', token || undefined);
      setCategories(data);
      toast({
        title: 'Success',
        description: response?.message || 'Category created successfully!',
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

  // Edit category
  const handleEdit = (cat: Category) => {
    setEditingId(cat._id);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditParentId(cat.parentId);
  };

  // Update category
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await api.put(`/categories/${editingId}`, { name: editName, slug: editSlug, parentId: editParentId || null }, token || undefined);
      setEditingId(null);
      setEditName('');
      setEditSlug('');
      setEditParentId(null);
      const data = await api.get('/categories', token || undefined);
      setCategories(data);
    } catch (err) {
      setError('Failed to update category');
    }
  };

  // Delete category
  const handleDelete = async (id: string) => {
    const hasSubcategories = categories.some(c => c.parentId === id);
    if (hasSubcategories && !window.confirm('This category has subcategories. Are you sure you want to delete it?')) return;
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`, token || undefined);
      setCategories(categories.filter(c => c._id !== id));
    } catch (err) {
      setError('Failed to delete category');
    }
  };

  // Tree view expand/collapse
  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Handle individual category selection
  const handleCategorySelect = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, categoryId]);
    } else {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId));
    }
  };

  // Handle select all categories
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(categories.map(cat => cat._id));
    } else {
      setSelectedCategories([]);
    }
  };

  // Check if all categories are selected
  const isAllSelected = categories.length > 0 && selectedCategories.length === categories.length;

  // Open bulk delete modal
  const openBulkDeleteModal = () => {
    if (selectedCategories.length === 0) return;
    setBulkDeleteModalOpen(true);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedCategories.length === 0) return;

    setBulkActionLoading(true);
    try {
      // Check if any selected categories have subcategories
      const hasSubcategories = selectedCategories.some(id => 
        categories.some(c => c.parentId === id)
      );

      if (hasSubcategories) {
        const confirmMessage = 'Some selected categories have subcategories. Deleting them will also delete their subcategories. Continue?';
        if (!window.confirm(confirmMessage)) {
          setBulkActionLoading(false);
          return;
        }
      }

      // Delete categories in parallel
      await Promise.all(
        selectedCategories.map(categoryId => api.delete(`/categories/${categoryId}`, token || undefined))
      );

      // Update local state
      setCategories(categories.filter(cat => !selectedCategories.includes(cat._id)));
      setSelectedCategories([]);
      setBulkDeleteModalOpen(false);

      toast({
        title: "Success",
        description: `${selectedCategories.length} categor${selectedCategories.length > 1 ? 'ies' : 'y'} deleted successfully`,
      });
    } catch (err) {
      console.error('Error deleting categories:', err);
      toast({
        title: "Error",
        description: "Failed to delete some categories",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Render tree rows recursively
  const renderCategoryRows = (tree: any[], level = 0): JSX.Element[] => {
    return tree.map(cat => (
      <React.Fragment key={cat._id}>
        <TableRow>
          {editingId === cat._id ? (
            <TableCell colSpan={5}>
              <form onSubmit={handleUpdate} className="flex gap-2 w-full items-center">
                <Input value={editName} onChange={e => setEditName(e.target.value)} required placeholder="Name" />
                <Input value={editSlug} onChange={e => setEditSlug(e.target.value)} required placeholder="Slug" />
                <select
                  className="border rounded px-2 py-1"
                  value={editParentId || ''}
                  onChange={e => setEditParentId(e.target.value || null)}
                >
                  <option value="">Top-level</option>
                  {categories.filter(c => c._id !== cat._id).map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                <Button type="submit" size="sm">Save</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
              </form>
            </TableCell>
          ) : (
            <>
              <TableCell className="w-[50px]">
                <Checkbox
                  checked={selectedCategories.includes(cat._id)}
                  onCheckedChange={(checked) => handleCategorySelect(cat._id, checked as boolean)}
                />
              </TableCell>
              <TableCell style={{ paddingLeft: `${level * 24}px` }}>
                {cat.children.length > 0 && (
                  <Button variant="ghost" size="icon" onClick={() => toggleExpand(cat._id)}>
                    {expanded[cat._id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </Button>
                )}
                {cat.name}
              </TableCell>
              <TableCell>{cat.slug}</TableCell>
              <TableCell>{cat.parentId ? categories.find(c => c._id === cat.parentId)?.name || '—' : '—'}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">

                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(cat)}>
                      <Edit className="mr-2 h-4 w-4" />Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(cat._id)}>
                      <Trash2 className="mr-2 h-4 w-4" />Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </>
          )}
        </TableRow>
        {cat.children.length > 0 && expanded[cat._id] && renderCategoryRows(cat.children, level + 1)}
      </React.Fragment>
    ));
  };

  // Render tree cards for mobile view
  const renderCategoryCards = (tree: any[], level = 0): JSX.Element[] => {
    return tree.map(cat => (
      <React.Fragment key={cat._id}>
        <div className="border rounded-lg p-4 bg-white shadow-sm" style={{ marginLeft: `${level * 16}px` }}>
          {editingId === cat._id ? (
            <form onSubmit={handleUpdate} className="space-y-3">
              <Input 
                value={editName} 
                onChange={e => setEditName(e.target.value)} 
                required 
                placeholder="Category Name"
                className="w-full"
              />
              <Input 
                value={editSlug} 
                onChange={e => setEditSlug(e.target.value)} 
                required 
                placeholder="Slug"
                className="w-full"
              />
              <select
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={editParentId || ''}
                onChange={e => setEditParentId(e.target.value || null)}
              >
                <option value="">Top-level</option>
                {categories.filter(c => c._id !== cat._id).map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1">Save</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)} className="flex-1">Cancel</Button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedCategories.includes(cat._id)}
                    onCheckedChange={(checked) => handleCategorySelect(cat._id, checked as boolean)}
                  />
                  {cat.children.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => toggleExpand(cat._id)} className="p-1 h-6 w-6">
                      {expanded[cat._id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </Button>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(cat)}>
                      <Edit className="mr-2 h-4 w-4" />Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(cat._id)}>
                      <Trash2 className="mr-2 h-4 w-4" />Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-2">
                <div>
                  <h3 className="font-medium text-sm">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground">Slug: {cat.slug}</p>
                </div>
                
                {cat.parentId && (
                  <div className="text-xs text-muted-foreground">
                    Parent: {categories.find(c => c._id === cat.parentId)?.name || '—'}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        {cat.children.length > 0 && expanded[cat._id] && renderCategoryCards(cat.children, level + 1)}
      </React.Fragment>
    ));
  };

  const tree = buildCategoryTree(categories);

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <CardTitle>Categories & Subcategories</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[80vh] overflow-y-auto space-y-4">
        {error && <div className="mb-2 text-red-500 text-sm">{error}</div>}
        
        {/* Add Category Form - Mobile Responsive */}
        <form onSubmit={handleCreate} className="space-y-3 lg:space-y-0 lg:flex lg:gap-2 lg:items-center p-4 bg-gray-50 rounded-lg">
          <div className="flex-1 space-y-3 lg:space-y-0 lg:flex lg:gap-2">
            <Input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Category Name" 
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
            <select
              className="w-full lg:w-auto border border-input rounded-md px-3 py-2 text-sm bg-background"
              value={parentId || ''}
              onChange={e => setParentId(e.target.value || null)}
            >
              <option value="">Top-level</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full lg:w-auto">
            <Plus size={16} className="mr-2" />Add
          </Button>
        </form>

        {/* Bulk Actions Bar */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-blue-50 border border-blue-200 rounded-md gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-900">
                {selectedCategories.length} categor{selectedCategories.length > 1 ? 'ies' : 'y'} selected
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
          <div className="flex justify-center p-8">Loading categories...</div>
        ) : tree.length === 0 ? (
          <div className="text-center p-8 border rounded-md">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No categories found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new category</p>
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
                    <TableHead>Parent</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{renderCategoryRows(tree)}</TableBody>
              </Table>
            </div>

            {/* Mobile Card View - Shown only on mobile */}
            <div className="lg:hidden space-y-3">
              {renderCategoryCards(tree)}
            </div>
          </>
        )}
      </CardContent>

      {/* Bulk Delete Modal */}
      <AlertDialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Categories</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCategories.length} categor{selectedCategories.length > 1 ? 'ies' : 'y'}? This action cannot be undone and will permanently remove all selected categories and their subcategories from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={bulkActionLoading}
            >
              {bulkActionLoading ? 'Deleting...' : `Delete ${selectedCategories.length} Categor${selectedCategories.length > 1 ? 'ies' : 'y'}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
} 
