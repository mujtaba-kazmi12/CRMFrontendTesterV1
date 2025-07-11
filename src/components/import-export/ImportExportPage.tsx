'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, Download, Upload } from 'lucide-react';
import { Post, ImportExportData } from '../../types/post';
import { toast } from '../../hooks/use-toast';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';

// Mock function to import data
const importData = async (data: ImportExportData): Promise<void> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real app, this would import the data into the database
  console.log('Importing data:', data);
};

export function ImportExportPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('export');
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [exportData, setExportData] = useState<ImportExportData | null>(null);
  
  // Load export data on component mount
  useEffect(() => {
    const loadExportData = async () => {
      setLoading(true);
      
      try {
        setExportData({
          posts: [],
          categories: [],
          tags: [],
          version: '1.0.0',
          exportDate: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error loading export data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadExportData();
  }, []);
  
  // Handle export
  const handleExport = () => {
    if (!exportData) return;
    
    let dataStr: string;
    let fileName: string;
    
    if (exportFormat === 'json') {
      dataStr = JSON.stringify(exportData, null, 2);
      fileName = `crm-export-${new Date().toISOString().split('T')[0]}.json`;
    } else {
      // Simple CSV conversion for posts only
      const headers = 'id,title,slug,status,categoryIds,tagIds,authorId,createdAt,updatedAt\n';
      const rows = exportData.posts.map(post => 
        `${post.id},"${post.title}",${post.slug},${post.status},"${post.categoryIds.join('|')}","${post.tagIds.join('|')}",${post.authorId},${post.createdAt},${post.updatedAt}`
      ).join('\n');
      dataStr = headers + rows;
      fileName = `crm-export-${new Date().toISOString().split('T')[0]}.csv`;
    }
    
    // Create download link
    const blob = new Blob([dataStr], { type: exportFormat === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Handle file selection for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
      setImportError(null);
    }
  };
  
  // Handle import
  const handleImport = async () => {
    if (!importFile) return;
    
    setLoading(true);
    setImportError(null);
    
    try {
      const fileText = await importFile.text();
      let importedData: ImportExportData;
      
      if (importFile.name.endsWith('.json')) {
        // Parse JSON
        importedData = JSON.parse(fileText);
      } else if (importFile.name.endsWith('.csv')) {
        // Parse CSV (simplified)
        const lines = fileText.split('\n');
        
        const posts: Post[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',');
          posts.push({
            id: values[0],
            title: values[1].replace(/"/g, ''),
            content: '',
            slug: values[2],
            excerpt: '',
            status: values[3] as 'draft' | 'published',
            categoryIds: values[4].replace(/"/g, '').split('|'),
            tagIds: values[5].replace(/"/g, '').split('|'),
            authorId: values[6],
            createdAt: values[7],
            updatedAt: values[8],
          });
        }
        
        importedData = {
          posts,
          categories: [],
          tags: [],
          version: '1.0.0',
          exportDate: new Date().toISOString(),
        };
      } else {
        throw new Error('Unsupported file format. Please use JSON or CSV.');
      }
      
      // Validate import data
      if (!importedData.posts || !Array.isArray(importedData.posts)) {
        throw new Error('Invalid import data: posts array is missing');
      }
      
      // Import the data
      await importData(importedData);
      toast({
        title: 'Success',
        description: 'Data imported successfully!',
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
      setImportError(errorMsg);
      toast({
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Importer/Exporter des Données</CardTitle>
        <CardDescription>
          Gérez vos données en important ou exportant des articles, catégories et étiquettes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Exporter</TabsTrigger>
            <TabsTrigger value="import">Importer</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="space-y-4">
            <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="exportFormat">Format d'exportation</Label>
                <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as 'json' | 'csv')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            
            <div className="space-y-2">
                <h3 className="text-sm font-medium">Données à exporter</h3>
              <div className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Articles</span>
                  <span className="text-sm font-medium">{exportData?.posts.length || 0}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Catégories</span>
                  <span className="text-sm font-medium">{exportData?.categories.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm">Étiquettes</span>
                  <span className="text-sm font-medium">{exportData?.tags.length || 0}</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleExport} 
              disabled={loading || !exportData}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
                {loading ? 'Préparation de l\'exportation...' : `Exporter en ${exportFormat.toUpperCase()}`}
            </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="importFile">Fichier à importer</Label>
                <Input
                  id="importFile"
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p className="font-medium">Important :</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>Les fichiers JSON doivent correspondre à la structure du format d'exportation</li>
                  <li>Les fichiers CSV doivent avoir des en-têtes correspondant au format d'exportation</li>
                  <li>L'importation ne supprimera pas les données existantes par défaut</li>
                  <li>Les ID en double mettront à jour les enregistrements existants</li>
                </ul>
              </div>
            </div>
            
            <Button 
              onClick={handleImport} 
              disabled={loading || !importFile}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {loading ? 'Importation...' : 'Importer les Données'}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push('/dashboard/posts')}
          disabled={loading}
        >
          Annuler
        </Button>
      </CardFooter>
    </Card>
  );
}
