import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const { Schema } = mongoose;

export const TransactionSchema = new Schema(
  {
    amount: Number,
    tags: [String],
    source: { type: Schema.Types.ObjectId, ref: "Saving" },
    type: String,
    account: { type: Schema.Types.ObjectId, ref: "Account" },
  },
  {
    collection: "transactions",
  }
);

TransactionSchema.plugin(timestamps);

TransactionSchema.index({ createdAt: 1, updatedAt: 1 });

export const Transaction = mongoose.model("Transaction", TransactionSchema);
