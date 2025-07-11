'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { UserRole } from '../../lib/auth';
import { api } from '../../lib/api';
import { MultiSelect } from '../ui/multi-select';
import { toast } from '../../hooks/use-toast';

export function UserForm() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  
  // Determine if this is a new user or editing existing user
  // If we're on /dashboard/users/new, there's no id param, so it's new
  // If we're on /dashboard/users/[id], then id is the user ID
  const id = params?.id || 'new';
  const isNewUser = id === 'new' || !params?.id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const token = localStorage.getItem('crm_token');
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [assignedCategoryIds, setAssignedCategoryIds] = useState<string[]>([]);
  const [assignedTagIds, setAssignedTagIds] = useState<string[]>([]);
  
  // Fetch categories and tags for assignment
  useEffect(() => {
    if (role === 'EDITOR' || role === 'AUTHOR' || role === 'PUBLISHER') {
      api.get('/categories', token || undefined).then(setCategories);
      api.get('/tags', token || undefined).then(setTags);
    }
  }, [role, token]);
  
  // Load user data if editing an existing user
  useEffect(() => {
    const loadUser = async () => {
      if (isNewUser) return;
      setLoading(true);
      setError(null);
      try {
        const user = await api.get(`/users/${id}`, token || undefined);
          setName(user.name);
          setEmail(user.email);
          setRole(user.role);
        setAssignedCategoryIds(user.assignedCategoryIds || []);
        setAssignedTagIds(user.assignedTagIds || []);
      } catch (err) {
        setError('Failed to load user');
        console.error('Error loading user:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [id, token, isNewUser]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    if (isNewUser && password !== confirmPassword) {
      setError('Passwords do not match');
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      setSaving(false);
      return;
    }
    try {
      const extraFields = (role === 'EDITOR' || role === 'AUTHOR' || role === 'PUBLISHER')
        ? { assignedCategoryIds, assignedTagIds }
        : {};
      let response;
      if (isNewUser) {
        response = await api.post('/users', { name, email, password, role, ...extraFields }, token || undefined);
      } else {
        response = await api.put(`/users/${id}`, { name, email, role, ...(password ? { password } : {}), ...extraFields }, token || undefined);
      }
      toast({
        title: 'Success',
        description: response?.message || 'User saved successfully!',
        variant: 'default',
      });
      router.push('/dashboard/users');
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
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center p-8">Loading user...</div>;
  }
  
  function buildCategoryTree(
    categories: any[],
    parentId: string | null = null
  ): (any & { children: any[] })[] {
    return categories
      .filter((cat: any) => cat.parentId === parentId)
      .map((cat: any) => ({
        ...cat,
        children: buildCategoryTree(categories, cat._id),
      }));
  }

  function handleCategoryToggle(id: string) {
    setAssignedCategoryIds((prev: string[]) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isNewUser ? 'Create New User' : 'Edit User'}</CardTitle>
          <CardDescription>
            {isNewUser 
              ? 'Fill in the details to create a new user account' 
              : 'Update user account details'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="User's full name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="EDITOR">Editor</SelectItem>
                  <SelectItem value="PUBLISHER">Publisher</SelectItem>
                  <SelectItem value="AUTHOR">Author</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {isNewUser && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required={isNewUser}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required={isNewUser}
                  />
                </div>
              </>
            )}
            
            {/* Category/Tag assignment for certain roles */}
            {(role === 'EDITOR' || role === 'AUTHOR' || role === 'PUBLISHER') && (
              <>
                <div className="space-y-2">
                  <Label>Assign Categories/Subcategories</Label>
                  <div className="border rounded-lg bg-white dark:bg-zinc-900 p-4 max-h-64 overflow-y-auto">
                    {buildCategoryTree(categories).map(cat => (
                      <div key={cat._id} className="mb-2">
                        <label className="flex items-center font-semibold text-zinc-800 dark:text-zinc-100">
                          <input
                            type="checkbox"
                            checked={assignedCategoryIds.includes(cat._id)}
                            onChange={() => handleCategoryToggle(cat._id)}
                            className="accent-indigo-500 mr-2"
                          />
                          {cat.name}
                        </label>
                        {cat.children.length > 0 && (
                          <div className="ml-6 mt-1 space-y-1">
                            {cat.children.map((sub: any) => (
                              <label
                                key={sub._id}
                                className="flex items-center text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 rounded px-2 py-1"
                              >
                                <input
                                  type="checkbox"
                                  checked={assignedCategoryIds.includes(sub._id)}
                                  onChange={() => handleCategoryToggle(sub._id)}
                                  className="accent-indigo-500 mr-2"
                                />
                                {sub.name}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Assign Tags</Label>
                  <MultiSelect
                    options={tags.map((tag: any) => ({ value: tag.id || tag._id, label: tag.name }))}
                    value={assignedTagIds}
                    onChange={setAssignedTagIds}
                    placeholder="Select tags"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/dashboard/users')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save User'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
