import { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Prompt Details - Viral Prompts',
    description: 'View detailed information about AI prompts, ratings, and creator insights.',
};

export default function PromptLayout({ children }: { children: ReactNode }) {
    return children;
}