import express from "express";
import {user, validateLogin} from "../models/user.model.js";
import joi from "joi";
import bcrypt from "bcrypt";
const router = express.Router();

router.post("/", async (req, res)=>{
    try{
        const {error} = validateLogin(req.body);
        if(error)
            return res.status(400).send({message:error.details[0].message});

        const existingUser = await user.findOne({email:req.body.email});
        if(!existingUser)
            return res.status(401).send({message:"Invalid Email or Password"});

        const validpassword = await bcrypt.compare(
            req.body.password, existingUser.password
        );
        if(!validpassword)
            return res.status(401).send({message:"Invalid Email or Password"});

        const token = existingUser.generateAuthToken();
        res.status(200).send({data:token, message:"Logged in successfully"});

    }
    catch(error){
        console.error("Login error:", error);
        return res.status(500).send({message:"Internal Error"});
    }
});

export default router;
