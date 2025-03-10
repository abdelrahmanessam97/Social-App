import mongoose from "mongoose";

const connectionDb = async () => {
  try {
    await mongoose.connect(process.env.URI_CONNECTION);
    console.warn(`Mongodb connected ${process.env.URI_CONNECTION} `);
  } catch (error) {
    console.log({ msg: "error", error: error.message, stack: error.stack });
  }
};

export default connectionDb;
