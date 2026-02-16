import express from "express"
import dotenv from "dotenv"
dotenv.config()
import imageRoutes from "./routes/image_routes.js"
import { preloadHashes } from "./service/visualSearch.service.js"


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/images", imageRoutes);

const serverStart = async() => {
    console.log("Server is starting.....")

    await preloadHashes(); 
    console.log("Hashes preloaded! System is ready🔥.");

    
    app.listen(PORT, () => {
        console.log("🚀 TS Backend running on http://localhost:3000");
    });
}
serverStart();

