import update from 'immutability-helper';
import { VOTE_FAILURE, VOTE_OPTIMISTIC } from 'features/Vote/actions/vote';
import { manageContentVote } from 'features/Vote/utils';
import { getPostKey } from './utils';

const DECREASE_COMMENTS_COUNT = 'DECREASE_COMMENTS_COUNT';

export function decreaseCommentcount(post) {
  return { type: DECREASE_COMMENTS_COUNT, post };
}

/*--------- REDUCER ---------*/
export default function postsReducer(state, action) {
  switch (action.type) {
    case VOTE_OPTIMISTIC: {
      const { content, accountName, weight, contentType } = action;
      if (contentType === 'post') {
        const key = getPostKey(content);
        const newPost = manageContentVote({ ...state.posts[key] }, weight, accountName);
        newPost.isUpdating = true;

        return update(state, {
          posts: { [key]: { $set: newPost } },
        });
      } else {
        return state;
      }
    }
    case VOTE_FAILURE: { // Revert on optimistic pre-update
      const { content, accountName, contentType } = action;
      if (contentType === 'post') {
        return update(state, {
          posts: { [getPostKey(content)]: {
            active_votes: {
              $apply: votes => {
                return votes.filter(vote => {
                  if (vote.voter !== accountName) {
                    return true;
                  }
                  return false;
                });
              }
            },
            isUpdating: { $set: false },
          }},
        });
      } else {
        return state;
      }
    }
    case DECREASE_COMMENTS_COUNT: {
      const { post } = action;

      return update(state, {
        posts: { [getPostKey(post)]: {
          children: { $set: post.children - 1 },
          commentCountAdjusted: { $set: true },
        }},
      });
    }
    default:
      return state;
  }
}
