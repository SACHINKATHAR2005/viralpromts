import { Document, Model } from 'mongoose';
import { IPrompt, IPromptMethods, IPromptStatics } from '../types/prompt.types';
interface IPromptDocument extends IPrompt, IPromptMethods, Document {
}
interface IPromptModel extends Model<IPromptDocument>, IPromptStatics {
}
export declare const Prompt: IPromptModel;
export {};
//# sourceMappingURL=Prompt.d.ts.map