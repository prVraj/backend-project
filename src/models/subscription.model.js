import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId,        // watcher
            ref: "User"
        },
        channel: {
            type: Schema.Types.ObjectId,        // owner
            ref: "User"
        }
    }, { timestamps: true }
)



export const Subscription = mongoose.model( "Subscription", subscriptionSchema )