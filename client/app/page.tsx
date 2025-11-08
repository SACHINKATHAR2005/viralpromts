'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Users, BookOpen, TrendingUp, Trophy, Target, Calendar, Award } from "lucide-react";
import Link from "next/link";
import { poolApi } from "@/lib/api/client";
import { toast } from "sonner";

interface Pool {
  _id: string;
  title: string;
  description: string;
  type: 'challenge' | 'voting' | 'collaborative' | 'resource';
  status: 'active' | 'upcoming' | 'completed' | 'cancelled' | 'pending';
  category: string;
  tags: string[];
  featured?: boolean;
  participants: any[];
  prompts: any[];
  challenge?: {
    prize?: string;
    endDate?: string;
  };
  creator: string | {
    _id: string;
    username: string;
    profilePicture?: string;
  };
}

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredPool, setFeaturedPool] = useState<Pool | null>(null);
  const [loadingPool, setLoadingPool] = useState(true);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/explore');
    }
  };

  useEffect(() => {
    const fetchFeaturedPool = async () => {
      try {
        const response = await poolApi.getPools({
          featured: true,
          status: 'active',
          limit: 1
        });
        if (response.data.data && response.data.data.items.length > 0) {
          setFeaturedPool(response.data.data.items[0]);
        }
      } catch (error) {
        console.error('Error fetching featured pool:', error);
      } finally {
        setLoadingPool(false);
      }
    };

    fetchFeaturedPool();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      {/* Hero Section */}
      <section className="relative py-20 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-6xl">
            Discover & Share
            <span className="bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {" "}Creative Prompts
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Join thousands of creators sharing and discovering the most effective prompts for AI tools, writing, and creative projects.
          </p>

          {/* Search Bar */}
          <div className="mt-8">
            <form onSubmit={handleSearch} className="flex max-w-md mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="Search for prompts..."
                  className="pl-10 pr-4 py-3 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" className="ml-2 px-6">Search</Button>
            </form>
          </div>

          {/* Trending Tags */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Trending:</span>
            {['AI Art', 'Writing', 'Marketing', 'Coding', 'Creative'].map((tag) => (
              <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="text-center">
              <CardContent className="p-6">
                <Users className="mx-auto h-12 w-12 text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Community Driven</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Share prompts with a vibrant community of creators and get feedback on your work.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <BookOpen className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Curated Collections</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Organize and save your favorite prompts in personalized collections.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <TrendingUp className="mx-auto h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Trending Insights</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Discover what's working best and stay ahead of prompt trends.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Pool Section */}
      {!loadingPool && featuredPool && (
        <section className="py-16 bg-zinc-100/50 dark:bg-zinc-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <h2 className="text-3xl font-bold">Featured Challenge</h2>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/pools">View All Pools</Link>
              </Button>
            </div>

            <Card className="overflow-hidden bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-2 border-purple-200 dark:border-purple-800">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="shrink-0">
                        {featuredPool.type === 'challenge' && <Target className="h-6 w-6 text-purple-600" />}
                        {featuredPool.type === 'voting' && <Trophy className="h-6 w-6 text-blue-600" />}
                        {featuredPool.type === 'collaborative' && <Users className="h-6 w-6 text-green-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="bg-purple-600 text-white hover:bg-purple-700">
                            Featured
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {featuredPool.type}
                          </Badge>
                          <Badge
                            className={
                              featuredPool.status === 'active'
                                ? 'bg-green-600 text-white'
                                : featuredPool.status === 'upcoming'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-zinc-600 text-white'
                            }
                          >
                            {featuredPool.status}
                          </Badge>
                        </div>
                        <h3 className="text-2xl font-bold mb-3">{featuredPool.title}</h3>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                          {featuredPool.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {featuredPool.tags.slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-6 text-sm text-zinc-600 dark:text-zinc-400">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{featuredPool.participants.length} participants</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>{featuredPool.prompts.length} submissions</span>
                          </div>
                          {featuredPool.challenge?.prize && (
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-yellow-600" />
                              <span className="font-semibold text-yellow-700 dark:text-yellow-500">
                                {featuredPool.challenge.prize}
                              </span>
                            </div>
                          )}
                          {featuredPool.challenge?.endDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Ends {new Date(featuredPool.challenge.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col gap-3 md:items-end justify-center">
                    <Button size="lg" asChild className="w-full md:w-auto">
                      <Link href={`/pools/${featuredPool._id}`}>
                        View Challenge
                      </Link>
                    </Button>
                    {typeof featuredPool.creator === 'object' && (
                      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <span>by</span>
                        {featuredPool.creator.profilePicture ? (
                          <img
                            src={featuredPool.creator.profilePicture}
                            alt={featuredPool.creator.username}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-linear-to-br from-purple-500 to-pink-500" />
                        )}
                        <Link
                          href={`/profile/${featuredPool.creator.username}`}
                          className="font-semibold hover:underline"
                        >
                          {featuredPool.creator.username}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-linear-to-r from-purple-600 to-pink-600 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mt-4 text-lg opacity-90">
            Join our community and start sharing your creative prompts today.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">Create Account</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white bg-whitetext-purple-600" asChild>
              <Link href="/explore">Explore Prompts</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
