import { Document, Model } from "mongoose";

interface MonthData {
    month: string;
    count: number;
}

export async function generateLast12MothsData<T extends Document>(
    model: Model<T>
): Promise<{ last12Months: MonthData[] }> {
    const currentDate = new Date();
    const boundaries: Date[] = [];

    // Generate 13 monthly boundary dates (from 12 months ago up to current month)
    for (let i = 12; i >= 0; i--) {
        const boundaryDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - i,
            1
        );
        boundaries.push(boundaryDate);
    }

    // Set end range to current moment
    const now = new Date();
    boundaries[boundaries.length - 1] = now;

    const buckets = await model.aggregate([
        {
            $match: {
                createdAt: { $gte: boundaries[0], $lt: now },
            },
        },
        {
            $bucket: {
                groupBy: "$createdAt",
                boundaries,
                default: "other",
                output: { count: { $sum: 1 } },
            },
        },
    ]);

    const countsByTime = new Map<number, number>();
    buckets.forEach((bucket: { _id: unknown; count: number }) => {
        if (bucket._id instanceof Date) {
            countsByTime.set(bucket._id.getTime(), bucket.count);
        }
    });

    const last12Months: MonthData[] = boundaries.slice(0, -1).map((start) => {
        const monthLabel = start.toLocaleString("default", {
            month: "short",
            year: "numeric",
        });

        return {
            month: monthLabel, // Guaranteed string type
            count: countsByTime.get(start.getTime()) || 0,
        };
    });

    return { last12Months };
}