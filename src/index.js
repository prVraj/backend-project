import dotenv from "dotenv" 
import connectTOdb from "./db/index.js"

dotenv.config({
  path: './.env'
});

connectTOdb()


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