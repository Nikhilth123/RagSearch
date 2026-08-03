import "dotenv/config";
import express, { Application } from 'express';
import cors from "cors"
import upload from './router/upload'
import {Response,Request} from 'express'
import { chat } from "./controllers/chat";
const app:Application=express();
app.use(cors());
app.use(express.json());
app.get('/',(req:Request,res:Response)=>{
    console.log('hello bhai server is running')
    res.send('sever is running');
})
app.use('/api/files',upload)
app.use('/api/question',chat)
app.listen(process.env.PORT||5000,()=>{
console.log(`server is running on port:${process.env.PORT||5000}`);
});

