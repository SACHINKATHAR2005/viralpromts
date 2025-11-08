import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/NavbarNew";
import { Toaster } from "@/components/ui/sonner";
import { getWebsiteSchema, getOrganizationSchema } from "@/lib/structured-data";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Viral Prompts - Discover & Share Creative AI Prompts",
    template: "%s | Viral Prompts"
  },
  description: "Join thousands of creators discovering and sharing the most effective prompts for AI tools, writing, and creative projects. Create challenges, vote on submissions, and collaborate with the community.",
  keywords: [
    "AI prompts",
    "creative prompts",
    "ChatGPT prompts",
    "midjourney prompts",
    "stable diffusion prompts",
    "prompt engineering",
    "AI writing",
    "prompt challenges",
    "prompt marketplace",
    "prompt library",
    "creative writing",
    "AI tools",
    "prompt templates",
    "prompt ideas",
    "community prompts"
  ],
  authors: [{ name: "Viral Prompts Team" }],
  creator: "Viral Prompts",
  publisher: "Viral Prompts",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://viralprompts.com",
    title: "Viral Prompts - Discover & Share Creative AI Prompts",
    description: "Join thousands of creators sharing the most effective prompts for AI tools and creative projects",
    siteName: "Viral Prompts",
  },
  twitter: {
    card: "summary_large_image",
    title: "Viral Prompts - Discover & Share Creative AI Prompts",
    description: "Join thousands of creators sharing the most effective prompts for AI tools and creative projects",
    creator: "@viralprompts",
  },
  metadataBase: new URL('https://viralprompts.com'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteSchema = getWebsiteSchema();
  const organizationSchema = getOrganizationSchema();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <Navbar />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
