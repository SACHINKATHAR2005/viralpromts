import { Document, Types } from 'mongoose';
export interface ILike {
    user: Types.ObjectId;
    prompt: Types.ObjectId;
    createdAt: Date;
}
interface ILikeDocument extends Document, ILike {
}
export declare const Like: import("mongoose").Model<ILikeDocument, {}, {}, {}, Document<unknown, {}, ILikeDocument, {}, {}> & ILikeDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export {};
//# sourceMappingURL=Like.d.ts.map