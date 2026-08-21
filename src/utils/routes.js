export const ROUTES = {
  PROFILE: '/profile/:username',
  PROFILE_MEMORIES: '/profile/:username/memories',
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  SEARCH: '/search',
};

/**
 * Generates the canonical profile path for a given username.
 * @param {string} username 
 * @returns {string}
 */
export const getProfilePath = (username) => {
  return ROUTES.PROFILE.replace(':username', encodeURIComponent(username));
};
