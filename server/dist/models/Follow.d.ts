import { Document, Types } from 'mongoose';
export interface IFollow {
    follower: Types.ObjectId;
    following: Types.ObjectId;
    createdAt: Date;
}
interface IFollowDocument extends Document, IFollow {
}
export declare const Follow: import("mongoose").Model<IFollowDocument, {}, {}, {}, Document<unknown, {}, IFollowDocument, {}, {}> & IFollowDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export {};
//# sourceMappingURL=Follow.d.ts.map