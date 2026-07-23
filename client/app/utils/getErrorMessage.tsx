/* eslint-disable @typescript-eslint/no-explicit-any */

// Turns any error thrown by RTK Query (or a plain Error) into a human-readable
// message. RTK Query errors come in several shapes:
//  - Server errors:   { status: 400, data: { message: "..." } }
//  - Network/CORS:    { status: "FETCH_ERROR", error: "TypeError: Failed to fetch" }
//  - Timeouts:        { status: "TIMEOUT_ERROR" }
//  - Bad JSON:        { status: "PARSING_ERROR" }
//  - Serialized err:  { message: "..." }
// The old code only handled the first shape (`error.data.message`) and silently
// showed nothing for the rest — so real failures like "login failed" or a server
// being unreachable never surfaced to the user.
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (!error) return fallback;
  const err = error as any;

  // Server responded with a body
  if (err.data) {
    if (typeof err.data === "string") return err.data;
    if (typeof err.data.message === "string") return err.data.message;
    if (typeof err.data.error === "string") return err.data.error;
  }

  // Network / client-side fetch errors (string status codes)
  if (typeof err.status === "string") {
    if (err.status === "FETCH_ERROR")
      return "Unable to reach the server. Please check your internet connection and try again.";
    if (err.status === "TIMEOUT_ERROR")
      return "The request timed out. Please try again.";
    if (err.status === "PARSING_ERROR")
      return "Received an unexpected response from the server. Please try again.";
  }

  // HTTP status with no useful body
  if (typeof err.status === "number") {
    if (err.status === 401) return "Please login to continue.";
    if (err.status === 403)
      return "You are not allowed to perform this action.";
    if (err.status === 404) return "The requested resource was not found.";
    return `Request failed (${err.status}). Please try again.`;
  }

  if (typeof err.message === "string") return err.message;
  return fallback;
}
