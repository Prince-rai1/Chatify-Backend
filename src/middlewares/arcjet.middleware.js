import aj from "../utils/arcjet";
import { isSpoofedBot } from "@arcjet/inspect";

export const arcjetMiddleware = async (req, res, next) => {
 try {
     const decision = await aj.protect(req);
   
     if (decision.isDenied()) {
       if (decision.reason.isRateLimit()) {
         return res.status(429).json({
           success: false,
           message: "Too many requests. Please try again later.",
         });
       }
   
       if (decision.reason.isBot()) {
         return res.status(403).json({
           success: false,
           message: "Bots are not allowed.",
         });
       }
       return res.status(403).json({
         success: false,
         message: "Request blocked.",
       });
     }

      if (decision.results?.some(isSpoofedBot)) {
         return res.status(403).json({
           success: false,
           message: "Spoofed bot detected.",
         });
       }
   
     next();
 } catch (error) {
    console.log("Error in arcjet: ", error)

    next(error)
 }
};
