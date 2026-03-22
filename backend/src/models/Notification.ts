import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["FRIEND_REQUEST", "MESSAGE"],
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    content: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;
