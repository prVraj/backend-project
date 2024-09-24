import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken }  from "../controllers/user.controller.js";
import { upload } from "../middelwares/multer.middelware.js";
import { verifyJWT } from "../middelwares/auth.middelware.js"


const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount: 1

        },
        {
            name: "coverImg",
            maxCount: 1
        },
    ]),
    registerUser
)

router.route("/login").post( loginUser );


//secured routes
router.route("/logout").post( verifyJWT, logoutUser )

router.route( "/refresh_token" ).post( refreshAccessToken )

export default router
