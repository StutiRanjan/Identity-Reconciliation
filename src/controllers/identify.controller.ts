import { Request, Response } from "express";
import { identifyContact } from "../services/contact.service";

export const identify = async (req: Request, res: Response) => {
  try {
    const result = await identifyContact(req.body);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
};