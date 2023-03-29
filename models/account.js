import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const { Schema } = mongoose;

export const AccountSchema = new Schema(
  {
    name: String,
    password: String,
    telephone: String,
    email: String,
    image: String,
  },
  {
    collection: "accounts",
  }
);
AccountSchema.plugin(timestamps);

AccountSchema.index({ createdAt: 1, updatedAt: 1 });

export const Account = mongoose.model("Account", AccountSchema);
