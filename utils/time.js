/**
 * Formats a date string into a relative "time ago" format.
 * Handles SQL datetime format (YYYY-MM-DD HH:MM:SS) and ensures UTC treatment if needed.
 *
 * @param {string} dateString - The date string from the server.
 * @returns {string} - Formatted relative time (e.g., "5m ago", "Just now").
 */
export const getTimeAgo = (dateString) => {
  if (!dateString || dateString === "Just now") return "Just now";

  try {
    // 1. Format for ISO compatibility: replace space with T
    let isoString = dateString.replace(" ", "T");

    // 2. Treat as UTC if no timezone info is present
    if (!isoString.includes("Z") && !isoString.includes("+")) {
      isoString += "Z";
    }

    const postDate = new Date(isoString);
    const now = new Date();

    const diffInSeconds = Math.floor(
      (now.getTime() - postDate.getTime()) / 1000,
    );

    // Guard against future dates (clock drift) or very recent events
    if (diffInSeconds < 60) return "Just now";

    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    // Beyond a week, show the actual date
    return postDate.toLocaleDateString();
  } catch (e) {
    console.error("getTimeAgo Error:", e, dateString);
    return "Just now";
  }
};
