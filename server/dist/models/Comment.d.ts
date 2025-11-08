import { Document, Types } from 'mongoose';
export interface IComment {
    user: Types.ObjectId;
    prompt: Types.ObjectId;
    content: string;
    parentComment?: Types.ObjectId;
    likes: number;
    isEdited: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
interface ICommentDocument extends Document, IComment {
}
export declare const Comment: import("mongoose").Model<ICommentDocument, {}, {}, {}, Document<unknown, {}, ICommentDocument, {}, {}> & ICommentDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export {};
//# sourceMappingURL=Comment.d.ts.map