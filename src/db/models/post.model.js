import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      minLength: 3,
      trim: true,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
    },
    attachments: [
      {
        secure_url: String,
        public_id: String,
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
  },
  { timestamps: true }
);

export const postModel = mongoose.models.Post || mongoose.model("Post", postSchema);
