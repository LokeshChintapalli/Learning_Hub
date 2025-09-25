import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    sender: {
        type: String,
        enum: ['user', 'ai'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    audioAnalysis: {
        pronunciation: {
            score: Number,
            feedback: String,
            mistakes: [String]
        },
        grammar: {
            score: Number,
            corrections: [{
                original: String,
                suggestion: String,
                rule: String
            }]
        },
        vocabulary: {
            level: String,
            suggestions: [String],
            newWords: [String]
        }
    }
});

const learningSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    level: {
        type: String,
        enum: ['easy', 'medium', 'difficult'],
        required: true
    },
    topic: {
        type: String,
        enum: ['sports', 'business', 'travel', 'food', 'technology', 'health'],
        required: true
    },
    conversation: [conversationSchema],
    sessionStats: {
        duration: Number, // in minutes
        messagesCount: Number,
        pronunciationAverage: Number,
        grammarAverage: Number,
        vocabularyWordsLearned: Number,
        overallScore: Number
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: Date,
    isCompleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const userProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    currentLevel: {
        type: String,
        enum: ['easy', 'medium', 'difficult'],
        default: 'easy'
    },
    completedSessions: {
        type: Number,
        default: 0
    },
    totalStudyTime: {
        type: Number,
        default: 0 // in minutes
    },
    streakDays: {
        type: Number,
        default: 0
    },
    lastStudyDate: Date,
    topicProgress: {
        sports: {
            sessionsCompleted: { type: Number, default: 0 },
            averageScore: { type: Number, default: 0 },
            bestScore: { type: Number, default: 0 }
        },
        business: {
            sessionsCompleted: { type: Number, default: 0 },
            averageScore: { type: Number, default: 0 },
            bestScore: { type: Number, default: 0 }
        },
        travel: {
            sessionsCompleted: { type: Number, default: 0 },
            averageScore: { type: Number, default: 0 },
            bestScore: { type: Number, default: 0 }
        },
        food: {
            sessionsCompleted: { type: Number, default: 0 },
            averageScore: { type: Number, default: 0 },
            bestScore: { type: Number, default: 0 }
        },
        technology: {
            sessionsCompleted: { type: Number, default: 0 },
            averageScore: { type: Number, default: 0 },
            bestScore: { type: Number, default: 0 }
        },
        health: {
            sessionsCompleted: { type: Number, default: 0 },
            averageScore: { type: Number, default: 0 },
            bestScore: { type: Number, default: 0 }
        }
    },
    skillsProgress: {
        pronunciation: {
            currentScore: { type: Number, default: 0 },
            improvement: { type: Number, default: 0 },
            weakAreas: [String]
        },
        grammar: {
            currentScore: { type: Number, default: 0 },
            improvement: { type: Number, default: 0 },
            weakAreas: [String]
        },
        vocabulary: {
            wordsLearned: { type: Number, default: 0 },
            currentLevel: { type: String, default: 'beginner' },
            recentWords: [String]
        }
    },
    achievements: [{
        name: String,
        description: String,
        earnedDate: Date,
        icon: String
    }]
}, {
    timestamps: true
});

const LearnEnglishSession = mongoose.model("LearnEnglishSession", learningSessionSchema);
const UserProgress = mongoose.model("UserProgress", userProgressSchema);

export { LearnEnglishSession, UserProgress };
