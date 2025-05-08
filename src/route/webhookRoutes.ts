import express,{raw} from "express";

import {createUser} from '../controller/webhookController.ts'
const router = express.Router();


router.post("/",  raw({ type: 'application/json' }),createUser);

export default router;
