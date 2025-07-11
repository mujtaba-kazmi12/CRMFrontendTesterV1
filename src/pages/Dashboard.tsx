'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Users, FileText, Settings } from 'lucide-react';
import Link from 'next/link';
import { api } from '../lib/api';

function Dashboard() {
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('crm_token');
        const [postsData, usersData] = await Promise.all([
          api.get('/posts', token || undefined),
          api.get('/users', token || undefined),
        ]);
        setPosts(postsData);
        setUsers(usersData);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Stats
const stats = [
  {
    title: 'Total Posts',
    value: posts.length,
    change: '',
    icon: <FileText className="h-4 w-4" />,
    link: '/dashboard/posts',
  },
  {
    title: 'Total Users',
    value: users.length,
    change: '',
    icon: <Users className="h-4 w-4" />,
    link: '/dashboard/users',
  },
];

  // Chart data (posts/users per month)
  const chartData = (() => {
    // Group posts and users by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const postCounts: { [key: string]: number } = {};
    const userCounts: { [key: string]: number } = {};
    posts.forEach(post => {
      const d = new Date(post.createdAt);
      const key = months[d.getMonth()] + ' ' + d.getFullYear();
      postCounts[key] = (postCounts[key] || 0) + 1;
    });
    users.forEach(user => {
      const d = new Date(user.createdAt);
      const key = months[d.getMonth()] + ' ' + d.getFullYear();
      userCounts[key] = (userCounts[key] || 0) + 1;
    });
    const allKeys = Array.from(new Set([...Object.keys(postCounts), ...Object.keys(userCounts)])).sort();
    return allKeys.map(key => ({
      name: key,
      posts: postCounts[key] || 0,
      users: userCounts[key] || 0,
    }));
  })();

  // Recent posts (last 5)
  const recentPosts = posts
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (loading) return <div className="flex justify-center p-8">Loading dashboard...</div>;
  if (error) return <div className="p-4 text-red-500 bg-red-50 rounded-md">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <div className="flex items-baseline gap-1">
                    <h4 className="text-3xl font-bold">{stat.value}</h4>
                    {stat.change && <span className="text-xs font-medium text-green-500">{stat.change}</span>}
                  </div>
                </div>
                <div className="rounded-full bg-muted p-2">
                  {stat.icon}
                </div>
              </div>
              <div className="mt-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={stat.link}>
                    View all
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>Latest content added to your CRM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{post.title}</p>
                    <p className="text-sm text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/posts">
                  View all posts
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Growth Overview</CardTitle>
            <CardDescription>Posts and users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="posts" fill="#4f46e5" name="Posts" />
                  <Bar dataKey="users" fill="#10b981" name="Users" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button asChild>
              <Link href="/dashboard/posts/new">
                <FileText className="mr-2 h-4 w-4" />
                Create New Post
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                Manage Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;
