import { Router, Request, Response, NextFunction } from "express";
import { checkInTicket } from "../services/checkin.js";

const router = Router();

// POST /checkins -> body { "code": "..." }
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body || {};
    const result = await checkInTicket(code);
    res.status(200).json({
      code: result.code,
      checkedInAt: result.checkedInAt,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
