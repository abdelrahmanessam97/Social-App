import mongoose from "mongoose";

const connectionDb = async () => {
  try {
    await mongoose.connect(process.env.URI_CONNECTION);
    console.warn(`\x1b[33mMongodb connected ${process.env.URI_CONNECTION}\x1b[0m`);
  } catch (error) {
    console.log({ msg: "error", error: error.message, stack: error.stack });
  }
};

export default connectionDb;
