'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  FileSignature,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { api } from '@/lib/api';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  subscriptionType?: string;
  subscriptionStatus?: string;
  postsThisPeriod?: number;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, hideForUser: true },
    { name: 'Articles', href: '/dashboard/posts', icon: FileText },
    { name: 'Catégories', href: '/dashboard/categories', icon: FileText, admin: true },
    { name: 'Étiquettes', href: '/dashboard/tags', icon: FileText, admin: true },
    { name: 'Utilisateurs', href: '/dashboard/users', icon: Users, admin: true },
    { name: 'Paramètres', href: '/dashboard/settings', icon: Settings, admin: true },
    { name: 'Pied de page', href: '/dashboard/footer', icon: FileSignature, admin: true },
  ];

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('crm_token');
        if (token) {
          const userData = await api.get('/auth/me', token);
          setUser(userData);
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        // Fallback to localStorage
        const fallbackUser = JSON.parse(localStorage.getItem('crm_user') || '{}');
        if (fallbackUser?.role) {
          setUser(fallbackUser);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const isActive = (path: string) => {
    if (!pathname) return false;
    
    // Exact match for root dashboard
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    
    // For other paths, check exact match or starts with path followed by slash
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const isAdmin = user?.role === 'ADMIN';

  // Get subscription badge variant and text
  const getSubscriptionBadge = () => {
    if (!user?.subscriptionType) return null;
    
    const { subscriptionType, subscriptionStatus, postsThisPeriod = 0 } = user;
    
    // Define post limits for each plan
    const postLimits = {
      basic: 1,
      standard: 3,
      premium: 10,
    };
    
    const limit = postLimits[subscriptionType as keyof typeof postLimits];
    if (!limit) return null;
    
    const postsLeft = Math.max(0, limit - postsThisPeriod);
    const isActive = subscriptionStatus === 'active';
    
    const badgeConfig = {
      basic: { 
        variant: 'secondary' as const, 
        text: 'Plan Basique',
        className: isActive ? 'bg-blue-100 text-blue-800 hover:bg-blue-100/80' : 'bg-gray-100 text-gray-600 hover:bg-gray-100/80'
      },
      standard: { 
        variant: 'default' as const, 
        text: 'Plan Standard',
        className: isActive ? 'bg-green-100 text-green-800 hover:bg-green-100/80 border-transparent' : 'bg-gray-100 text-gray-600 hover:bg-gray-100/80 border-transparent'
      },
      premium: { 
        variant: 'default' as const, 
        text: 'Plan Premium',
        className: isActive ? 'bg-purple-100 text-purple-800 hover:bg-purple-100/80 border-transparent' : 'bg-gray-100 text-gray-600 hover:bg-gray-100/80 border-transparent'
      },
    };
    
    const config = badgeConfig[subscriptionType as keyof typeof badgeConfig];
    if (!config) return null;
    
    return (
      <div className="flex items-center gap-2">
        <Badge variant={config.variant} className={config.className}>
          {config.text}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {postsLeft} articles restants
        </Badge>
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 flex md:hidden ${sidebarOpen ? 'visible' : 'invisible'}`} role="dialog" aria-modal="true">
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${sidebarOpen ? 'opacity-100 ease-out duration-300' : 'opacity-0 ease-in duration-200'}`} aria-hidden="true"></div>
        <div className={`relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white transition transform ${sidebarOpen ? 'translate-x-0 ease-out duration-300' : '-translate-x-full ease-in duration-200'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Fermer la barre latérale</span>
              <X className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-shrink-0 flex items-center px-4">
            <h1 className="text-xl font-bold">CRM Next.js</h1>
          </div>
          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {navigation.filter(item => 
                (!item.admin || isAdmin) && 
                (!item.hideForUser || user?.role !== 'USER')
              ).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`mr-4 h-6 w-6 ${
                      isActive(item.href) ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        <div className="flex-shrink-0 w-14" aria-hidden="true">
          {/* Dummy element to force sidebar to shrink to fit close icon */}
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold">CRM Next.js</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
              {navigation.filter(item => 
                (!item.admin || isAdmin) && 
                (!item.hideForUser || user?.role !== 'USER')
              ).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-6 w-6 ${
                      isActive(item.href) ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white">
          <Button
            type="button"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Ouvrir la barre latérale</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </Button>
        </div>
        <main className="flex-1 overflow-auto">
          <div className="h-full py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
                </h1>
                <div className="flex items-center gap-3">
                  {/* Subscription Badge */}
                  {getSubscriptionBadge()}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full border-2 border-gray-300 hover:border-gray-300 transition-colors">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/avatars/01.png" alt="User" />
                          <AvatarFallback>
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user?.email || 'user@example.com'}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        localStorage.removeItem('crm_token');
                        localStorage.removeItem('crm_user');
                        router.push('/login');
                      }}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Se déconnecter</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
