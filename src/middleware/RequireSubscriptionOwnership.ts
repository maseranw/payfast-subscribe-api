import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { SupabaseService } from "../services/SupabaseService";

const supabaseAuthClient = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

const supabaseService = new SupabaseService(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export const requireSubscriptionOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const accessToken = authHeader.slice("Bearer ".length);
  const { data: userData, error: authError } = await supabaseAuthClient.auth.getUser(
    accessToken
  );

  if (authError || !userData.user) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }

  const payfastToken = req.params.token;
  if (!payfastToken || typeof payfastToken !== "string") {
    res.status(400).json({ error: "Missing PayFast token" });
    return;
  }

  const ownerId = await supabaseService.getSubscriptionOwnerByToken(payfastToken);
  if (!ownerId) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  if (ownerId !== userData.user.id) {
    res.status(403).json({ error: "You do not have access to this subscription" });
    return;
  }

  next();
};
