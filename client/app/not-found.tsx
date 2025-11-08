'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles, Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 via-white to-pink-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4">
            <div className="max-w-2xl w-full text-center space-y-8">
                {/* Animated 404 */}
                <div className="relative">
                    <h1 className="text-[150px] md:text-[200px] font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent leading-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="h-24 w-24 text-purple-400 animate-pulse" />
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                        Page Not Found
                    </h2>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
                        Oops! The page you're looking for seems to have vanished into the digital void.
                        Let's get you back on track.
                    </p>
                </div>

                {/* Illustration/Animation Area */}
                <div className="py-8">
                    <div className="relative w-full h-48 flex items-center justify-center">
                        {/* Floating prompts illustration */}
                        <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-20">
                            <div className="w-32 h-24 bg-purple-200 dark:bg-purple-900 rounded-lg animate-float"></div>
                            <div className="w-32 h-24 bg-pink-200 dark:bg-pink-900 rounded-lg animate-float-delay"></div>
                            <div className="w-32 h-24 bg-blue-200 dark:bg-blue-900 rounded-lg animate-float-delay-2"></div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button
                        asChild
                        size="lg"
                        className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                        <Link href="/">
                            <Home className="mr-2 h-5 w-5" />
                            Go Home
                        </Link>
                    </Button>

                    <Button asChild size="lg" variant="outline">
                        <Link href="/explore">
                            <Search className="mr-2 h-5 w-5" />
                            Explore Prompts
                        </Link>
                    </Button>

                    <Button
                        asChild
                        size="lg"
                        variant="ghost"
                        onClick={() => window.history.back()}
                    >
                        <button>
                            <ArrowLeft className="mr-2 h-5 w-5" />
                            Go Back
                        </button>
                    </Button>
                </div>

                {/* Helpful Links */}
                <div className="pt-8">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                        Popular pages you might be looking for:
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link
                            href="/explore"
                            className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline"
                        >
                            Discover Prompts
                        </Link>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <Link
                            href="/create"
                            className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline"
                        >
                            Create Prompt
                        </Link>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <Link
                            href="/pools"
                            className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline"
                        >
                            Pools
                        </Link>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <Link
                            href="/calls"
                            className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline"
                        >
                            Community Calls
                        </Link>
                    </div>
                </div>

                {/* Error Code */}
                <div className="pt-8">
                    <p className="text-xs text-zinc-400 dark:text-zinc-600 font-mono">
                        ERROR_CODE: 404_PAGE_NOT_FOUND
                    </p>
                </div>
            </div>

            {/* Add custom animations */}
            <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(-3deg);
          }
          50% {
            transform: translateY(-20px) rotate(3deg);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delay {
          animation: float 3s ease-in-out infinite;
          animation-delay: 0.5s;
        }

        .animate-float-delay-2 {
          animation: float 3s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
        </div>
    );
}
