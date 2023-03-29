import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const { Schema } = mongoose;

export const SavingSchema = new Schema(
  {
    name: String,
    amount: Number,
    reminder: String,
    target: Number,
    status: String,
    color: String,
    account: { type: Schema.Types.ObjectId, ref: "Account" },
  },
  {
    collection: "savings",
  }
);

SavingSchema.plugin(timestamps);

SavingSchema.index({ createdAt: 1, updatedAt: 1 });

export const Saving = mongoose.model("Saving", SavingSchema);
