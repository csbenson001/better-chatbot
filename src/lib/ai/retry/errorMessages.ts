export function getUserFacingErrorMessage(
  status: number,
  message?: string,
): string {
  if (status === 429)
    return "You've reached the rate limit. The request will retry automatically.";
  if (status === 529)
    return "The AI service is temporarily overloaded. Retrying...";
  if (status === 401 || status === 403)
    return "Authentication error. Please check your API key in settings.";
  if (
    message &&
    ["ECONNRESET", "EPIPE", "ECONNREFUSED", "ETIMEDOUT"].some((c) =>
      message.includes(c),
    )
  ) {
    return "Connection lost. Attempting to reconnect...";
  }
  return "An unexpected error occurred. Please try again.";
}

export function getRetryProgressMessage(
  attempt: number,
  maxRetries: number,
): string {
  return `Retry ${attempt}/${maxRetries}...`;
}
