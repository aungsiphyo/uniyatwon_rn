const BASE_URL = "https://apis.uniyatwon.com/";
// const BASE_URL = "http://10.66.145.187:8080/";

export default {
  baseURL: BASE_URL,
  login: BASE_URL + "login.php",
  signup: BASE_URL + "user_create.php",
  fetchposts: BASE_URL + "fetchposts.php",
  fetchDetailPost: BASE_URL + "fetchdetailpost.php",
  search: BASE_URL + "search.php",
  searchHistory: BASE_URL + "search_history.php",
  addpost: BASE_URL + "addposts.php",
  likePost: BASE_URL + "likepost.php",
  fetchLikeUsers: BASE_URL + "fetchlikeusers.php",
  savePost: BASE_URL + "savedposts.php",
  fetchSavedPosts: BASE_URL + "fetchsavedposts.php",
  profileMe: BASE_URL + "profile.php",
  profileOther: BASE_URL + "profile_other.php",
  editProfile: BASE_URL + "editprofile.php",
  comment: BASE_URL + "comments.php",
  notifications: BASE_URL + "notifications.php",
  fetchComments: BASE_URL + "fetchcomments.php",
  follow: BASE_URL + "follow.php",
  savePushToken: BASE_URL + "save_push_token.php",
  broadcastPush: BASE_URL + "broadcast_push.php",
  deletePost: BASE_URL + "deletepost.php",
};
