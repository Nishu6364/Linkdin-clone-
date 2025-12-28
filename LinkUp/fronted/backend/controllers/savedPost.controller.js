import User from "../models/user.model.js";
import Post from "../models/post.model.js";

// Toggle save/unsave post
export const toggleSavePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.userId;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if post is already saved
        const isPostSaved = user.savedPosts.includes(postId);

        if (isPostSaved) {
            // Remove from saved posts
            user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
            await user.save();
            return res.status(200).json({ 
                message: "Post removed from saved posts",
                saved: false 
            });
        } else {
            // Add to saved posts
            user.savedPosts.push(postId);
            await user.save();
            return res.status(200).json({ 
                message: "Post saved successfully",
                saved: true 
            });
        }

    } catch (error) {
        return res.status(500).json({ message: `Save post error: ${error}` });
    }
};

// Get all saved posts for a user
export const getSavedPosts = async (req, res) => {
    try {
        const userId = req.userId;

        // Find user with populated saved posts
        const user = await User.findById(userId).populate({
            path: 'savedPosts',
            populate: [
                {
                    path: 'author',
                    select: 'firstName lastName profileImage headline userName'
                },
                {
                    path: 'comment.user',
                    select: 'firstName lastName profileImage headline'
                }
            ],
            options: { sort: { createdAt: -1 } }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(user.savedPosts);

    } catch (error) {
        return res.status(500).json({ message: `Get saved posts error: ${error}` });
    }
};

// Check if a post is saved by user
export const checkPostSaved = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isSaved = user.savedPosts.includes(postId);
        return res.status(200).json({ saved: isSaved });

    } catch (error) {
        return res.status(500).json({ message: `Check saved post error: ${error}` });
    }
};
