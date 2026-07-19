import "dotenv/config";
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IComment {
    _id?: mongoose.Types.ObjectId; // Optional if you want to reference it cleanly
    user: mongoose.Types.ObjectId;
    question: string;
    questionReplies?:[];
    createdAt: Date;
}

// Remove "extends Document" here
export interface IReview {
    user: mongoose.Types.ObjectId;
    rating: number;
    review: string;
    reviewReplies?: IComment[];
    // createdAt: Date;
}

// Remove "extends Document" here
interface ILink {
    title: string;
    url: string;
}

// Remove "extends Document" here
interface ICourseData {
    _id: mongoose.Types.ObjectId; // Keep this so .equals() works smoothly in your controller
    title: string;
    description: string;
    videoUrl: string;
    videoSection: string;
    videoLength: number;
    videoPlayer: string;
    links: ILink[];
    suggestion: string;
    questions: IComment[];
}

export interface ICourse extends Document {
    name: string;
    description?: string;
    price: number;
    estimatedPrice?: number;
    thumbnail: { public_id: string; url: string } | string;
    tags: string;
    level: string;
    demoUrl: string;
    benefits: { title: string }[];
    preqeuisites: { title: string }[];
    reviews: IReview[];
    courseData: ICourseData[];
    rating?: number;
    purchased?: number;

}

const reviewSchema: Schema<IReview> = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rating: {
        type: Number,
        default: 0,
    },
    review: {
        type: String,
    },
    reviewReplies: [Object]
}, { timestamps: true });

const linkSchema: Schema<ILink> = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    }
}, { timestamps: true });


const commentSchema: Schema<IComment> = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    question: {
        type: String,
        required: true
    },
    questionReplies: [Object]
}, { timestamps: true });

const courseDataSchema: Schema<ICourseData> = new mongoose.Schema({
    videoUrl: {
        type: String,
        required: true
    },
    // videoThumbnail: {
    //     type: Object,
    //     required: true
    // },
    videoSection: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    videoLength: {
        type: Number,
        required: true
    },
    videoPlayer: {
        type: String,
        required: true
    },
    links: [linkSchema],
    suggestion: {
        type: String,
        required: true
    },
    questions: [commentSchema]
}, { timestamps: true });


const courseSchema: Schema<ICourse> = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter the course name"],
        trim: true,
        minLength: [5, "Course name must be at least 5 characters"],
        maxLength: [100, "Course name  cannot exceed 100 characters"]
    },
    description: {
        type: String,
        required: [true, "Please enter the course description"],
        minLength: [20, "Description must be at least 20 characters"],
        maxLength: [2000, "Description cannot exceed 2000 characters"]
    },
    price: {
        type: Number,
        required: [true, "Please enter the course price"],
        min: [0, "Price cannot be negative"]
    },
    estimatedPrice: {
        type: Number,
        min: [0, "Estimated price cannot be negative"]
    },
    thumbnail: {
        public_id: {
            type: String,
            // required: true
        },
        url: {
            type: String,
            // required: true
        },
    },
    tags: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    demoUrl: {
        type: String,
        required: true
    },
    benefits: [
        {
            title: {
                type: String,
                required: true
            }
        }
    ],
    preqeuisites: [
        {
            title: {
                type: String,
                required: true
            }
        }
    ],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    rating: {
        type: Number,
        default: 0
    },
    purchased: {
        type: Number,
        default: 0
    }

}, { timestamps: true });


const CourseModel: Model<ICourse> = mongoose.model<ICourse>("Course", courseSchema);

export default CourseModel;