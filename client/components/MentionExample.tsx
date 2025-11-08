'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import TextWithMentions from '@/components/TextWithMentions';
import { extractMentions, isValidMentionUsername } from '@/lib/mention-utils';
import { toast } from 'sonner';

/**
 * Example component demonstrating @mention functionality
 * This can be integrated into comments, posts, or any text input
 */
export default function MentionExample() {
    const [inputText, setInputText] = useState('');
    const [comments, setComments] = useState([
        {
            id: '1',
            user: 'johndoe',
            text: 'Hey @alice, check out this amazing prompt by @bob! 🚀',
            timestamp: new Date(Date.now() - 3600000)
        },
        {
            id: '2',
            user: 'alice',
            text: 'Thanks @johndoe! This is really helpful. @bob your work is inspiring!',
            timestamp: new Date(Date.now() - 1800000)
        }
    ]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!inputText.trim()) {
            toast.error('Please enter a comment');
            return;
        }

        // Extract mentions from the text
        const mentions = extractMentions(inputText);

        // Validate mentions (optional - you could check if users exist in DB)
        const invalidMentions = mentions.filter(username => !isValidMentionUsername(username));
        if (invalidMentions.length > 0) {
            toast.warning(`Invalid usernames: ${invalidMentions.join(', ')}`);
        }

        // Add the comment
        const newComment = {
            id: String(Date.now()),
            user: 'currentUser', // Replace with actual logged-in user
            text: inputText,
            timestamp: new Date()
        };

        setComments([newComment, ...comments]);
        setInputText('');

        // Show success message with mentioned users
        if (mentions.length > 0) {
            toast.success(`Comment posted! Mentioned: ${mentions.map(u => '@' + u).join(', ')}`);
        } else {
            toast.success('Comment posted!');
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">@Mention System Demo</h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-blue-900 mb-2">How to use mentions:</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Type <code className="bg-blue-100 px-1 rounded">@username</code> to mention someone</li>
                        <li>• Username must be 3-30 characters (letters, numbers, underscores)</li>
                        <li>• Mentions will be clickable and link to user profiles</li>
                        <li>• Example: <code className="bg-blue-100 px-1 rounded">@alice @bob @john_doe</code></li>
                    </ul>
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="mb-6">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Write a comment... Try mentioning @alice or @bob!"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={3}
                    />
                    <div className="flex items-center justify-between mt-2">
                        <div className="text-sm text-gray-500">
                            {extractMentions(inputText).length > 0 && (
                                <span>
                                    Mentioning: {extractMentions(inputText).map(u => '@' + u).join(', ')}
                                </span>
                            )}
                        </div>
                        <Button type="submit">Post Comment</Button>
                    </div>
                </form>

                {/* Comments List */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Comments ({comments.length})</h3>
                    {comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                                    {comment.user.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-900">@{comment.user}</span>
                                        <span className="text-xs text-gray-500">
                                            {comment.timestamp.toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className="text-gray-700">
                                        <TextWithMentions text={comment.text} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Code Example */}
            <div className="bg-gray-900 rounded-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">Usage Example:</h3>
                <pre className="text-sm overflow-x-auto">
                    {`import TextWithMentions from '@/components/TextWithMentions';
import { extractMentions } from '@/lib/mention-utils';

// In your component:
const text = "Hey @alice, check out @bob's work!";
const mentions = extractMentions(text); // ['alice', 'bob']

// Render with clickable mentions:
<TextWithMentions text={text} />

// This will render:
// Hey <a href="/profile/alice">@alice</a>, 
// check out <a href="/profile/bob">@bob</a>'s work!`}
                </pre>
            </div>
        </div>
    );
}
