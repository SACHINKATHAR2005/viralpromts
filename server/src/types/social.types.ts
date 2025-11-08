// Rating related types
export interface IRating {
    _id: string;
    promptId: string; // Reference to Prompt
    userId: string;   // Reference to User

    // Rating categories
    effectiveness: number; // 1-5: Did this prompt work?
    clarity: number;       // 1-5: Was it easy to understand?
    creativity: number;    // 1-5: How unique/innovative?
    value: number;         // 1-5: Worth the time/effort?

    // Overall rating (calculated average)
    overall: number;

    // Review details
    comment?: string;
    proofUploaded: boolean; // Did user upload their own result?
    proofUrl?: string;

    // Helpful votes from other users
    helpfulVotes: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

// Comment related types
export interface IComment {
    _id: string;
    promptId: string; // Reference to Prompt
    userId: string;   // Reference to User

    content: string;

    // Reply system
    parentCommentId?: string; // For nested replies
    replies: string[]; // Array of reply comment IDs

    // Engagement
    likes: number;
    isEdited: boolean;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

// Follow/Social related types
export interface IFollow {
    _id: string;
    follower: string; // User ID who is following
    following: string; // User ID being followed

    createdAt: Date;
}

// Like related types
export interface ILike {
    _id: string;
    userId: string;
    targetType: 'prompt' | 'comment';
    targetId: string; // Prompt or Comment ID

    createdAt: Date;
}