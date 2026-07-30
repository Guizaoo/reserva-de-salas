import "server-only";

export function hasPostgresErrorCode(error: unknown, code: string) {
  let currentError = error;

  while (typeof currentError === "object" && currentError !== null) {
    if ("code" in currentError && currentError.code === code) {
      return true;
    }

    if (!("cause" in currentError)) {
      return false;
    }

    currentError = currentError.cause;
  }

  return false;
}
