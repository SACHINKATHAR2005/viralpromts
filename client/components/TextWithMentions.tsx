'use client';

import Link from 'next/link';
import { parseTextWithMentions } from '@/lib/mention-utils';

interface TextWithMentionsProps {
    text: string;
    className?: string;
}

/**
 * Component that renders text with @username mentions as clickable links
 */
export default function TextWithMentions({ text, className = '' }: TextWithMentionsProps) {
    const segments = parseTextWithMentions(text);

    return (
        <span className={className}>
            {segments.map((segment, index) => {
                if (segment.type === 'mention' && segment.username) {
                    return (
                        <Link
                            key={index}
                            href={`/profile/${segment.username}`}
                            className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {segment.content}
                        </Link>
                    );
                }
                return <span key={index}>{segment.content}</span>;
            })}
        </span>
    );
}
