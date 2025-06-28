import { postModel } from "../../db/models/post.model.js";
import cloudinary from "../../utils/cloudnary/index.js";
import { asyncHandler } from "../../utils/index.js";

//------------------------------------------ createPost ------------------------------------------------
export const createPost = asyncHandler(async (req, res, next) => {
  if (req.files && req.files.length > 0) {
    const images = [];

    for (const file of req.files) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, {
        folder: "social-app/posts",
      });
      images.push({ secure_url, public_id });
    }
    req.body.attachments = images;
  }

  const post = await postModel.create({ ...req.body, userId: req.user._id });

  return res.status(200).json({ message: "post created successfully", post });
});
