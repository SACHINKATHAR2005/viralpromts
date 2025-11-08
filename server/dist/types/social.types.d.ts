export interface IRating {
    _id: string;
    promptId: string;
    userId: string;
    effectiveness: number;
    clarity: number;
    creativity: number;
    value: number;
    overall: number;
    comment?: string;
    proofUploaded: boolean;
    proofUrl?: string;
    helpfulVotes: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface IComment {
    _id: string;
    promptId: string;
    userId: string;
    content: string;
    parentCommentId?: string;
    replies: string[];
    likes: number;
    isEdited: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IFollow {
    _id: string;
    follower: string;
    following: string;
    createdAt: Date;
}
export interface ILike {
    _id: string;
    userId: string;
    targetType: 'prompt' | 'comment';
    targetId: string;
    createdAt: Date;
}
//# sourceMappingURL=social.types.d.ts.map