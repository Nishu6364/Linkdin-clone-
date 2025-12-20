import Job from '../models/job.model.js';
import User from '../models/user.model.js';
import Application from '../models/application.model.js';
import mongoose from 'mongoose';

// Create a new job posting
export const createJob = async (req, res) => {
    try {
        const {
            title,
            description,
            company,
            location,
            type,
            workMode,
            experience,
            salary,
            requirements,
            benefits,
            applicationDeadline,
            tags
        } = req.body;

        // Validate required fields
        if (!title || !description || !company || !location || !type || !experience) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        const job = new Job({
            title,
            description,
            company,
            location,
            type,
            workMode,
            experience,
            salary,
            requirements: requirements || [],
            benefits: benefits || [],
            applicationDeadline,
            postedBy: req.userId,
            tags: tags || []
        });

        await job.save();

        // Populate the postedBy field before sending response
        await job.populate('postedBy', 'firstName lastName profilePicture profileImage');

        res.status(201).json({
            success: true,
            message: 'Job posted successfully',
            job
        });

    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create job posting',
            error: error.message
        });
    }
};

// Get all jobs with filtering and pagination
export const getAllJobs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            type,
            workMode,
            experience,
            location,
            search,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        // Build filter object
        const filter = { isActive: true };

        // Filter out jobs with closed deadlines
        filter.$or = [
            { applicationDeadline: { $exists: false } }, // Jobs with no deadline
            { applicationDeadline: null }, // Jobs with null deadline
            { applicationDeadline: { $gte: new Date() } } // Jobs with deadline in the future or today
        ];

        if (type && type !== 'All Jobs') {
            filter.type = type;
        }
        if (workMode) {
            filter.workMode = workMode;
        }
        if (experience) {
            filter.experience = experience;
        }
        if (location) {
            filter.location = { $regex: location, $options: 'i' };
        }
        if (search) {
            filter.$text = { $search: search };
        }

        // Calculate pagination
        const skip = (page - 1) * limit;
        const sortOrder = order === 'desc' ? -1 : 1;

        // Get jobs with populated data
        const jobs = await Job.find(filter)
            .populate('postedBy', 'firstName lastName profilePicture profileImage')
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(parseInt(limit));

        // Calculate application count for each job (combining old applicants and new Application documents)
        const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
            // Count old-style applicants
            const oldApplicantsCount = job.applicants ? job.applicants.length : 0;
            
            // Count new-style Application documents
            const newApplicationsCount = await Application.countDocuments({ job: job._id });
            
            // Get unique applicants to avoid double counting
            const oldApplicantIds = job.applicants ? job.applicants.map(a => a.user.toString()) : [];
            const newApplications = await Application.find({ job: job._id }, { applicant: 1 });
            const newApplicantIds = newApplications.map(a => a.applicant.toString());
            
            // Count unique applicants
            const allApplicantIds = new Set([...oldApplicantIds, ...newApplicantIds]);
            const totalApplicationCount = allApplicantIds.size;

            const jobObj = job.toObject();
            jobObj.applicationCount = totalApplicationCount;
            return jobObj;
        }));

        // Get total count for pagination
        const total = await Job.countDocuments(filter);

        res.status(200).json({
            success: true,
            jobs: jobsWithCounts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalJobs: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch jobs',
            error: error.message
        });
    }
};

// Get a single job by ID
export const getJobById = async (req, res) => {
    try {
        const { id } = req.params;

        const job = await Job.findById(id)
            .populate('postedBy', 'firstName lastName profilePicture profileImage')
            .populate('applicants.user', 'firstName lastName profilePicture profileImage');

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Increment view count
        job.views += 1;
        await job.save();

        // Calculate application count (combining old applicants and new Application documents)
        const oldApplicantsCount = job.applicants ? job.applicants.length : 0;
        const newApplicationsCount = await Application.countDocuments({ job: job._id });
        
        // Get unique applicants to avoid double counting
        const oldApplicantIds = job.applicants ? job.applicants.map(a => a.user._id.toString()) : [];
        const newApplications = await Application.find({ job: job._id }, { applicant: 1 });
        const newApplicantIds = newApplications.map(a => a.applicant.toString());
        
        // Count unique applicants
        const allApplicantIds = new Set([...oldApplicantIds, ...newApplicantIds]);
        
        const jobObj = job.toObject();
        jobObj.applicationCount = allApplicantIds.size;

        res.status(200).json({
            success: true,
            job: jobObj
        });

    } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch job',
            error: error.message
        });
    }
};

// Update a job (only by the job poster)
export const updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if the user is the job poster
        if (job.postedBy.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own job postings'
            });
        }

        // Update the job
        const updatedJob = await Job.findByIdAndUpdate(
            id,
            { ...updates, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate('postedBy', 'firstName lastName profilePicture profileImage');

        res.status(200).json({
            success: true,
            message: 'Job updated successfully',
            job: updatedJob
        });

    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update job',
            error: error.message
        });
    }
};

// Delete a job (only by the job poster)
export const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;

        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if the user is the job poster
        if (job.postedBy.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own job postings'
            });
        }

        await Job.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Job deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete job',
            error: error.message
        });
    }
};

// Apply for a job
export const applyForJob = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if user already applied
        const alreadyApplied = job.applicants.some(
            applicant => applicant.user.toString() === userId
        );

        if (alreadyApplied) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this job'
            });
        }

        // Add user to applicants
        job.applicants.push({
            user: userId,
            appliedAt: new Date()
        });

        await job.save();

        res.status(200).json({
            success: true,
            message: 'Application submitted successfully'
        });

    } catch (error) {
        console.error('Error applying for job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to apply for job',
            error: error.message
        });
    }
};

// Save/Unsave a job
export const toggleSaveJob = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        const isSaved = job.savedBy.includes(userId);

        if (isSaved) {
            // Remove from saved
            job.savedBy = job.savedBy.filter(savedUserId => savedUserId.toString() !== userId);
        } else {
            // Add to saved
            job.savedBy.push(userId);
        }

        await job.save();

        res.status(200).json({
            success: true,
            message: isSaved ? 'Job removed from saved' : 'Job saved successfully',
            isSaved: !isSaved
        });

    } catch (error) {
        console.error('Error toggling save job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save/unsave job',
            error: error.message
        });
    }
};

// Get jobs posted by the current user
export const getMyJobs = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const jobs = await Job.find({ postedBy: req.userId })
            .populate('postedBy', 'firstName lastName profilePicture profileImage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Job.countDocuments({ postedBy: req.userId });

        res.status(200).json({
            success: true,
            jobs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalJobs: total
            }
        });

    } catch (error) {
        console.error('Error fetching user jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your jobs',
            error: error.message
        });
    }
};

// Get saved jobs by the current user
export const getSavedJobs = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const jobs = await Job.find({ savedBy: req.userId, isActive: true })
            .populate('postedBy', 'firstName lastName profilePicture profileImage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Job.countDocuments({ savedBy: req.userId, isActive: true });

        res.status(200).json({
            success: true,
            jobs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalJobs: total
            }
        });

    } catch (error) {
        console.error('Error fetching saved jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch saved jobs',
            error: error.message
        });
    }
};

// Submit job application
export const submitApplication = async (req, res) => {
    try {
        const { jobId } = req.params;
        const applicantId = req.userId;

        // Validate jobId format
        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid job ID format'
            });
        }

        // Check if job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if user already applied
        const existingApplication = await Application.findOne({ 
            job: jobId, 
            applicant: applicantId 
        });

        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this job'
            });
        }

        // Extract application data from request
        const {
            fullName,
            email,
            phone,
            location,
            experience,
            currentPosition,
            education,
            expectedSalary,
            skills,
            portfolioUrl,
            linkedinUrl,
            githubUrl,
            coverLetter,
            additionalAnswers
        } = req.body;

        // Validate required fields
        if (!fullName || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Full name, email, and phone are required fields'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Handle resume upload (if uploaded via multer)
        let resumeUrl = null;
        let resumeOriginalName = null;
        
        if (req.file) {
            resumeUrl = `public/resumes/${req.file.filename}`;
            resumeOriginalName = req.file.originalname;
        }

        // Create new application
        const application = new Application({
            job: jobId,
            applicant: applicantId,
            fullName,
            email,
            phone,
            location,
            experience: experience ? (isNaN(parseInt(experience)) ? undefined : parseInt(experience)) : undefined,
            currentPosition,
            education,
            expectedSalary,
            skills: skills ? (Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim())) : [],
            portfolioUrl,
            linkedinUrl,
            githubUrl,
            coverLetter,
            resumeUrl,
            resumeOriginalName,
            additionalAnswers: additionalAnswers || {}
        });

        await application.save();

        // Add applicant to job's applicants array (for backward compatibility)
        await Job.findByIdAndUpdate(jobId, {
            $addToSet: { 
                applicants: {
                    user: applicantId,
                    appliedAt: new Date(),
                    status: 'Applied'
                }
            }
        });

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application: {
                _id: application._id,
                status: application.status,
                appliedAt: application.appliedAt
            }
        });

    } catch (error) {
        console.error('Error submitting application:', error);
        console.error('Error stack:', error.stack);
        console.error('Error code:', error.code);
        console.error('Error name:', error.name);
        
        // Handle specific MongoDB errors
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this job'
            });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to submit application',
            error: error.message
        });
    }
};

// Get applications for a job (for job poster)
export const getJobApplications = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.userId;

        // Check if job exists and user is the job poster
        const job = await Job.findById(jobId).populate('postedBy', '_id');
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        if (job.postedBy._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only view applications for jobs you posted'
            });
        }

        // Fetch detailed applications from Application model
        const detailedApplications = await Application.find({ job: jobId })
            .populate('applicant', 'firstName lastName profilePicture email')
            .sort({ appliedAt: -1 });

        // Get old-style applications from Job model
        const jobWithApplicants = await Job.findById(jobId)
            .populate('applicants.user', 'firstName lastName profilePicture email');

        const oldApplications = jobWithApplicants.applicants || [];

        // Create a set of user IDs who have detailed applications to avoid duplicates
        const detailedApplicantIds = new Set(detailedApplications.map(app => app.applicant._id.toString()));

        // Convert old applications to the new format (only if they don't have detailed applications)
        const convertedOldApplications = oldApplications
            .filter(oldApp => !detailedApplicantIds.has(oldApp.user._id.toString()))
            .map(oldApp => ({
                _id: oldApp._id,
                applicant: oldApp.user,
                fullName: `${oldApp.user.firstName} ${oldApp.user.lastName}`,
                email: oldApp.user.email,
                phone: null,
                location: null,
                experience: null,
                currentPosition: null,
                education: null,
                expectedSalary: null,
                skills: [],
                portfolioUrl: null,
                linkedinUrl: null,
                githubUrl: null,
                coverLetter: null,
                resumeUrl: null,
                resumeOriginalName: null,
                status: oldApp.status || 'pending',
                appliedAt: oldApp.appliedAt,
                createdAt: oldApp.appliedAt,
                applicationAge: Math.ceil((new Date() - new Date(oldApp.appliedAt)) / (1000 * 60 * 60 * 24)),
                isLegacyApplication: true
            }));

        // Format detailed applications for frontend
        const formattedDetailedApplications = detailedApplications.map(app => ({
            _id: app._id,
            applicant: app.applicant,
            fullName: app.fullName,
            email: app.email,
            phone: app.phone,
            location: app.location,
            experience: app.experience,
            currentPosition: app.currentPosition,
            education: app.education,
            expectedSalary: app.expectedSalary,
            skills: app.skills,
            portfolioUrl: app.portfolioUrl,
            linkedinUrl: app.linkedinUrl,
            githubUrl: app.githubUrl,
            coverLetter: app.coverLetter,
            resumeUrl: app.resumeUrl,
            resumeOriginalName: app.resumeOriginalName,
            status: app.status,
            appliedAt: app.appliedAt,
            createdAt: app.createdAt,
            applicationAge: app.applicationAge,
            isLegacyApplication: false
        }));

        // Combine both types of applications
        const allApplications = [
            ...formattedDetailedApplications,
            ...convertedOldApplications
        ].sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

        console.log(`Found ${allApplications.length} applications for job ${jobId}:`, {
            detailed: formattedDetailedApplications.length,
            legacy: convertedOldApplications.length
        });

        res.status(200).json({
            success: true,
            applications: allApplications,
            count: allApplications.length
        });

    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications',
            error: error.message
        });
    }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status } = req.body;
        const userId = req.userId;

        // Validate status
        const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        // Find application and check if user is the job poster
        const application = await Application.findById(applicationId)
            .populate({
                path: 'job',
                populate: {
                    path: 'postedBy',
                    select: '_id'
                }
            });

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        if (application.job.postedBy._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only update applications for jobs you posted'
            });
        }

        // Update application status
        application.status = status;
        application.reviewedAt = new Date();
        application.reviewedBy = userId;

        await application.save();

        res.status(200).json({
            success: true,
            message: 'Application status updated successfully',
            application: {
                _id: application._id,
                status: application.status,
                reviewedAt: application.reviewedAt
            }
        });

    } catch (error) {
        console.error('Error updating application status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update application status',
            error: error.message
        });
    }
};

// Get user's applications (for job seeker)
export const getUserApplications = async (req, res) => {
    try {
        const userId = req.userId;
        const { status, page = 1, limit = 10 } = req.query;

        const query = { applicant: userId };
        if (status) {
            query.status = status;
        }

        const applications = await Application.find(query)
            .populate({
                path: 'job',
                select: 'title company location type status',
                populate: {
                    path: 'postedBy',
                    select: 'firstName lastName company'
                }
            })
            .sort({ appliedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Application.countDocuments(query);

        res.status(200).json({
            success: true,
            applications,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalApplications: total
            }
        });

    } catch (error) {
        console.error('Error fetching user applications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications',
            error: error.message
        });
    }
};

// Debug endpoint to check applications
export const debugApplications = async (req, res) => {
    try {
        const { jobId } = req.params;
        
        // Get job with applicants
        const job = await Job.findById(jobId).populate('applicants.user', 'firstName lastName email');
        
        // Get applications from Application model
        const applications = await Application.find({ job: jobId }).populate('applicant', 'firstName lastName email');
        
        // Test the getJobApplications logic without auth
        // Fetch detailed applications from Application model
        const detailedApplications = await Application.find({ job: jobId })
            .populate('applicant', 'firstName lastName profilePicture email')
            .sort({ appliedAt: -1 });

        // Get old-style applications from Job model
        const jobWithApplicants = await Job.findById(jobId)
            .populate('applicants.user', 'firstName lastName profilePicture email');

        const oldApplications = jobWithApplicants.applicants || [];

        // Create a set of user IDs who have detailed applications to avoid duplicates
        const detailedApplicantIds = new Set(detailedApplications.map(app => app.applicant._id.toString()));

        // Convert old applications to the new format
        const convertedOldApplications = oldApplications
            .filter(oldApp => !detailedApplicantIds.has(oldApp.user._id.toString()))
            .map(oldApp => ({
                _id: oldApp._id,
                applicant: oldApp.user,
                fullName: `${oldApp.user.firstName} ${oldApp.user.lastName}`,
                email: oldApp.user.email,
                status: oldApp.status || 'pending',
                appliedAt: oldApp.appliedAt,
                isLegacyApplication: true
            }));

        res.status(200).json({
            success: true,
            jobId,
            rawData: {
                jobApplicants: job?.applicants || [],
                applicationDocuments: applications,
            },
            processedData: {
                detailedApplications: detailedApplications.map(app => ({
                    _id: app._id,
                    fullName: app.fullName,
                    email: app.email,
                    status: app.status
                })),
                convertedOldApplications
            },
            counts: {
                jobApplicants: job?.applicants?.length || 0,
                applicationDocuments: applications.length,
                totalProcessed: detailedApplications.length + convertedOldApplications.length
            }
        });
    } catch (error) {
        console.error('Debug applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug failed',
            error: error.message
        });
    }
};