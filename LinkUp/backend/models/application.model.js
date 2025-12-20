import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Personal Information
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    location: {
        type: String
    },
    
    // Professional Information
    experience: {
        type: Number, // years of experience
        min: 0
    },
    currentPosition: {
        type: String
    },
    education: {
        type: String
    },
    expectedSalary: {
        type: String
    },
    
    // Skills and Portfolio
    skills: [{
        type: String
    }],
    portfolioUrl: {
        type: String
    },
    linkedinUrl: {
        type: String
    },
    githubUrl: {
        type: String
    },
    
    // Application Content
    coverLetter: {
        type: String
    },
    resumeUrl: {
        type: String
    },
    resumeOriginalName: {
        type: String
    },
    
    // Additional Questions (dynamic)
    additionalAnswers: {
        type: Map,
        of: String
    },
    
    // Application Status
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'accepted', 'rejected'],
        default: 'pending'
    },
    
    // Metadata
    appliedAt: {
        type: Date,
        default: Date.now
    },
    reviewedAt: {
        type: Date
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String // Internal notes from recruiter
    }
}, {
    timestamps: true
});

// Index for efficient queries
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ applicant: 1 });
applicationSchema.index({ status: 1 });

// Virtual for application age
applicationSchema.virtual('applicationAge').get(function() {
    const now = new Date();
    const applied = this.appliedAt;
    const diffTime = Math.abs(now - applied);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Ensure virtual fields are included in JSON output
applicationSchema.set('toJSON', { virtuals: true });
applicationSchema.set('toObject', { virtuals: true });

const Application = mongoose.model('Application', applicationSchema);

export default Application;