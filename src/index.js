import dotenv from "dotenv";
import connectTOdb from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectTOdb()
.then(() => {
  // app.listen(process.env.PORT || 8000, () => {
  app.listen(8000 || process.env.PORT, () => {
      console.log(`⚙️  Server is running at port : 8000`);// ${ process.env.PORT}`);
  })
})
  .catch((error) => {
    console.error(`MONGODB connection FAILED: ${error}`);
  });

/*
const app = express();
(async () => {
  try {
    await mongoose.connect(`${proccess.env.MONGODB_URI}/${DB_NAME}`);

    app.on("error", (error) => {
      console.error(`Error: ${error}`);
      throw error;
    });

    app.listen(proccess.env.PORT, () => {
      console.log(`Server is running on port ${proccess.env.PORT}`);
    });
  } catch (error) {
    console.error(`Error: ${error}`);
    throw error;
  }
})();
*/
