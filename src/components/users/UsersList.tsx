'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
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
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
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
  Users, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Key,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { User } from '../../lib/auth';
import { api } from '../../lib/api';

export function UsersList() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const token = localStorage.getItem('crm_token');
  
  // Load users on component mount
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await api.get('/users', token || undefined);
        setUsers(data.map((user: any) => ({ ...user, id: user.id || user._id })));
      } catch (err) {
        setError('Échec du chargement des utilisateurs');
        console.error('Error loading users:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, [token]);
  
  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Check if all current page users are selected
  const isAllSelected = currentUsers.length > 0 && currentUsers.every(user => selectedUsers.includes(user.id));

  // Handle select all users on current page
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentPageIds = currentUsers.map(user => user.id);
      setSelectedUsers([...selectedUsers.filter(id => !currentPageIds.includes(id)), ...currentPageIds]);
    } else {
      const currentPageIds = currentUsers.map(user => user.id);
      setSelectedUsers(selectedUsers.filter(id => !currentPageIds.includes(id)));
    }
  };

  // Handle individual user selection
  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    setBulkActionLoading(true);
    try {
      // Perform bulk delete API calls
      await Promise.all(selectedUsers.map(id => api.delete(`/users/${id}`, token || undefined)));
      
      // Update the users list by removing deleted users
      setUsers(users.filter(user => !selectedUsers.includes(user.id)));
      
      setSelectedUsers([]);
      setBulkDeleteModalOpen(false);
    } catch (err) {
      console.error('Error bulk deleting users:', err);
      alert('Échec de la suppression des utilisateurs');
    } finally {
      setBulkActionLoading(false);
    }
  };
  
  // Handle user deletion
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/users/${id}`, token || undefined);
      setUsers(users.filter(user => user.id !== id));
      setDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Échec de la suppression de l\'utilisateur');
    }
  };

  // Handle edit - navigate to edit page
  const handleEdit = (id: string) => {
    router.push(`/dashboard/users/${id}`);
  };

  // Handle reset password
  const handleResetPassword = (id: string) => {
    setUserToResetPassword(id);
    setNewPassword('');
    setConfirmNewPassword('');
    setResetPasswordModalOpen(true);
  };

  // Handle reset password form submission
  const handleResetPasswordSubmit = async () => {
    if (!userToResetPassword) return;
    
    if (newPassword !== confirmNewPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setResetPasswordLoading(true);
    try {
      await api.put(`/users/${userToResetPassword}`, 
        { password: newPassword }, 
        token || undefined
      );
      
      setResetPasswordModalOpen(false);
      setUserToResetPassword(null);
      setNewPassword('');
      setConfirmNewPassword('');
      alert('Mot de passe réinitialisé avec succès');
    } catch (err) {
      console.error('Error resetting password:', err);
      alert('Échec de la réinitialisation du mot de passe');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // Open delete modal
  const openDeleteModal = (id: string) => {
    setUserToDelete(id);
    setDeleteModalOpen(true);
  };

  // Open bulk delete modal
  const openBulkDeleteModal = () => {
    setBulkDeleteModalOpen(true);
  };

  // Handle page navigation
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };
  
  // Get role badge color and variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive'; // Red
      case 'EDITOR':
        return 'default'; // Dark/Black
      case 'AUTHOR':
        return 'secondary'; // Gray
      case 'PUBLISHER':
        return 'outline'; // Outlined
      case 'USER':
        return 'secondary'; // Gray
      default:
        return 'secondary';
    }
  };

  // Get custom styling for specific roles
  const getRoleBadgeClassName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 hover:bg-red-100/80 border-red-200';
      case 'EDITOR':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-blue-200';
      case 'AUTHOR':
        return 'bg-green-100 text-green-800 hover:bg-green-100/80 border-green-200';
      case 'PUBLISHER':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100/80 border-purple-200';
      case 'USER':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100/80 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100/80 border-gray-200';
    }
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
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <Button asChild>
          <Link href="/dashboard/users/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouvel Utilisateur
          </Link>
        </Button>
      </div>

      {/* Search and bulk actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des utilisateurs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={openBulkDeleteModal}
              disabled={bulkActionLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer ({selectedUsers.length})
            </Button>
          </div>
        )}
      </div>

      {/* Users Table */}
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
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Date d'inscription</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
                    <p className="text-gray-500 mb-4">
                      {searchQuery ? 'Aucun utilisateur ne correspond à votre recherche.' : 'Commencez par créer votre premier utilisateur.'}
                    </p>
                    {!searchQuery && (
                      <Button asChild>
                        <Link href="/dashboard/users/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Créer un Utilisateur
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                currentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={getRoleBadgeVariant(user.role)}
                        className={getRoleBadgeClassName(user.role)}
                      >
                        {user.role === 'ADMIN' ? 'Administrateur' : 
                         user.role === 'EDITOR' ? 'Éditeur' :
                         user.role === 'AUTHOR' ? 'Auteur' :
                         user.role === 'PUBLISHER' ? 'Éditeur' :
                         'Utilisateur'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date().toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(user.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                            <Key className="mr-2 h-4 w-4" />
                            Réinitialiser le mot de passe
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteModal(user.id)}
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
          {currentUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'Aucun utilisateur ne correspond à votre recherche.' : 'Commencez par créer votre premier utilisateur.'}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/dashboard/users/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un Utilisateur
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            currentUsers.map((user) => (
              <div
                key={user.id}
                className="border rounded-lg p-4 bg-white shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{user.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <div className="mt-1">
                        <Badge 
                          variant={getRoleBadgeVariant(user.role)}
                          className={`${getRoleBadgeClassName(user.role)} text-xs`}
                        >
                          {user.role === 'ADMIN' ? 'Administrateur' : 
                           user.role === 'EDITOR' ? 'Éditeur' :
                           user.role === 'AUTHOR' ? 'Auteur' :
                           user.role === 'PUBLISHER' ? 'Éditeur' :
                           'Utilisateur'}
                        </Badge>
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
                      <DropdownMenuItem onClick={() => handleEdit(user.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                        <Key className="mr-2 h-4 w-4" />
                        Réinitialiser le mot de passe
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => openDeleteModal(user.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Inscrit le: {new Date().toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Affichage de {startIndex + 1} à {Math.min(endIndex, filteredUsers.length)} sur {filteredUsers.length} utilisateurs
          </div>
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
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement l'utilisateur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => userToDelete && handleDelete(userToDelete)}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Modal */}
      <AlertDialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer les utilisateurs sélectionnés ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement {selectedUsers.length} utilisateur{selectedUsers.length > 1 ? 's' : ''}.
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

      {/* Reset Password Modal */}
      <AlertDialog open={resetPasswordModalOpen} onOpenChange={setResetPasswordModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser le mot de passe</AlertDialogTitle>
            <AlertDialogDescription>
              Entrez un nouveau mot de passe pour cet utilisateur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Entrez le nouveau mot de passe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirmez le nouveau mot de passe"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleResetPasswordSubmit}
              disabled={resetPasswordLoading}
            >
              {resetPasswordLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
