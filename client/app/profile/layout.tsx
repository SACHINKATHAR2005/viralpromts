import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'My Profile',
    description: 'Manage your profile, view your prompts, track engagement, and monitor your community activity.',
    robots: {
        index: false, // Private pages shouldn't be indexed
        follow: true,
    },
};

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
