import { catchAsyncError } from "../middlewares/catchAsyncErrors.js"
import { User } from "../models/User.js"
import ErrorHandler from "../utils/errorHandler.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendToken } from "../utils/sendToken.js";
import crypto from "crypto";
import { Course } from "../models/Course.js";
import cloudinary from "cloudinary"
import getDataUri from "../utils/dataUrl.js";
import { Stats } from "../models/Stats.js";
export const register = catchAsyncError(async(req, res, next) => {
    const {name, email, password} = req.body;

    const file = req.file;

    if(!name || !email || !password || !file) return next(new ErrorHandler("Please enter text in all the fields", 400));

    let user = await User.findOne({ email });

    if(user){
        return next(new ErrorHandler("email already exists", 409));
    }

    const fileUri = getDataUri(file);
    const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

    //upload file on cloudinary
    user = await User.create({
        name, email, password,
        avatar: {
            public_id: mycloud.public_id,
            url: mycloud.secure_url,
        }
    })

    sendToken(res, user, "Registered Successfully", 201);
});


export const login = catchAsyncError(async(req, res, next) => {
    const {email, password} = req.body;
    const user = await User.findOne({ email }).select("+password");
    if(!email || !password) return next(new ErrorHandler("Please enter text in all the fields", 420));

    const isMatch = await user.comparePassword(password);

    if(!isMatch)
    return next(new ErrorHandler("Incorrect email or password", 401));

    if(!user){
        return next(new ErrorHandler("the email is not registered", 401));
    }

    sendToken(res, user, `Welcome back, ${user.name}`, 200);

});

export const logout = catchAsyncError( async(req, res, next) => {
    res.status(200).cookie("token", null,{
        expires: new Date(Date.now()),
    })
    .json({
        success: true,
        message: "Logout Successfully"
    })
});

export const getMyProfile = catchAsyncError( async(req, res, next) => {
    const user = await User.findById(req.user._id); //this is for if there is not login then return false other wise show the user

    res.status(200).json({
        success: true,
        user,
    })
});

export const changePassword = catchAsyncError( async(req, res, next) => {
    const {oldPassword, newPassword} = req.body;

    if(!oldPassword || !newPassword){
        return next(new ErrorHandler("Please enter all field", 400));
    }

    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.comparePassword(oldPassword);

    if(!isMatch) return next(new ErrorHandler("Incorrect old password", 400));

    user.password = newPassword;

    await user.save();
    
    res.status(200).json({
        success: true,
        message: "Password Successfully Changed"
    })
})

export const updateProfile = catchAsyncError( async(req, res, next) => {
    const {name, email} = req.body;

    const user = await User.findById(req.user._id);

    if(!name || !email) return next(new ErrorHandler("Please filled all the fields", 401));

    if(name) user.name = name;
    if(email) user.email = email;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Profile Update Successfully"
    })
})

export const forgetPassword = catchAsyncError( async(req, res, next) => {
    const {email} = req.body;

    const user = await User.findOne({email});

    if(!user) return next(new ErrorHandler("User Not Found", 400));

    const resetToken = await user.getResetToken();

    await user.save();

    const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    const message = `Click on the link to reset your password. ${url}. if you have not request then please ignore.`

    await sendEmail(user.email, "VideosUpload Reset Password", message);

    res.status(200).json({
        success: true,
        message: `Reset Token Has been send to ${user.email}`,
    })
});

export const resetPassword = catchAsyncError( async(req, res, next) => {
    const { token } = req.params;

    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex"); //by adding the same algo if the token is same the time increases

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire:{
            $gt: Date.now(),
        },
    })

    if(!user) return next(new ErrorHandler("Token is invalid or has been expired"));

    user.password = req.body.password; //change password
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Password change successfully",
        token,
    })
});

export const addtoplaylist = catchAsyncError( async(req, res, next) => {
    const user = await User.findById(req.user._id);
    const course = await Course.findById(req.body.id);

    if(!course) return next(new ErrorHandler("Invalid Course Id", 404));

    const itemExits = user.playlist.find((item) => {
        if(item.course.toString() === course._id.toString()) return true;
    })

    if(itemExits) return next(new ErrorHandler("Item Already Exist", 409));

    user.playlist.push({
        course: course.id,
        poster: course.poster.url,
    });

    await user.save();

    res.status(200).json({
        success: true,
        message: "Added to playlist"
    })
})

export const removefromplaylist = catchAsyncError( async(req, res, next) => {
    const user = await User.findById(req.user._id);
    const course = await Course.findById(req.query.id);
    if(!course) return next(new ErrorHandler("Invalid Course Id", 404));

    const newPlayList = user.playlist.filter((item) => {
        if(item.course.toString() != course._id.toString()) return item;
    })

    user.playlist = newPlayList;
    await user.save();

    res.status(200).json({
        success: true,
        message: "Remove from playlist"
    })
})

export const updateProfilePicture = catchAsyncError( async(req, res, next) => {
    //cloudinary updated
    const file = req.file;

    const user = await User.findById(req.user._id);

    const fileUri = getDataUri(file);
    const mycloud = await cloudinary.v2.uploader.upload(fileUri.content); 

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    user.avatar = {
        public_id: mycloud.public_id,
        url: mycloud.secure_url,
    }

    await user.save();

    res.status(200).json({
        success: true,
        message: "Profile Picture Update Successfully"
    })
})

export const updateUserRole = catchAsyncError(async(req, res, next) => {

    const user = await User.findById(req.params.id);

    if(!user) return next(new ErrorHandler("User not found", 404));

    if(user.role === "user") user.role = "admin";
    else user.role = "user";

    await user.save()
    res.status(200).json({
        success: true,
        message: "Role updated"
    })
})

export const deleteUser = catchAsyncError(async(req, res, next) => {
    const user = await User.findById(req.params.id);
 
    if(!user) return next(new ErrorHandler("User not found", 404));

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    await User.findOneAndDelete({_id: req.params.id});

    res.status(200).json({
        success: true,
        message: "User Deleted Successfully"
    })
})

export const deleteMyProfile = catchAsyncError(async(req, res, next) => {
    const user = await User.findById(req.user._id);

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    await User.findOneAndDelete({_id: req.user._id});

    res.status(200).cookie("token", null, {
        expires: new Date(Date.now()),
    }).json({
        success: true,
        message: "You Deleted Sccessfully"
    })
})

export const getAllUsers = catchAsyncError(async(req, res, next) => {
    
    const users = await User.find({});

    res.status(200).json({
        success: true,
        users,
    })
})

User.watch().on("change", async() => { //real time data check krega jaise he user update ho to yeh work kre
    const stats = await Stats.find({}).sort({createAt: "desc"}).limit(1);

    const subscription = await User.find({"subscription.status": "active"})

    stats[0].users = await User.countDocuments();
    stats[0].subscription = subscription.length;
    stats[0].createdAt = new Date(Date.now());

    await stats[0].save();
});