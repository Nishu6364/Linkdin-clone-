import express from 'express';
import {
    createJob,
    getAllJobs,
    getJobById,
    updateJob,
    deleteJob,
    applyForJob,
    toggleSaveJob,
    getMyJobs,
    getSavedJobs,
    submitApplication,
    getJobApplications,
    updateApplicationStatus,
    getUserApplications,
    debugApplications
} from '../controllers/job.controller.js';
import isAuthenticated from '../middlewares/isAuth.js';
import resumeUpload from '../middlewares/resumeUpload.js';

const router = express.Router();

// Public routes
router.get('/', getAllJobs);           // GET /api/jobs - Get all jobs with filtering
router.get('/:id', getJobById);        // GET /api/jobs/:id - Get single job by ID

// Protected routes (require authentication)
router.post('/', isAuthenticated, createJob);              // POST /api/jobs - Create new job
router.put('/:id', isAuthenticated, updateJob);            // PUT /api/jobs/:id - Update job
router.delete('/:id', isAuthenticated, deleteJob);         // DELETE /api/jobs/:id - Delete job

router.post('/:id/apply', isAuthenticated, applyForJob);    // POST /api/jobs/:id/apply - Apply for job
router.post('/:id/save', isAuthenticated, toggleSaveJob);   // POST /api/jobs/:id/save - Save/unsave job

router.get('/user/my-jobs', isAuthenticated, getMyJobs);    // GET /api/jobs/user/my-jobs - Get user's posted jobs
router.get('/user/saved', isAuthenticated, getSavedJobs);  // GET /api/jobs/user/saved - Get user's saved jobs

// Application routes
router.post('/:jobId/applications', isAuthenticated, resumeUpload.single('resume'), submitApplication);  // POST /api/jobs/:jobId/applications - Submit application
router.get('/:jobId/applications', isAuthenticated, getJobApplications);  // GET /api/jobs/:jobId/applications - Get applications for a job
router.patch('/applications/:applicationId/status', isAuthenticated, updateApplicationStatus);  // PATCH /api/jobs/applications/:applicationId/status - Update application status
router.get('/user/applications', isAuthenticated, getUserApplications);  // GET /api/jobs/user/applications - Get user's applications

// Debug route (temporary - no auth for testing)
router.get('/:jobId/debug/applications', debugApplications);  // GET /api/jobs/:jobId/debug/applications - Debug applications
router.get('/:jobId/debug/applications-detailed', getJobApplications);  // GET /api/jobs/:jobId/debug/applications-detailed - Test applications endpoint

export default router;