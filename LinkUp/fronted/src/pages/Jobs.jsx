import React, { useContext } from 'react'
import Nav from '../components/Nav'
import MobileBottomNav from '../components/MobileBottomNav'
import { userDataContext } from '../context/UserContext'
import { BsBriefcase, BsBuilding, BsGeoAlt, BsClock } from "react-icons/bs"

function Jobs() {
  const { userData } = useContext(userDataContext)

  // Sample job data - you can replace this with real data from your backend
  const jobData = [
    {
      id: 1,
      title: "Full Stack Developer",
      company: "Tech Solutions Inc.",
      location: "Ahmedabad, Gujarat",
      type: "Full-time",
      postedTime: "2 days ago",
      description: "We are looking for a skilled full stack developer to join our team...",
      requirements: ["React", "Node.js", "MongoDB", "JavaScript"]
    },
    {
      id: 2,
      title: "Frontend Developer",
      company: "Digital Agency",
      location: "Mumbai, Maharashtra",
      type: "Remote",
      postedTime: "5 days ago",
      description: "Join our creative team as a frontend developer...",
      requirements: ["React", "Vue.js", "CSS", "JavaScript"]
    },
    {
      id: 3,
      title: "Backend Developer",
      company: "StartupXYZ",
      location: "Bangalore, Karnataka",
      type: "Full-time",
      postedTime: "1 week ago",
      description: "We need a backend developer with strong API development skills...",
      requirements: ["Node.js", "Python", "PostgreSQL", "AWS"]
    }
  ]

  return (
    <div className='w-full min-h-screen bg-gray-50 pt-[70px] pb-16 md:pb-0'>
      <div className='max-w-[1200px] mx-auto px-2 sm:px-4'>
        <div className='pt-4 sm:pt-6'>
          <Nav/>
          <MobileBottomNav/>
          
          {/* Header */}
          <div className='mb-6'>
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>Jobs for you</h1>
            <p className='text-gray-600'>Based on your profile and search history</p>
          </div>

          {/* Job Filters */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6'>
            <div className='flex flex-wrap gap-3'>
              <button className='px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium border border-blue-200'>
                All Jobs
              </button>
              <button className='px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-sm border border-gray-200 hover:bg-gray-100'>
                Remote
              </button>
              <button className='px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-sm border border-gray-200 hover:bg-gray-100'>
                Full-time
              </button>
              <button className='px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-sm border border-gray-200 hover:bg-gray-100'>
                Part-time
              </button>
              <button className='px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-sm border border-gray-200 hover:bg-gray-100'>
                Internship
              </button>
            </div>
          </div>

          {/* Job Listings */}
          <div className='space-y-4'>
            {jobData.map((job) => (
              <div key={job.id} className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow'>
                <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-start gap-3 mb-3'>
                      <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                        <BsBuilding className='w-6 h-6 text-blue-600'/>
                      </div>
                      <div className='flex-1'>
                        <h3 className='text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer'>
                          {job.title}
                        </h3>
                        <p className='text-gray-700 font-medium'>{job.company}</p>
                        <div className='flex items-center gap-4 mt-2 text-sm text-gray-600'>
                          <div className='flex items-center gap-1'>
                            <BsGeoAlt className='w-4 h-4'/>
                            <span>{job.location}</span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <BsBriefcase className='w-4 h-4'/>
                            <span>{job.type}</span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <BsClock className='w-4 h-4'/>
                            <span>{job.postedTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className='text-gray-600 text-sm mb-3 line-clamp-2'>
                      {job.description}
                    </p>
                    
                    <div className='flex flex-wrap gap-2 mb-4'>
                      {job.requirements.map((skill, index) => (
                        <span key={index} className='px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs'>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className='flex flex-col gap-2 sm:ml-4'>
                    <button className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors'>
                      Apply
                    </button>
                    <button className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors'>
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className='text-center mt-8'>
            <button className='px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors'>
              Load more jobs
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Jobs
