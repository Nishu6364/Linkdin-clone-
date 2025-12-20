import React, { useState, useEffect, useContext } from 'react';
import { ArrowLeft, Download, Eye, EyeOff, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap, User } from 'lucide-react';
import { userDataContext } from '../context/UserContext';
import { authDataContext } from '../context/AuthContext';
import axios from 'axios';

const ApplicationsDashboard = ({ jobId, onClose }) => {
  const { userData } = useContext(userDataContext);
  const { serverUrl } = useContext(authDataContext);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!userData) {
        throw new Error('Please login to view applications');
      }

      console.log('Fetching applications for job:', jobId);
      console.log('Server URL:', serverUrl);
      console.log('User logged in:', !!userData);
      
      const response = await axios.get(`${serverUrl}/api/jobs/${jobId}/applications`, {
        withCredentials: true
      });

      console.log('Response data:', response.data);

      if (response.data.success) {
        setApplications(response.data.applications || []);
        console.log('Set applications:', response.data.applications?.length || 0);
      } else {
        throw new Error(response.data.message || 'Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const response = await axios.patch(`${serverUrl}/api/jobs/applications/${applicationId}/status`, {
        status: newStatus
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        // Update local state
        setApplications(applications.map(app => 
          app._id === applicationId ? { ...app, status: newStatus } : app
        ));
        
        if (selectedApplication && selectedApplication._id === applicationId) {
          setSelectedApplication({ ...selectedApplication, status: newStatus });
        }
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert(error.response?.data?.message || 'Failed to update application status');
    }
  };

  const downloadResume = (resumeUrl, applicantName) => {
    if (!resumeUrl) {
      alert('No resume available for download');
      return;
    }

    const link = document.createElement('a');
    link.href = `${serverUrl}/${resumeUrl}`;
    link.download = `${applicantName.replace(/\s+/g, '_')}_resume.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const ApplicationCard = ({ application }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              {application.fullName || application.name || 'No Name Provided'}
            </h3>
            <p className="text-gray-600 text-sm">
              {application.email || 'No Email Provided'}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
          {application.status || 'pending'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {application.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{application.phone}</span>
          </div>
        )}
        
        {application.location && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{application.location}</span>
          </div>
        )}
        
        {application.experience && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Briefcase className="w-4 h-4" />
            <span>{application.experience} years experience</span>
          </div>
        )}
        
        {application.education && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <GraduationCap className="w-4 h-4" />
            <span>{application.education}</span>
          </div>
        )}
      </div>

      {application.skills && application.skills.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Skills:</p>
          <div className="flex flex-wrap gap-1">
            {application.skills.slice(0, 5).map((skill, index) => (
              <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                {skill}
              </span>
            ))}
            {application.skills.length > 5 && (
              <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                +{application.skills.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={() => {
            setSelectedApplication(application);
            setShowDetailModal(true);
          }}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Eye className="w-4 h-4" />
          <span>View Details</span>
        </button>
        
        {application.resumeUrl && (
          <button
            onClick={() => downloadResume(application.resumeUrl, application.fullName || application.name)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        <select
          value={application.status || 'pending'}
          onChange={(e) => updateApplicationStatus(application._id, e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
    </div>
  );

  const DetailModal = ({ application, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <EyeOff className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <p className="text-gray-900">{application.fullName || application.name || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{application.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-gray-900">{application.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <p className="text-gray-900">{application.location || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                <p className="text-gray-900">{application.experience ? `${application.experience} years` : 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                <p className="text-gray-900">{application.education || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Position</label>
                <p className="text-gray-900">{application.currentPosition || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Salary</label>
                <p className="text-gray-900">{application.expectedSalary || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Skills */}
          {application.skills && application.skills.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {application.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cover Letter */}
          {application.coverLetter && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Cover Letter</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{application.coverLetter}</p>
              </div>
            </div>
          )}

          {/* Resume */}
          {application.resumeUrl && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Resume</h3>
              <button
                onClick={() => downloadResume(application.resumeUrl, application.fullName || application.name)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Resume</span>
              </button>
            </div>
          )}

          {/* Application Date */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Applied On</label>
                <p className="text-gray-900">
                  {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'Not available'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={application.status || 'pending'}
                  onChange={(e) => updateApplicationStatus(application._id, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Applications</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchApplications}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Jobs</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">Job Applications</h1>
          </div>
          <div className="text-sm text-gray-600">
            {applications.length} {applications.length === 1 ? 'application' : 'applications'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Yet</h3>
              <p className="text-gray-600">
                No one has applied for this job position yet. Applications will appear here once candidates start applying.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {applications.map((application) => (
              <ApplicationCard key={application._id} application={application} />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedApplication && (
        <DetailModal
          application={selectedApplication}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedApplication(null);
          }}
        />
      )}
    </div>
  );
};

export default ApplicationsDashboard;
