import React, { useContext, useState, useEffect } from 'react'
import Nav from '../components/Nav'
import MobileBottomNav from '../components/MobileBottomNav'
import PostJobModal from '../components/PostJobModal'
import ApplicationsDashboard from '../components/ApplicationsDashboard'
import JobApplicationModal from '../components/JobApplicationModal'
import { userDataContext } from '../context/UserContext'
import { authDataContext } from '../context/AuthContext'
import { BsBriefcase, BsBuilding, BsGeoAlt, BsClock, BsBookmark, BsBookmarkFill, BsEye } from "react-icons/bs"
import { IoAdd, IoFilter } from "react-icons/io5"
import axios from 'axios'

function Jobs() {
  const { userData } = useContext(userDataContext)
  const { serverUrl } = useContext(authDataContext)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPostModal, setShowPostModal] = useState(false)
  const [showApplicationsModal, setShowApplicationsModal] = useState(false)
  const [showJobApplicationModal, setShowJobApplicationModal] = useState(false)
  const [selectedJobForApplications, setSelectedJobForApplications] = useState(null)
  const [selectedJobToApply, setSelectedJobToApply] = useState(null)
  const [applyingJobId, setApplyingJobId] = useState(null)
  const [filters, setFilters] = useState({
    type: 'All Jobs',
    workMode: '',
    experience: '',
    search: ''
  })
  const [savedJobs, setSavedJobs] = useState(new Set())
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalJobs: 0,
    hasNext: false
  })

  const jobTypes = ['All Jobs', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Freelance']
  const workModes = ['All Work Modes', 'On-site', 'Remote', 'Hybrid']
  const experienceLevels = ['All Levels', 'Entry Level', '1-3 years', '3-5 years', '5-10 years', '10+ years']

  // Fetch jobs from backend
  const fetchJobs = async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true)
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...(filters.type !== 'All Jobs' && { type: filters.type }),
        ...(filters.workMode && filters.workMode !== 'All Work Modes' && { workMode: filters.workMode }),
        ...(filters.experience && filters.experience !== 'All Levels' && { experience: filters.experience }),
        ...(filters.search && { search: filters.search })
      })

      // Use withCredentials only if user is logged in
      const config = userData ? { withCredentials: true } : {};
      const response = await axios.get(`${serverUrl}/api/jobs?${params}`, config)
      
      if (response.data.success) {
        console.log('Jobs fetched:', response.data.jobs.map(job => ({ 
          id: job._id, 
          title: job.title, 
          applicationCount: job.applicationCount 
        })));
        
        if (append) {
          setJobs(prev => [...prev, ...response.data.jobs])
        } else {
          setJobs(response.data.jobs)
        }
        setPagination({
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalJobs: response.data.pagination.totalJobs,
          hasNext: response.data.pagination.hasNext
        })
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setJobs([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  // Open application modal
  const handleApplyJob = (job) => {
    if (!userData) {
      alert('Please login to apply for jobs');
      return;
    }
    setSelectedJobToApply(job);
    setShowJobApplicationModal(true);
  };

  // Handle successful application submission
  const handleApplicationSubmitted = () => {
    console.log('Application submitted, refreshing jobs...');
    // Refresh jobs to show updated application count
    fetchJobs();
  };

  // Open applications dashboard for job poster
  const handleManageApplications = (job) => {
    setSelectedJobForApplications(job);
    setShowApplicationsModal(true);
  };

  // Check if current user is the job poster
  const isJobPoster = (job) => {
    return userData && job.postedBy && job.postedBy._id === userData._id;
  };

  // Save/unsave a job
  const handleSaveJob = async (jobId) => {
    try {
      const response = await axios.post(`${serverUrl}/api/jobs/${jobId}/save`, {}, {
        withCredentials: true
      })
      if (response.data.success) {
        const newSavedJobs = new Set(savedJobs)
        if (savedJobs.has(jobId)) {
          newSavedJobs.delete(jobId)
        } else {
          newSavedJobs.add(jobId)
        }
        setSavedJobs(newSavedJobs)
      }
    } catch (error) {
      console.error('Error saving job:', error)
    }
  }

  // Check if application deadline has passed
  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  }

  // Check if user has applied for a job
  const hasApplied = (job) => {
    if (!userData || !job.applicants) return false;
    return job.applicants.some(applicant => 
      applicant.user === userData._id || applicant.user?._id === userData._id
    );
  }

  // Format salary
  const formatSalary = (salary) => {
    if (!salary || !salary.min) return null
    
    if (salary.max) {
      return `$${salary.min.toLocaleString()} - $${salary.max.toLocaleString()}${salary.period ? ` / ${salary.period}` : ''}`
    }
    return `$${salary.min.toLocaleString()}${salary.period ? ` / ${salary.period}` : ''}`
  }

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`
    
    const diffInMonths = Math.floor(diffInDays / 30)
    return `${diffInMonths}mo ago`
  }

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault()
    fetchJobs(1)
  }

  // Load more jobs
  const loadMoreJobs = () => {
    if (pagination.hasNext) {
      fetchJobs(pagination.currentPage + 1, true)
    }
  }

  // Initial load
  useEffect(() => {
    fetchJobs()
  }, [serverUrl])

  // Refetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchJobs(1)
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [filters])

  return (
    <div className='bg-gray-50 min-h-screen'>
      <Nav />
      <div className='pt-16 pb-16 md:pb-4'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          {/* Header */}
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900 mb-2'>Jobs for you</h1>
              <p className='text-gray-600'>
                {loading ? 'Loading jobs...' : `${pagination.totalJobs} job opportunities available`}
              </p>
            </div>
            
            {userData && (
              <button
                onClick={() => setShowPostModal(true)}
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors'
              >
                <IoAdd className="w-5 h-5" />
                Post Job
              </button>
            )}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6'>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search for jobs, companies, or keywords..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Job Filters */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6'>
            <div className="flex items-center gap-2 mb-3">
              <IoFilter className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-700">Filters</span>
            </div>
            
            {/* Job Type Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
              <div className='flex flex-wrap gap-2'>
                {jobTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => handleFilterChange('type', type)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      filters.type === type
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Work Mode and Experience Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Mode</label>
                <select
                  value={filters.workMode}
                  onChange={(e) => handleFilterChange('workMode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {workModes.map(mode => (
                    <option key={mode} value={mode === 'All Work Modes' ? '' : mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                <select
                  value={filters.experience}
                  onChange={(e) => handleFilterChange('experience', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {experienceLevels.map(level => (
                    <option key={level} value={level === 'All Levels' ? '' : level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className='space-y-4'>
                {jobs.length > 0 ? jobs.map((job) => (
                  <div key={job._id} className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow'>
                    <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-start gap-3 mb-3'>
                          <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                            <BsBuilding className='w-6 h-6 text-blue-600'/>
                          </div>
                          <div className='flex-1'>
                            <div className="flex items-start justify-between">
                              <h3 className='text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer'>
                                {job.title}
                              </h3>
                              <button
                                onClick={() => handleSaveJob(job._id)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                {savedJobs.has(job._id) ? (
                                  <BsBookmarkFill className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <BsBookmark className="w-5 h-5 text-gray-400" />
                                )}
                              </button>
                            </div>
                            <p className='text-gray-700 font-medium'>{job.company}</p>
                            <div className='flex items-center gap-4 mt-2 text-sm text-gray-600 flex-wrap'>
                              <div className='flex items-center gap-1'>
                                <BsGeoAlt className='w-4 h-4'/>
                                <span>{job.location}</span>
                              </div>
                              <div className='flex items-center gap-1'>
                                <BsBriefcase className='w-4 h-4'/>
                                <span>{job.type}</span>
                                {job.workMode && <span>• {job.workMode}</span>}
                              </div>
                              <div className='flex items-center gap-1'>
                                <BsClock className='w-4 h-4'/>
                                <span>{formatTimeAgo(job.createdAt)}</span>
                              </div>
                              {job.views > 0 && (
                                <div className='flex items-center gap-1'>
                                  <BsEye className='w-4 h-4'/>
                                  <span>{job.views} views</span>
                                </div>
                              )}
                            </div>
                            {job.experience && (
                              <div className="mt-1">
                                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                  {job.experience}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <p className='text-gray-600 text-sm mb-3 line-clamp-2'>
                          {job.description}
                        </p>

                        {/* Salary */}
                        {formatSalary(job.salary) && (
                          <div className="mb-3">
                            <span className="inline-block px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                              💰 {formatSalary(job.salary)}
                            </span>
                          </div>
                        )}
                        
                        {/* Requirements */}
                        {job.requirements && job.requirements.length > 0 && (
                          <div className='flex flex-wrap gap-2 mb-4'>
                            {job.requirements.slice(0, 5).map((skill, index) => (
                              <span key={index} className='px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs'>
                                {skill}
                              </span>
                            ))}
                            {job.requirements.length > 5 && (
                              <span className='px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs'>
                                +{job.requirements.length - 5} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Application Stats */}
                        <div className="text-xs text-gray-500 mb-3 flex flex-wrap gap-3">
                          {job.applicationCount > 0 && (
                            <span className="flex items-center gap-1">
                              👥 {job.applicationCount} application{job.applicationCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          {job.applicationDeadline && (
                            <span className={`flex items-center gap-1 ${
                              isDeadlinePassed(job.applicationDeadline) 
                                ? 'text-red-500 font-medium' 
                                : 'text-orange-500'
                            }`}>
                              ⏰ Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                              {isDeadlinePassed(job.applicationDeadline) && ' (Expired)'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className='flex flex-col gap-2 sm:ml-4 mt-3 sm:mt-0'>
                        {!userData ? (
                          <button
                            onClick={() => alert('Please login to apply for jobs')}
                            className='px-6 py-2 bg-gray-400 text-white rounded-lg font-medium text-sm cursor-pointer'
                          >
                            Login to Apply
                          </button>
                        ) : isJobPoster(job) ? (
                          <button
                            onClick={() => handleManageApplications(job)}
                            className='px-6 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 cursor-pointer flex items-center gap-2'
                          >
                            <BsEye className="w-4 h-4" />
                            Manage Applications ({job.applicationCount || 0})
                          </button>
                        ) : hasApplied(job) ? (
                          <button
                            disabled
                            className='px-6 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm cursor-not-allowed flex items-center gap-2'
                          >
                            ✓ Applied
                          </button>
                        ) : isDeadlinePassed(job.applicationDeadline) ? (
                          <button
                            disabled
                            className='px-6 py-2 bg-red-100 text-red-700 rounded-lg font-medium text-sm cursor-not-allowed'
                          >
                            Deadline Passed
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApplyJob(job)}
                            className='px-6 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 cursor-pointer'
                          >
                            Apply Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12">
                    <BsBriefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-600 mb-6">Try adjusting your filters or search terms.</p>
                    {userData && (
                      <button
                        onClick={() => setShowPostModal(true)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                      >
                        Post the First Job
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Load More */}
              {jobs.length > 0 && pagination.hasNext && (
                <div className='text-center mt-8'>
                  <button
                    onClick={loadMoreJobs}
                    className='px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors'
                  >
                    Load more jobs ({pagination.totalJobs - jobs.length} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <MobileBottomNav/>

      {/* Post Job Modal */}
      <PostJobModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onJobPosted={(newJob) => {
          setJobs(prev => [newJob, ...prev])
          setPagination(prev => ({ ...prev, totalJobs: prev.totalJobs + 1 }))
        }}
      />

      {/* Applications Dashboard Modal */}
      {showApplicationsModal && selectedJobForApplications && (
        <ApplicationsDashboard
          jobId={selectedJobForApplications._id}
          onClose={() => {
            setShowApplicationsModal(false);
            setSelectedJobForApplications(null);
          }}
        />
      )}

      {/* Job Application Modal */}
      {showJobApplicationModal && selectedJobToApply && (
        <JobApplicationModal
          job={selectedJobToApply}
          isOpen={showJobApplicationModal}
          onClose={() => {
            setShowJobApplicationModal(false);
            setSelectedJobToApply(null);
          }}
          onSubmit={handleApplicationSubmitted}
        />
      )}
    </div>
  )
}

export default Jobs
