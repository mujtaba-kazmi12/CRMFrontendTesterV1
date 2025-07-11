export interface Post {
  id: string;
  _id?: string;
  title: string;
  content: string;
  slug: string;
  excerpt: string;
  status: 'draft' | 'published';
  categoryIds: any[]; // Accept both string and object for compatibility
  tagIds: any[];
  authorId: string;
  createdAt: string;
  updatedAt: string;
  image_urls?: string[]; // Array of image URLs from the API
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export interface Tag {
  id: string;
  _id?: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EDITOR' | 'USER';
  avatar?: string;
}

export interface Media {
  id: string;
  filename: string;
  url: string;
  type: 'image' | 'document' | 'video';
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ImportExportData {
  posts: Post[];
  categories: Category[];
  tags: Tag[];
  version: string;
  exportDate: string;
}
