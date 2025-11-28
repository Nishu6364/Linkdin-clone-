import mongoose from "mongoose"

const postSchema=new mongoose.Schema({
author:{
   type: mongoose.Schema.Types.ObjectId,
   ref:"User",
   required:true
},
description:{
    type:String,
    default:""
},
image:{
    type:String
},
visibility:{
    type:String,
    enum:['public', 'connections', 'private'],
    default:'public'
},
commentPermission:{
    type:String,
    enum:['everyone', 'connections', 'nobody'],
    default:'everyone'
},
like:[
   {
    type: mongoose.Schema.Types.ObjectId,
    ref:"User"
}
],
comment:[
    {
        content:{type:String},
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User" 
        }
    }
]


},{timestamps:true})

const Post=mongoose.model("Post",postSchema)
export default Post