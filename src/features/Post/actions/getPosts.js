import { put, takeEvery } from 'redux-saga/effects';
import update from 'immutability-helper';
import api from 'utils/api';
import { getPostKey } from '../utils';
import { getSortOption } from 'utils/sortOptions';

/*--------- CONSTANTS ---------*/
const GET_POSTS_BEGIN = 'GET_POSTS_BEGIN';
const GET_POSTS_SUCCESS = 'GET_POSTS_SUCCESS';
const GET_POSTS_FAILURE = 'GET_POSTS_FAILURE';

/*--------- ACTIONS ---------*/
export function getPostsBegin(daysAgo) {
  return { type: GET_POSTS_BEGIN, daysAgo };
}

export function getPostsSuccess(daysAgo, posts) {
  return { type: GET_POSTS_SUCCESS, daysAgo, posts };
}

export function getPostsFailure(daysAgo, message) {
  return { type: GET_POSTS_FAILURE, daysAgo, message };
}

/*--------- REDUCER ---------*/
export function getPostsReducer(state, action) {
  switch (action.type) {
    case GET_POSTS_BEGIN: {
      return update(state, {
        dailyLoadingStatus: { [action.daysAgo]: { $set: 'loading' } },
      });
    }
    case GET_POSTS_SUCCESS: {
      const { daysAgo, posts } = action;

      const newPosts = {};
      const dailyRanking = [];
      posts.forEach(post => {
        const key = getPostKey(post);
        if (!state.posts[key]) { // only update non-existing post (preventing race-condition with getPost)
          newPosts[key] = post;
        }
        dailyRanking.push(key);
      });

      return update(state, {
        posts: { $merge: newPosts },
        dailyRanking: { [daysAgo]: { $set: dailyRanking } },
        dailyLoadingStatus: { [daysAgo]: { $set: 'finished' } },
      });
    }
    case GET_POSTS_FAILURE: {
      return update(state, {
        dailyLoadingStatus: { [action.daysAgo]: { $set: 'error' } },
      });
    }
    default:
      return state;
  }
}

/*--------- SAGAS ---------*/
function* getPosts({ daysAgo }) {
  try {
    const posts = yield api.get('/posts.json', { days_ago: daysAgo, sort: getSortOption('daily-' + daysAgo) });

    yield put(getPostsSuccess(daysAgo, posts));
  } catch(e) {
    yield put(getPostsFailure(daysAgo, e.message));
  }
}

export default function* getPostsManager() {
  yield takeEvery(GET_POSTS_BEGIN, getPosts);
}
