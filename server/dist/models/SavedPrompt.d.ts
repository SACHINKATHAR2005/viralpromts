import { Document, Types } from 'mongoose';
export interface ISavedPrompt {
    user: Types.ObjectId;
    prompt: Types.ObjectId;
    collectionName?: string;
    notes?: string;
    createdAt: Date;
}
interface ISavedPromptDocument extends Document, ISavedPrompt {
}
export declare const SavedPrompt: import("mongoose").Model<ISavedPromptDocument, {}, {}, {}, Document<unknown, {}, ISavedPromptDocument, {}, {}> & ISavedPromptDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export {};
//# sourceMappingURL=SavedPrompt.d.ts.map