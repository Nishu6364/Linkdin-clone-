import uploadOnCloudinary from "../config/cloudinary.js"
import User from "../models/user.model.js"

export const getCurrentUser=async (req,res)=>{
    try {
        let id=req.userId  
        const user=await User.findById(id).select("-password")
        if(!user){
            return res.status(400).json({message:"user does not found"})
        }

        return res.status(200).json(user)
    } catch (error) {
        console.log(error);

        return res.status(400).json({message:"get current user error"})
    }
}


export const updateProfile = async (req, res) => {
  try {
    console.log("Update profile request received");
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);
    console.log("User ID:", req.userId);
    
    // Validate required fields
    if (!req.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    let { firstName, lastName, userName, headline, location, gender } = req.body;
    
    // Safely parse JSON fields with error handling
    let skills = [];
    let education = [];
    let experience = [];

    try {
      if (req.body.skills && req.body.skills !== 'undefined') {
        skills = JSON.parse(req.body.skills);
      }
    } catch (parseError) {
      console.error("Error parsing skills:", parseError);
      skills = [];
    }

    try {
      if (req.body.education && req.body.education !== 'undefined') {
        education = JSON.parse(req.body.education);
      }
    } catch (parseError) {
      console.error("Error parsing education:", parseError);
      education = [];
    }

    try {
      if (req.body.experience && req.body.experience !== 'undefined') {
        experience = JSON.parse(req.body.experience);
      }
    } catch (parseError) {
      console.error("Error parsing experience:", parseError);
      experience = [];
    }

    console.log("Parsed data:", { firstName, lastName, userName, headline, location, gender, skills, education, experience });

    // Validate gender field
    if (gender && !["male", "female", "other"].includes(gender.toLowerCase())) {
      return res.status(400).json({ message: "Invalid gender value. Must be 'male', 'female', or 'other'" });
    }

    // Check if userName is already taken by another user
    if (userName) {
      const existingUser = await User.findOne({ userName, _id: { $ne: req.userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Username is already taken" });
      }
    }

    // Build update object
    let updateFields = {
      firstName,
      lastName,
      userName,
      headline,
      location,
      gender: gender ? gender.toLowerCase() : undefined,
      skills,
      education,
      experience,
    };

    // Remove undefined fields
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key] === undefined) {
        delete updateFields[key];
      }
    });

    console.log("Update fields before file processing:", updateFields);

    // Handle file uploads with better error handling
    if (req.files && req.files.profileImage && req.files.profileImage[0]) {
      console.log("Processing profile image...");
      try {
        const profileImageUrl = await uploadOnCloudinary(req.files.profileImage[0].path);
        if (profileImageUrl) {
          updateFields.profileImage = profileImageUrl;
          console.log("Profile image uploaded:", profileImageUrl);
        } else {
          console.error("Failed to upload profile image to Cloudinary");
        }
      } catch (uploadError) {
        console.error("Error uploading profile image:", uploadError);
        // Don't fail the entire request if image upload fails
      }
    }

    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      console.log("Processing cover image...");
      try {
        const coverImageUrl = await uploadOnCloudinary(req.files.coverImage[0].path);
        if (coverImageUrl) {
          updateFields.coverImage = coverImageUrl;
          console.log("Cover image uploaded:", coverImageUrl);
        } else {
          console.error("Failed to upload cover image to Cloudinary");
        }
      } catch (uploadError) {
        console.error("Error uploading cover image:", uploadError);
        // Don't fail the entire request if image upload fails
      }
    }

    console.log("Final update fields:", updateFields);

    let user = await User.findByIdAndUpdate(
      req.userId,
      updateFields,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Profile updated successfully");
    return res.status(200).json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: `Validation error: ${validationErrors.join(', ')}` });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field} already exists` });
    }

    return res.status(500).json({ message: `Update profile error: ${error.message}` });
  }
};

export const getprofile=async (req,res)=>{
    try {
        let {userName}=req.params
        let user=await User.findOne({userName}).select("-password")
        if(!user){
            return res.status(400).json({message:"userName does not exist"})
        }
        return res.status(200).json(user)
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:`get profile error ${error}`})
    }
};

export const search=async (req,res)=>{
    try {
        let {query}=req.query
        if(!query){
return res.status(400).json({message:"query is required"})
        }
        let users=await User.find({
            $or:[
                {firstName:{$regex:query,$options:"i"}},
                {lastName:{$regex:query,$options:"i"}},
                {userName:{$regex:query,$options:"i"}},
                {skills:{$in:[query]}}
            ]
        })

        return res.status(200).json(users)
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:`search error ${error}`})
    }
}

export const getSuggestedUser=async (req,res)=>{
    try {
        let currentUser=await User.findById(req.userId).select("connection")

        let suggestedUsers=await User.find({
            _id:{
                $ne:req.userId,
                $nin:currentUser.connection
            }
           
        }).select("-password")

        return res.status(200).json(suggestedUsers)

    } catch (error) {
        console.log(error)
        return res.status(500).json({message:`suggestedUser error ${error}`})
    }
}