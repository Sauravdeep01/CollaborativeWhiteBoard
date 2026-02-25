import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
    {
        roomId: {
            type: String,
            required: true,
            unique: true
        },
        name: {
            type: String,
            default: 'Untitled Whiteboard'
        },
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        participantCount: {
            type: Number,
            default: 0
        },
        lastActive: {
            type: Date,
            default: Date.now,
            expires: 1800 // Auto-delete room after 30 minutes of inactivity
        },
        status: {
            type: String,
            enum: ['active', 'expired'],
            default: 'active'
        },
        leftParticipants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        whiteboardData: {
            type: Array,
            default: []
        },
        chatHistory: [{
            name: String,
            text: String,
            time: String,
            id: String
        }]
    },
    { timestamps: true }
);

const Room = mongoose.model('Room', roomSchema);
export default Room;
