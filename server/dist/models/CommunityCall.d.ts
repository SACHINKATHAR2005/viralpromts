import mongoose from 'mongoose';
import { ICommunityCallDocument, ICommunityCallStatics } from '../types/communityCall.types';
interface ICommunityCallModel extends mongoose.Model<ICommunityCallDocument>, ICommunityCallStatics {
}
export declare const CommunityCall: ICommunityCallModel;
export {};
//# sourceMappingURL=CommunityCall.d.ts.map