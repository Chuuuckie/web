import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { createStructuredSelector } from 'reselect';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import { Helmet } from 'react-helmet';
import { List, Button, Icon } from 'antd';
import ContentPayoutAndVotes from 'components/ContentPayoutAndVotes';
import CommentItem from 'features/Comment/CommentItem';
import { getCommentsFromPostBegin } from 'features/Comment/actions/getCommentsFromPost';
import {
  selectCommentsChild,
  selectCommentsData,
  selectCommentsIsLoading
} from 'features/Comment/selectors';
import { getLoginURL } from 'utils/token';
import { selectIsConnected } from 'features/User/selectors';
import { selectCurrentComments, selectCurrentPost, selectIsPostLoading } from './selectors';
import { getPostBegin, setCurrentPostKey } from './actions/getPost';
import PostView from './components/PostView';
import CommentReplyForm from 'features/Comment/CommentReplyForm';
import { scrollTop } from 'utils/scroller';
import NotFound from 'components/NotFound';
import CircularProgress from 'components/CircularProgress';
import { isPrerenderer } from 'utils/userAgent';

class Post extends Component {
  static propTypes = {
    getPost: PropTypes.func.isRequired,
    setCurrentPostKey: PropTypes.func.isRequired,
    getCommentsFromPost: PropTypes.func.isRequired,
    isConnected: PropTypes.bool.isRequired,
    post: PropTypes.object,
    commentsData: PropTypes.object.isRequired,
    commentsChild: PropTypes.object.isRequired,
    currentComments: PropTypes.object,
    commentsIsLoading: PropTypes.bool.isRequired,
    isPostLoading: PropTypes.bool.isRequired,
  };

  componentDidMount() {
    const { match: { params : { author, permlink }} } = this.props;
    this.props.getPost(author, permlink);
    if (!isPrerenderer()) {
      this.props.getCommentsFromPost('steemhunt', author, permlink);
    }

    scrollTop();
  }

  componentWillReceiveProps(nextProps) {
    const { match: { params : { author, permlink }} } = this.props;
    const nextAuthor = nextProps.match.params.author;
    const nextPermlink = nextProps.match.params.permlink;

    if (author !== nextAuthor || permlink !== nextPermlink) {
      this.props.getPost(nextAuthor, nextPermlink);
      scrollTop();

      if (nextProps.commentsIsLoading === false) {
        this.props.getCommentsFromPost('steemhunt', nextAuthor, nextPermlink);
      }
    }
  }

  componentWillUnmount() {
    this.props.setCurrentPostKey(null);
  }

  render() {
    const { post, currentComments, commentsData, commentsChild, commentsIsLoading, isConnected, isPostLoading } = this.props;

    if (isPostLoading) {
      return <CircularProgress />;
    } else if (isEmpty(post)) {
      return <NotFound/>;
    }

    return (
      <div className="post-container" id="post-container">
        <Helmet>
          <title>{post.title} - Steemhunt</title>

          { /* Search Engine */ }
          <meta name="description" content={post.tagline} />
          <meta name="image" content={post.images[0]['link']} />
          { /* Schema.org for Google */ }
          <meta itemprop="name" content={`${post.title} - Steemhunt`} />
          <meta itemprop="description" content={post.tagline} />
          <meta itemprop="image" content={post.images[0]['link']} />
          { /* Twitter */ }
          <meta name="twitter:title" content={`${post.title} - Steemhunt`} />
          <meta name="twitter:description" content={post.tagline} />
          <meta name="twitter:image:src" content={post.images[0]['link']} />
          { /* Open Graph general (Facebook, Pinterest & Google+) */ }
          <meta name="og:title" content={`${post.title} - Steemhunt`} />
          <meta name="og:description" content={post.tagline} />
          <meta name="og:image" content={post.images[0]['link']} />
        </Helmet>

        { post && <PostView post={post} /> }

        <div className="comments">
          <hr />

          <h3>
            <ContentPayoutAndVotes content={post} type="post" />
            <span className="separator">&middot;</span>
            {commentsIsLoading ?
              <span><Icon type="loading" /> comments</span>
            :
              <span>{post.children} comments</span>
            }
          </h3>

          {!isConnected && (
            <div className="post-signup">
              <p>You need a Steem account to join the discussion</p>
              <Button
                type="primary"
                href="https://signup.steemit.com/?ref=steemhunt"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => window.gtag('event', 'signup_clicked', { 'event_category' : 'signup', 'event_label' : 'Post Footer' })}
              >
                Sign up now
              </Button>
              <a href={getLoginURL()} className="signin-link">
                Already have a Steem account?
              </a>
            </div>
          )}

          {isConnected && (
            <CommentReplyForm content={post} closeForm={null} />
          )}

          {commentsIsLoading ?
            <Icon type="loading" spin="true" className="center-loading" style={{ fontSize: 40 }} />
          :
            <List
              loading={commentsIsLoading}
              itemLayout="horizontal"
              dataSource={currentComments  && currentComments.list}
              renderItem={commentId => (
                <CommentItem
                  key={commentId}
                  comment={commentsData[commentId]}
                  commentsData={commentsData}
                  commentsChild={commentsChild}
                />
              )}
            />
          }
        </div>
      </div>
    );
  }
}

const mapStateToProps = () => createStructuredSelector({
  post: selectCurrentPost(),
  commentsData: selectCommentsData(),
  commentsChild: selectCommentsChild(),
  currentComments: selectCurrentComments(),
  commentsIsLoading: selectCommentsIsLoading(),
  isConnected: selectIsConnected(),
  isPostLoading: selectIsPostLoading(),
});

const mapDispatchToProps = dispatch => ({
  getPost: (author, permlink) => dispatch(getPostBegin(author, permlink)),
  setCurrentPostKey: key => dispatch(setCurrentPostKey(key)),
  getCommentsFromPost: (category, author, permlink) => dispatch(getCommentsFromPostBegin(category, author, permlink)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Post);
