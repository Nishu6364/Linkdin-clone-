// Import required hooks and libraries
import React, { useState, useContext } from 'react';

// Contexts for authentication and user data
import { authDataContext } from '../context/AuthContext';
import { userDataContext } from '../context/UserContext';

// Axios for API requests
import axios from 'axios';

// Icons
import { IoClose, IoAdd, IoRemove } from 'react-icons/io5';
import { BsBriefcase } from 'react-icons/bs';

// Post Job Modal Component
const PostJobModal = ({ isOpen, onClose, onJobPosted }) => {

  // Get server URL from Auth Context
  const { serverUrl } = useContext(authDataContext);

  // Get logged-in user data
  const { userData } = useContext(userDataContext);

  // Loading state for submit button
  const [loading, setLoading] = useState(false);

  // Form state to store all job details
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    type: 'Full-time',
    workMode: 'On-site',
    experience: 'Entry Level',
    salary: {
      min: '',
      max: '',
      currency: 'INR',
      period: 'per year'
    },
    requirements: [''],
    benefits: [''],
    applicationDeadline: '',
    tags: ['']
  });

  // Error state for validation messages
  const [errors, setErrors] = useState({});

  // Dropdown options
  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Freelance'];
  const workModes = ['On-site', 'Remote', 'Hybrid'];
  const experienceLevels = ['Entry Level', '1-3 years', '3-5 years', '5-10 years', '10+ years'];
  const currencies = ['INR', 'USD', 'EUR', 'GBP'];
  const salaryPeriods = ['per hour', 'per month', 'per year'];

  // Handle normal & nested input fields (like salary.min)
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Handle nested object fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle array inputs (requirements, benefits, tags)
  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) =>
        i === index ? value : item
      )
    }));
  };

  // Add new input field dynamically
  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  // Remove input field
  const removeArrayField = (field, index) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  // Form validation logic
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.description.trim()) newErrors.description = 'Job description is required';
    if (!formData.company.trim()) newErrors.company = 'Company name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';

    // Salary range validation
    if (formData.salary.min && formData.salary.max) {
      if (parseInt(formData.salary.min) > parseInt(formData.salary.max)) {
        newErrors.salary = 'Minimum salary should be less than maximum salary';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit job form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Stop submission if validation fails
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Prepare clean data for backend
      const submitData = {
        ...formData,
        requirements: formData.requirements.filter(r => r.trim() !== ''),
        benefits: formData.benefits.filter(b => b.trim() !== ''),
        tags: formData.tags.filter(t => t.trim() !== ''),
        salary: (formData.salary.min || formData.salary.max)
          ? {
              ...formData.salary,
              min: formData.salary.min ? parseInt(formData.salary.min) : undefined,
              max: formData.salary.max ? parseInt(formData.salary.max) : undefined,
            }
          : undefined
      };

      // API call to post job
      const response = await axios.post(
        `${serverUrl}/api/jobs`,
        submitData,
        { withCredentials: true }
      );

      // On successful job post
      if (response.data.success) {
        onJobPosted(response.data.job);
        onClose();

        // Reset form
        setFormData({
          title: '',
          description: '',
          company: '',
          location: '',
          type: 'Full-time',
          workMode: 'On-site',
          experience: 'Entry Level',
          salary: { min: '', max: '', currency: 'INR', period: 'per year' },
          requirements: [''],
          benefits: [''],
          applicationDeadline: '',
          tags: ['']
        });
      }
    } catch (error) {
      // Handle API error
      setErrors({
        submit: error.response?.data?.message || 'Failed to post job'
      });
    } finally {
      setLoading(false);
    }
  };

  // Do not render modal if closed
  if (!isOpen) return null;

  // JSX UI
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      {/* Modal Container */}
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BsBriefcase /> Post a Job
          </h2>
          <button onClick={onClose}>
            <IoClose size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* All form fields here */}
        </form>

      </div>
    </div>
  );
};

export default PostJobModal;
