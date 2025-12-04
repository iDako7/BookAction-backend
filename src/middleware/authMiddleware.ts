import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
// import { JWTPayload } from "../dtos/request/AutheticationDTO.js";
import { JwtPayload } from "jsonwebtoken";

// extend express request type to include user. following are explains of it
// https://stackoverflow.com/questions/37377731/extend-express-request-object-using-typescript
// https://www.typescriptlang.org/docs/handbook/declaration-merging.html
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload; //optional to have a payload, because it's not a default setting
    }
  }
}

// verify jwt token
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let accessSecret = null;
  if (process.env.JWT_ACCESS_SECRET) {
    accessSecret = process.env.JWT_ACCESS_SECRET!;
  } else {
    throw new Error("JWT access secret not configured");
  }

  try {
    // get token from authorization header
    const authHeader = req.headers.authorization; //? why we don't use cookie here

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: "No token provided",
      });
      return;
    }

    // check bearer format
    // bearer is a schema designed to carry information using in login
    // it's format is `<Type> <Credentials>`, for example: Authorization: Bearer <token>
    const [scheme, token] = authHeader.split(" ");

    // check the value of key and whether the value exist
    if (scheme !== "Bearer" || !token) {
      res.status(401).json({
        success: false,
        message: "Invalid token format. Use: Bearer <token>",
      });
      return;
    }

    // verify payload
    const payload = jwt.verify(token, accessSecret) as JwtPayload;

    // attach user to request
    req.user = payload;

    // pass to next middleware
    next();
  } catch (error: any) {
    console.error("Auth middleware error:", error.message);

    // For any token verification error (expired, invalid, malformed, syntax error),
    // we should return 401 so the frontend can attempt to refresh.
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
    return;
  }
}

// check specific roles
// this validation is necessary for authorization to prevent abuse
export function roleRequire(
  legalRoles: string[],
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  if (!legalRoles.includes(req.user.role)) {
    res.status(403).json({
      success: false,
      message: "Insufficient permissions for lacking role info",
    });
    return;
  }

  next();
}
