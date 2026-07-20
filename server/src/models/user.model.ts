import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs"
import "dotenv/config";
import jwt from "jsonwebtoken"


const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    avatar: {
        public_id: string;
        url: string;
    },
    role: string;
    isVerified: boolean;
    courses: Array<{ _id: string }>;
    comparePassword: (password: string) => Promise<boolean>;
    signAccessToken: () => string;
    signRefreshToken: () => string;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
        trim: true,
        minLength: [2, "Name must be atleast of 2 characters"],
        maxLength: [50, "Name cannot exceed 50 characters"]
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        unique: true,
        validate: {
            validator: function (value: string){
                return emailRegexPattern.test(value)
            },
            message: "Please enter a valid email"
        }
    },
    password: {
        type: String,
        // required: [true, "Please enter your password"],
        minLength: [8, "Password must be atleast of 8 characters"],
        select: false
    },
    avatar: {
        public_id: {
            type: String,
            // required: true
        },
        url: {
            type: String,
            // required: true
        },
    },
    role: {
        type: String,
        default: "user",
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    courses: [
        {
            courseId: String
        }
    ]
}, {timestamps: true})

// hash password before saving

userSchema.pre<IUser>("save", async function() {
    if(!this.isModified("password")){
        return
    }
    this.password = await bcrypt.hash(this.password, 10)
})


// sign access token
userSchema.methods.signAccessToken = function (){
    return jwt.sign({id: this._id}, process.env.ACCESS_TOKEN || "", {expiresIn: "5m"})
}

// sign refresh token
userSchema.methods.signRefreshToken = function (){
    return jwt.sign({id: this._id}, process.env.REFRESH_TOKEN || "", {expiresIn: "59m"})
}


// compare password

userSchema.methods.comparePassword = async function(enteredPassword: string): Promise<boolean>{
    const check = await bcrypt.compare(enteredPassword, this.password)
    return check
}


const UserModel:Model<IUser> = mongoose.model("User", userSchema)

export default UserModel;