import { Status } from "@slice/data/enums";
import { ERRORS } from "@slice/data/errors";
import { withPrefix } from "@slice/helpers/logger";
import type { Context } from "hono";
import ApiError from "@/utils/apiError";

const handleApiError = (ctx: Context, error?: unknown): Response => {
  const log = withPrefix("[API]");
  log.error(error);

  if (error instanceof ApiError) {
    ctx.status(error.statusCode);
    return ctx.json({ error: error.message, status: Status.Error });
  }

  ctx.status(500);
  return ctx.json({ error: ERRORS.SomethingWentWrong, status: Status.Error });
};

export default handleApiError;
