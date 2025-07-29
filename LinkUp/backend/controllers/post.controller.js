import Post from "../models/post.model.js"
import uploadOnCloudinary from "../config/cloudinary.js";
import { io } from "../index.js";
import Notification from "../models/notification.model.js";
export const createPost=async (req,res)=>{
    try {
        let {description}=req.body
        let newPost;
    if(req.file){
        let image=await uploadOnCloudinary(req.file.path)
         newPost=await Post.create({
            author:req.userId,
            description,
            image
        })
    }else{
        newPost=await Post.create({
            author:req.userId,
            description
        })
    }
return res.status(201).json(newPost)

    } catch (error) {
        return res.status(201).json(`create post error ${error}`)
    }
}

export const getPost=async (req,res)=>{
    try {
        const post=await Post.find()
        .populate("author","firstName lastName profileImage headline userName")
        .populate("comment.user","firstName lastName profileImage headline")
        .sort({createdAt:-1})
        return res.status(200).json(post)
    } catch (error) {
        return res.status(500).json({message:"getPost error"})
    }
}

export const like =async (req,res)=>{
    try {
        let postId=req.params.id
        let userId=req.userId
        let post=await Post.findById(postId)
        if(!post){
            return res.status(400).json({message:"post not found"})
        }
        if(post.like.includes(userId)){
          post.like=post.like.filter((id)=>id!=userId)
        }else{
            post.like.push(userId)
            if(post.author!=userId){
                let notification=await Notification.create({
                    receiver:post.author,
                    type:"like",
                    relatedUser:userId,
                    relatedPost:postId
                })
                // Emit notification event to the post author
                io.emit("newNotification", { 
                    receiverId: post.author.toString(),
                    notification 
                });
            }
           
        }
        await post.save()
       io.emit("likeUpdated",{postId,likes:post.like})
       

     return  res.status(200).json(post)

    } catch (error) {
      return res.status(500).json({message:`like error ${error}`})  
    }
}

export const comment=async (req,res)=>{
    try {
        let postId=req.params.id
        let userId=req.userId
        let {content}=req.body

        let post=await Post.findByIdAndUpdate(postId,{
            $push:{comment:{content,user:userId}}
        },{new:true})
        .populate("comment.user","firstName lastName profileImage headline")
        if(post.author!=userId){
        let notification=await Notification.create({
            receiver:post.author,
            type:"comment",
            relatedUser:userId,
            relatedPost:postId
        })
        // Emit notification event to the post author
        io.emit("newNotification", { 
            receiverId: post.author.toString(),
            notification 
        });
    }
        io.emit("commentAdded",{postId,comm:post.comment})
        return res.status(200).json(post)

    } catch (error) {
        return res.status(500).json({message:`comment error ${error}`})  
    }
}

export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.userId;

        // Find the post first
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if the user is the author of the post
        if (post.author.toString() !== userId) {
            return res.status(403).json({ message: "You can only delete your own posts" });
        }

        // Delete the post
        await Post.findByIdAndDelete(postId);

        // Delete related notifications
        await Notification.deleteMany({ relatedPost: postId });

        // Emit socket event to notify all clients about the deleted post
        io.emit("postDeleted", { postId });

        return res.status(200).json({ message: "Post deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: `Delete post error: ${error}` });
    }
}

// Edit post - allows updating description, visibility, and comment permissions
export const editPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.userId;
        const { description, visibility, commentPermission } = req.body;

        // Find the post first
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if the user is the author of the post
        if (post.author.toString() !== userId) {
            return res.status(403).json({ message: "You can only edit your own posts" });
        }

        // Prepare update object
        const updateData = {};
        if (description !== undefined) updateData.description = description;
        if (visibility !== undefined) updateData.visibility = visibility;
        if (commentPermission !== undefined) updateData.commentPermission = commentPermission;

        // Update the post
        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            updateData,
            { new: true }
        ).populate("author", "firstName lastName profileImage headline userName")
         .populate("comment.user", "firstName lastName profileImage headline");

        // Emit socket event to notify all clients about the updated post
        io.emit("postUpdated", { postId, updatedPost });

        return res.status(200).json(updatedPost);

    } catch (error) {
        return res.status(500).json({ message: `Edit post error: ${error}` });
    }
}