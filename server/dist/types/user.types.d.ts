export interface IUser {
    username: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    bio?: string;
    website?: string;
    profilePicture?: string;
    reputation: {
        score: number;
        totalRatings: number;
        badges: string[];
    };
    stats: {
        totalPrompts: number;
        totalCopies: number;
        totalEarnings: number;
        followersCount: number;
        followingCount: number;
    };
    monetizationUnlocked: boolean;
    isVerified: boolean;
    isActive: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface IUserMethods {
    comparePassword(candidatePassword: string): Promise<boolean>;
    generateAuthToken(): string;
}
export interface IUserModel extends IUser, IUserMethods {
}
//# sourceMappingURL=user.types.d.ts.map