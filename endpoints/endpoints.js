const BASE_URL = "http://api.uniyatwon.com/";
// const BASE_URL = "http://10.66.145.187:8080/";

export default {
  baseURL: BASE_URL,
  login: BASE_URL + "testlogin.php",
  signup: BASE_URL + "user_create.php",
  fetchposts: BASE_URL + "fetchposts.php",
  search: BASE_URL + "search.php",
  searchHistory: BASE_URL + "search_history.php",
  addpost: BASE_URL + "addposts.php",
  likePost: BASE_URL + "likepost.php",
  fetchLikeUsers: BASE_URL + "fetchlikeusers.php",
  savePost: BASE_URL + "savedposts.php",
  // profile: BASE_URL + "profile.php",
  profileMe: BASE_URL + "profile_me.php",
  profileOther: BASE_URL + "profile_other.php",
  comment: BASE_URL + "comments.php",
  notifications: BASE_URL + "notifications.php",
  fetchComments: BASE_URL + "fetchcomments.php",
};
