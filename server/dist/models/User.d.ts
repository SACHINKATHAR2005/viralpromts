import mongoose, { Document } from 'mongoose';
import { IUser, IUserMethods } from '../types/user.types';
interface IUserDocument extends Document, IUser, IUserMethods {
}
export declare const User: mongoose.Model<IUserDocument, {}, {}, {}, mongoose.Document<unknown, {}, IUserDocument, {}, {}> & IUserDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export {};
//# sourceMappingURL=User.d.ts.map