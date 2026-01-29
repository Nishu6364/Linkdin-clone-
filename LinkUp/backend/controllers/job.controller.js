// Import required models
import Job from '../models/job.model.js';
import User from '../models/user.model.js';
import Application from '../models/application.model.js';
import mongoose from 'mongoose';

/* =========================================================
   CREATE A NEW JOB POSTING
========================================================= */
export const createJob = async (req, res) => {
    try {
        // Destructure job details from request body
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

        // Validate mandatory fields
        if (!title || !description || !company || !location || !type || !experience) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Create new job document
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
            postedBy: req.userId, // Logged-in user
            tags: tags || []
        });

        // Save job to database
        await job.save();

        // Populate job poster details
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

/* =========================================================
   GET ALL JOBS (FILTER + SEARCH + PAGINATION)
========================================================= */
export const getAllJobs = async (req, res) => {
    try {
        // Query parameters
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

        // Base filter
        const filter = { isActive: true };

        // Exclude expired job deadlines
        filter.$or = [
            { applicationDeadline: { $exists: false } },
            { applicationDeadline: null },
            { applicationDeadline: { $gte: new Date() } }
        ];

        // Apply optional filters
        if (type && type !== 'All Jobs') filter.type = type;
        if (workMode) filter.workMode = workMode;
        if (experience) filter.experience = experience;
        if (location) filter.location = { $regex: location, $options: 'i' };
        if (search) filter.$text = { $search: search };

        // Pagination & sorting
        const skip = (page - 1) * limit;
        const sortOrder = order === 'desc' ? -1 : 1;

        // Fetch jobs
        const jobs = await Job.find(filter)
            .populate('postedBy', 'firstName lastName profilePicture profileImage')
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(parseInt(limit));

        // Calculate application count per job
        const jobsWithCounts = await Promise.all(
            jobs.map(async (job) => {
                const oldApplicants = job.applicants || [];
                const newApplications = await Application.find({ job: job._id }, { applicant: 1 });

                // Merge both application sources uniquely
                const applicantIds = new Set([
                    ...oldApplicants.map(a => a.user.toString()),
                    ...newApplications.map(a => a.applicant.toString())
                ]);

                const jobObj = job.toObject();
                jobObj.applicationCount = applicantIds.size;
                return jobObj;
            })
        );

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

/* =========================================================
   GET SINGLE JOB BY ID
========================================================= */
export const getJobById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find job and populate relations
        const job = await Job.findById(id)
            .populate('postedBy', 'firstName lastName profilePicture profileImage')
            .populate('applicants.user', 'firstName lastName profilePicture profileImage');

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        // Increase view count
        job.views += 1;
        await job.save();

        // Calculate unique application count
        const oldIds = job.applicants.map(a => a.user._id.toString());
        const newApps = await Application.find({ job: job._id }, { applicant: 1 });
        const newIds = newApps.map(a => a.applicant.toString());

        const jobObj = job.toObject();
        jobObj.applicationCount = new Set([...oldIds, ...newIds]).size;

        res.status(200).json({ success: true, job: jobObj });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch job' });
    }
};

/* =========================================================
   UPDATE JOB (ONLY JOB POSTER)
========================================================= */
export const updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const job = await Job.findById(id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

        // Authorization check
        if (job.postedBy.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const updatedJob = await Job.findByIdAndUpdate(
            id,
            { ...updates, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate('postedBy', 'firstName lastName profilePicture profileImage');

        res.status(200).json({ success: true, job: updatedJob });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update job' });
    }
};

/* =========================================================
   DELETE JOB (ONLY JOB POSTER)
========================================================= */
export const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;

        const job = await Job.findById(id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

        if (job.postedBy.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await Job.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Job deleted successfully' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete job' });
    }
};

/* =========================================================
   APPLY FOR JOB (LEGACY METHOD)
========================================================= */
export const applyForJob = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const job = await Job.findById(id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

        // Prevent duplicate applications
        if (job.applicants.some(a => a.user.toString() === userId)) {
            return res.status(400).json({ success: false, message: 'Already applied' });
        }

        job.applicants.push({ user: userId, appliedAt: new Date() });
        await job.save();

        res.status(200).json({ success: true, message: 'Application submitted' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to apply' });
    }
};

/* =========================================================
   SAVE / UNSAVE JOB
========================================================= */
export const toggleSaveJob = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const job = await Job.findById(id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

        const isSaved = job.savedBy.includes(userId);

        // Toggle save
        job.savedBy = isSaved
            ? job.savedBy.filter(uid => uid.toString() !== userId)
            : [...job.savedBy, userId];

        await job.save();

        res.status(200).json({
            success: true,
            message: isSaved ? 'Removed from saved' : 'Job saved',
            isSaved: !isSaved
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to save job' });
    }
};
