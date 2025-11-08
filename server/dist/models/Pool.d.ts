import mongoose from 'mongoose';
import { IPoolDocument, IPoolStatics } from '../types/pool.types';
interface IPoolModel extends mongoose.Model<IPoolDocument>, IPoolStatics {
}
export declare const Pool: IPoolModel;
export {};
//# sourceMappingURL=Pool.d.ts.map