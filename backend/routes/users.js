import express from "express"
import {user,validate} from "../models/user.model.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
const router = express.Router();

router.post("/", async (req,res)=>{
    try{
        const {error} = validate(req.body);
        if(error)
            return res.status(400).send({message:error.details[0].message});

        const existingUser = await user.findOne({email:req.body.email});
        if(existingUser)
            return res.status(409).send({message:"User already exists"});

        const salt = await bcrypt.genSalt(Number(process.env.SALT));
        const hashpassword = await bcrypt.hash(req.body.password,salt);

        await new user({...req.body,password:hashpassword}).save();
        res.status(201).send({message:"user created successfully"});
    }
    catch(error){
        console.error("User registration error:", error);
        return res.status(500).send({message:"Internal Server Error"});
    }
});


export default router;
