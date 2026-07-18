import "dotenv/config";
import mongoose, { Document, Model, Schema } from "mongoose";

interface IComment extends Document {
    user: mongoose.Types.ObjectId;
    comment: string;
    commentReplies?: IComment[];
    createdAt: Date;
}

interface IReview extends Document {
    user: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    commentReplies: IComment[];
    createdAt: Date;
}

interface ILink extends Document {
    title: string;
    url: string;
}

export interface ICourseData extends Document {
    title: string;
    description: string;
    videoUrl: string;
    videoThumbnail: object;
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
    thumbnail: object;
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
    comment: {
        type: String,
    }
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
    comment: {
        type: String,
        required: true
    },
    commentReplies: [Object]
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