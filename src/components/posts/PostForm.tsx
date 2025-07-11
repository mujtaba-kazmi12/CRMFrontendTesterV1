'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useRouter, useParams } from 'next/navigation';
import { Post, Category, Tag } from '../../types/post';
import { api } from '../../lib/api';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import ListItem from '@tiptap/extension-list-item';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { uploadImageToFirebase } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { toast } from '../../hooks/use-toast';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Type,
  FileCode,
  Palette
} from 'lucide-react';

export function PostForm() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  // SEO Meta Tag fields
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [metaImage, setMetaImage] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [featured, setFeatured] = useState(false);
  
  const token = localStorage.getItem('crm_token');
  const { user } = useAuth();

  // Predefined colors for text
  const textColors = [
    '#000000', '#333333', '#666666', '#999999',
    '#FF0000', '#FF6B6B', '#FF9F43', '#FFA502',
    '#F39C12', '#F1C40F', '#2ECC71', '#27AE60',
    '#3498DB', '#2980B9', '#9B59B6', '#8E44AD',
    '#E91E63', '#E74C3C', '#1ABC9C', '#16A085'
  ];
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable the default list extensions from StarterKit
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
      Color,
      ListItem,
      BulletList.configure({
        HTMLAttributes: {
          class: 'my-bullet-list',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'my-ordered-list',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
      setHtmlContent(html);
    },
    editorProps: {
      attributes: {
        class: 'min-h-[300px] border-0 p-4 bg-white focus:outline-none prose prose-sm max-w-none [&_.my-bullet-list]:list-disc [&_.my-bullet-list]:ml-6 [&_.my-ordered-list]:list-decimal [&_.my-ordered-list]:ml-6',
      },
    },
  });

  // Handle mode switching
  const handleModeSwitch = (mode: boolean) => {
    if (mode && editor) {
      // Switching to HTML mode
      setHtmlContent(editor.getHTML());
    } else if (!mode && editor) {
      // Switching to editor mode
      editor.commands.setContent(htmlContent);
    }
    setIsHtmlMode(mode);
  };

  // Handle HTML content change
  const handleHtmlContentChange = (value: string) => {
    setHtmlContent(value);
    setContent(value);
  };

  // Handle color selection
  const handleColorSelect = (color: string) => {
    if (editor) {
      editor.chain().focus().setColor(color).run();
      setShowColorPicker(false);
    }
  };

  // Improved button handler with better responsiveness
  const handleEditorAction = (action: () => void) => {
    if (editor) {
      action();
      // Small delay to ensure the action is processed
      setTimeout(() => {
        editor.commands.focus();
      }, 10);
    }
  };
  
  // Load post data if editing an existing post
  useEffect(() => {
    const loadPost = async () => {
      if (!id || id === 'new') return;
      setLoading(true);
      setError(null);
      try {
        const post = await api.get(`/posts/${id}`, token || undefined);
          setTitle(post.title);
          setContent(post.content);
          setHtmlContent(post.content);
          setSlug(post.slug);
          setExcerpt(post.excerpt || '');
        setStatus(post.status);
        
        // Load SEO meta fields
        setMetaTitle(post.metaTitle || '');
        setMetaDescription(post.metaDescription || '');
        setMetaKeywords(post.metaKeywords || '');
        setMetaImage(post.metaImage || '');
        setCanonicalUrl(post.canonicalUrl || '');
        setFocusKeyword(post.focusKeyword || '');
        setFeatured(post.featured || false);
        
        // If post.categoryIds is [parentId, subId] or just [parentId]
        const catIds = (post.categoryIds || []).map((cat: any) => cat.id || cat._id);
        if (catIds.length > 0) setSelectedParentCategory(catIds[0]);
        if (catIds.length > 1) setSelectedSubCategory(catIds[1]);
        setSelectedTags((post.tagIds || []).map((tag: any) => tag.id || tag._id));
        if (editor) {
          editor.commands.setContent(post.content || '');
        }
      } catch (err) {
        setError('Failed to load post');
        console.error('Error loading post:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [id, editor, token]);

  // Load categories and tags
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [cats, tgs] = await Promise.all([
          api.get('/categories', token || undefined),
          api.get('/tags', token || undefined),
        ]);
        // Map _id to id for both categories and tags
        setCategories(cats.map((cat: any) => ({
          ...cat,
          id: cat.id || cat._id,
        })));
        setTags(tgs.map((tag: any) => ({
          ...tag,
          id: tag.id || tag._id,
        })));
      } catch (err) {
        // ignore
      }
    };
    loadMeta();
  }, [token]);
  
  // Generate slug from title
  const generateSlug = () => {
    setSlug(title.toLowerCase()
      .replace(/[^ -\w\s]/gi, '')
      .replace(/\s+/g, '-'));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const catIds = selectedParentCategory
        ? selectedSubCategory
          ? [selectedParentCategory, selectedSubCategory]
          : [selectedParentCategory]
        : [];
      const postData: any = {
        title,
        content: isHtmlMode ? htmlContent : content,
        slug,
        excerpt,
        status,
        categoryIds: catIds,
        tagIds: selectedTags,
        // SEO Meta Tags
        metaTitle,
        metaDescription,
        metaKeywords,
        metaImage,
        canonicalUrl,
        focusKeyword,
        featured,
      };
      let response;
      if (id === 'new') {
        response = await api.post('/posts', postData, token || undefined);
      } else {
        response = await api.put(`/posts/${id}`, postData, token || undefined);
        // Notify Google Indexing API
        try {
          const postUrl = `https://handicap-internatioanl.fr/${slug}`;
          await fetch('/api/notify-indexing', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ url: postUrl, type: 'URL_UPDATED' }),
          });
          // Notify Bing Indexing API
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
        } catch (err) {
          console.error('Failed to notify Google Indexing API:', err);
        }
      }
      toast({
        title: 'Success',
        description: response?.message || 'Post saved successfully!',
        variant: 'default',
      });
      router.push('/dashboard/posts');
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
      toast({
        description: errorMsg,
        variant: 'destructive',
      });
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };
  
  // Image upload handler for TipTap
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;
    const url = await uploadImageToFirebase(file);
    editor.chain().focus().setImage({ src: url }).run();
  };

  // Link handler
  const handleAddLink = () => {
    if (!editor) return;
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  // Editor toolbar component
  const EditorToolbar = () => {
    if (!editor) return null;

    return (
      <div className="border-b border-gray-200 bg-gray-50 p-2 rounded-t-md">
        <div className="flex flex-wrap items-center gap-1">
          {/* Mode Toggle */}
          <div className="flex items-center border-r border-gray-300 pr-2 mr-2">
            <Button
              type="button"
              variant={!isHtmlMode ? "default" : "outline"}
              size="sm"
              onClick={() => handleModeSwitch(false)}
              className="h-8 px-2"
            >
              <Type className="h-4 w-4 mr-1" />
              Éditeur
            </Button>
            <Button
              type="button"
              variant={isHtmlMode ? "default" : "outline"}
              size="sm"
              onClick={() => handleModeSwitch(true)}
              className="h-8 px-2 ml-1"
            >
              <FileCode className="h-4 w-4 mr-1" />
              HTML
            </Button>
          </div>

          {!isHtmlMode && (
            <>
              {/* Undo/Redo */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleEditorAction(() => editor.chain().focus().undo().run())}
                disabled={!editor.can().undo()}
                className="h-8 w-8 p-0"
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleEditorAction(() => editor.chain().focus().redo().run())}
                disabled={!editor.can().redo()}
                className="h-8 w-8 p-0"
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Text Formatting */}
              <Button
                type="button"
                variant={editor.isActive('bold') ? "default" : "ghost"}
                size="sm"
                onClick={() => handleEditorAction(() => editor.chain().focus().toggleBold().run())}
                className="h-8 w-8 p-0"
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor.isActive('italic') ? "default" : "ghost"}
                size="sm"
                onClick={() => handleEditorAction(() => editor.chain().focus().toggleItalic().run())}
                className="h-8 w-8 p-0"
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor.isActive('underline') ? "default" : "ghost"}
                size="sm"
                onClick={() => handleEditorAction(() => editor.chain().focus().toggleUnderline().run())}
                className="h-8 w-8 p-0"
                title="Underline"
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor.isActive('strike') ? "default" : "ghost"}
                size="sm"
                onClick={() => handleEditorAction(() => editor.chain().focus().toggleStrike().run())}
                className="h-8 w-8 p-0"
                title="Strikethrough"
              >
                <Strikethrough className="h-4 w-4" />
              </Button>

              {/* Text Color */}
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="h-8 w-8 p-0"
                  title="Text Color"
                >
                  <Palette className="h-4 w-4" />
                </Button>
                {showColorPicker && (
                  <div className="absolute top-10 left-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg p-2">
                    <div className="grid grid-cols-4 gap-1 w-32">
                      {textColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => handleColorSelect(color)}
                          title={color}
                        />
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleColorSelect('#000000')}
                      className="w-full mt-2 text-xs"
                    >
                      Reset Color
                    </Button>
                  </div>
                )}
              </div>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Alignment */}
              <Button
                type="button"
                variant={editor.isActive({ textAlign: 'left' }) ? "default" : "ghost"}
                size="sm"
                onClick={() => handleEditorAction(() => editor.chain().focus().setTextAlign('left').run())}
                className="h-8 w-8 p-0"
                title="Align Left"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor.isActive({ textAlign: 'center' }) ? "default" : "ghost"}
                size="sm"
                onClick={() => handleEditorAction(() => editor.chain().focus().setTextAlign('center').run())}
                className="h-8 w-8 p-0"
                title="Align Center"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor.isActive({ textAlign: 'right' }) ? "default" : "ghost"}
                size="sm"
                onClick={() => handleEditorAction(() => editor.chain().focus().setTextAlign('right').run())}
                className="h-8 w-8 p-0"
                title="Align Right"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor.isActive({ textAlign: 'justify' }) ? "default" : "ghost"}
                size="sm"
                onClick={() => handleEditorAction(() => editor.chain().focus().setTextAlign('justify').run())}
                className="h-8 w-8 p-0"
                title="Justify"
              >
                <AlignJustify className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Lists - Fixed Implementation */}
              <Button
                type="button"
                variant={editor.isActive('bulletList') ? "default" : "ghost"}
                size="sm"
                onClick={() => handleEditorAction(() => editor.chain().focus().toggleBulletList().run())}
                className="h-8 w-8 p-0"
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor.isActive('orderedList') ? "default" : "ghost"}
                size="sm"
                onClick={() => handleEditorAction(() => editor.chain().focus().toggleOrderedList().run())}
                className="h-8 w-8 p-0"
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Quote and Code */}
              <Button
                type="button"
                variant={editor.isActive('blockquote') ? "default" : "ghost"}
                size="sm"
                onClick={() => handleEditorAction(() => editor.chain().focus().toggleBlockquote().run())}
                className="h-8 w-8 p-0"
                title="Quote"
              >
                <Quote className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor.isActive('code') ? "default" : "ghost"}
                size="sm"
                onClick={() => handleEditorAction(() => editor.chain().focus().toggleCode().run())}
                className="h-8 w-8 p-0"
                title="Inline Code"
              >
                <Code className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Link */}
              <Button
                type="button"
                variant={editor.isActive('link') ? "default" : "ghost"}
                size="sm"
                onClick={handleAddLink}
                className="h-8 w-8 p-0"
                title="Add Link"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>

              {/* Image Upload */}
              <input
                type="file"
                accept="image/*"
                id="image-upload"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => document.getElementById('image-upload')?.click()}
                className="h-8 w-8 p-0"
                title="Upload Image"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };
  
  // Build parent and subcategory lists
  const parentCategories = categories.filter(cat => !cat.parentId);
  const subCategories = categories.filter(cat => cat.parentId === selectedParentCategory);
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }
  
  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }
  
  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{id && id !== 'new' ? 'Modifier l\'Article' : 'Nouvel Article'}</CardTitle>
          <CardDescription>
            {id && id !== 'new' ? 'Modifiez votre article et cliquez sur sauvegarder quand vous avez terminé.' : 'Créez un nouvel article pour votre site web.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entrez le titre de l'article"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="slug">Slug URL</Label>
            <div className="flex gap-2">
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-de-l-article"
                required
              />
              <Button type="button" onClick={generateSlug} variant="outline">
                Générer
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Contenu</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={isHtmlMode ? "outline" : "default"}
                  size="sm"
                  onClick={() => handleModeSwitch(false)}
                >
                  Éditeur
                </Button>
                <Button
                  type="button"
                  variant={isHtmlMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleModeSwitch(true)}
                >
                  HTML
                </Button>
              </div>
            </div>
            
            {isHtmlMode ? (
              <Textarea
                value={htmlContent}
                onChange={(e) => handleHtmlContentChange(e.target.value)}
                placeholder="Entrez votre contenu HTML ici..."
                className="min-h-[400px] font-mono text-sm"
              />
            ) : (
              <div className="border rounded-md">
                <EditorToolbar />
                <EditorContent editor={editor} />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="excerpt">Résumé</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Bref résumé de l'article (optionnel)"
              className="min-h-[100px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Statut{user?.role === 'USER' && (
            <p className="text-sm font-semibold text-amber-600 mb-2">
              Note : Votre article sera approuvé par un administrateur avant publication.
            </p>
          )}</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as 'draft' | 'published')}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Sélectionner le statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                {(user?.role === 'ADMIN' || user?.role === 'PUBLISHER') && (
                  <SelectItem value="published">Publié</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select
              value={selectedParentCategory}
              onValueChange={value => {
                setSelectedParentCategory(value);
                setSelectedSubCategory(''); // Reset subcategory when parent changes
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {parentCategories.map(parent => (
                  <SelectItem key={parent._id} value={parent._id}>{parent.name}</SelectItem>
              ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedParentCategory && subCategories.length > 0 && (
            <div className="space-y-2">
              <Label>Sous-catégorie</Label>
              <Select
                value={selectedSubCategory}
                onValueChange={value => setSelectedSubCategory(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une sous-catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map(sub => (
                      <SelectItem key={sub._id} value={sub._id}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Étiquettes</Label>
            <div className="grid grid-cols-2 gap-2">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag.id}`}
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTags(prev => [...prev, tag.id]);
                      } else {
                        setSelectedTags(prev => prev.filter(id => id !== tag.id));
                      }
                    }}
                  />
                  <Label htmlFor={`tag-${tag.id}`} className="cursor-pointer">
                    {tag.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* SEO Meta Tags Section */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Paramètres SEO</h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={featured}
                onCheckedChange={(checked) => setFeatured(checked as boolean)}
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Article en vedette
              </Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Titre Meta (SEO)</Label>
              <Input
                id="metaTitle"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Titre SEO (laisser vide pour utiliser le titre de l'article)"
                maxLength={60}
              />
              <p className="text-xs text-gray-500">{metaTitle.length}/60 caractères</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Description Meta (SEO)</Label>
              <Textarea
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Description SEO (laisser vide pour utiliser le résumé)"
                maxLength={160}
                className="min-h-[80px]"
              />
              <p className="text-xs text-gray-500">{metaDescription.length}/160 caractères</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="focusKeyword">Mot-clé principal</Label>
              <Input
                id="focusKeyword"
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                placeholder="Mot-clé SEO principal"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="metaKeywords">Mots-clés Meta</Label>
              <Input
                id="metaKeywords"
                value={metaKeywords}
                onChange={(e) => setMetaKeywords(e.target.value)}
                placeholder="Mots-clés séparés par des virgules"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="metaImage">URL de l'image en vedette</Label>
              <Input
                id="metaImage"
                value={metaImage}
                onChange={(e) => setMetaImage(e.target.value)}
                placeholder="URL pour l'image de partage sur les réseaux sociaux"
                type="url"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="canonicalUrl">URL Canonique</Label>
              <Input
                id="canonicalUrl"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="URL canonique (laisser vide pour génération automatique)"
                type="url"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/dashboard/posts')}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder l\'Article'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
