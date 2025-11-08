import { Document, Types } from 'mongoose';
export interface IRating {
    user: Types.ObjectId;
    prompt: Types.ObjectId;
    rating: number;
    review?: string;
    isHelpful?: boolean;
    helpfulVotes: number;
    createdAt: Date;
    updatedAt: Date;
}
interface IRatingDocument extends Document, IRating {
}
export declare const Rating: import("mongoose").Model<IRatingDocument, {}, {}, {}, Document<unknown, {}, IRatingDocument, {}, {}> & IRatingDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export {};
//# sourceMappingURL=Rating.d.ts.map