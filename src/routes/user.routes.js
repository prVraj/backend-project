import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken, changeCurrentUserPassword, updateAccountDetails, getCurrentUser,updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getHistory }  from "../controllers/user.controller.js";
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
router.route( "/change_password" ).post( verifyJWT, changeCurrentUserPassword )
router.route( "/update_details" ).patch(verifyJWT, updateAccountDetails)
router.route( "/current_user" ).get(verifyJWT, getCurrentUser)
router.route( "/update_avatar" ).patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route( "/update_cover_image" ).patch(verifyJWT, upload.single("coverImg"), updateUserCoverImage)
router.route( "/channel/:username" ).get( verifyJWT, getUserChannelProfile )
router.route( "history" ).get( verifyJWT, getHistory )

export default router
