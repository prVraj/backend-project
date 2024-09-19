import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectTOdb = async () => {
  try {
    const connectDB = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\n DataBase connected!! DB Host: ${connectDB.connection.host}`
    );
  } catch (error) {
    console.log(`MONGODB connection FAILED: ${error}`);
    process.exit(1);
  }
};


export default connectTOdb;
