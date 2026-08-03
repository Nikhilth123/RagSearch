import express from 'express';
import {uploadfile} from '../controllers/upload'
import upload from "../middlewares/multer";
const router =express.Router();
router.post('/upload',upload.single("pdf"),uploadfile)
export default router;