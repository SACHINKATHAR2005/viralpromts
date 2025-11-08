'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, User, Plus, Trophy } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";

export default function Navbar() {
    const { isAuthenticated, user } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-zinc-950/80">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2">
                            <Sparkles className="h-8 w-8 text-purple-600" />
                            <span className="text-xl font-bold">Viral Prompts</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-4">
                            <Link href="/explore">
                                <Button variant="ghost" size="sm">
                                    Explore
                                </Button>
                            </Link>
                            <Link href="/pools">
                                <Button variant="ghost" size="sm" className="gap-1">
                                    <Trophy className="h-4 w-4" />
                                    Pools
                                </Button>
                            </Link>
                            {mounted && isAuthenticated && (
                                <Link href="/pools/my-pools">
                                    <Button variant="ghost" size="sm">
                                        My Pools
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!mounted ? (
                            // Show loading skeleton during SSR/hydration
                            <div className="flex items-center gap-2">
                                <div className="h-9 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
                                <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
                            </div>
                        ) : isAuthenticated ? (
                            <>
                                <Link href="/prompts/create">
                                    <Button size="sm" variant="default">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create
                                    </Button>
                                </Link>
                                <Link href="/profile">
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        {user?.profilePicture ? (
                                            <img
                                                src={user.profilePicture}
                                                alt={user.username}
                                                className="h-6 w-6 rounded-full object-cover"
                                            />
                                        ) : (
                                            <User className="h-4 w-4" />
                                        )}
                                        {user?.username}
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" size="sm">
                                        Sign In
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button size="sm">Get Started</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}