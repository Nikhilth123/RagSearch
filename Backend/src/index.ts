import express, { Application } from 'express';
import cors from "cors"
import uploads from './router/upload'
import {Response,Request} from 'express'
const app:Application=express();
app.use(cors());
app.use(express.json());
app.use('/api/files',uploads)
app.get('/',(req:Request,res:Response)=>{
    console.log('hello bhai server is running')
    res.send('sever is running');
})
app.listen(process.env.Port||5000,()=>{
console.log(`server is running on port:${process.env.PORT||5000}`);
});

