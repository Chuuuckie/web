import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { Button, Carousel, Icon, Timeline, Tag, Tooltip, Modal, Input, Row, Col } from 'antd';
import IconFacebook from 'react-icons/lib/fa/facebook-square';
import IconTwitter from 'react-icons/lib/fa/twitter-square';
import IconLinkedIn from 'react-icons/lib/fa/linkedin-square';
import { Link } from 'react-router-dom';
import isEmpty from 'lodash/isEmpty';
import { getPostPath, getTagPath, isEditable, addReferral } from '../utils';
import VoteButton from 'features/Vote/VoteButton';
import ResteemButton from './ResteemButton';
import Author from 'components/Author';
import { selectMe } from 'features/User/selectors';
import { getHtml } from 'components/Body';
import { shortFormat } from 'utils/date';
import { isModerator, isAdmin, isGuardian } from 'features/User/utils';
import { setModeratorBegin, moderatePostBegin } from 'features/Post/actions/moderatePost';
import { replyBegin } from 'features/Comment/actions/reply';
import { selectIsCommentPublishing, selectHasCommentSucceeded } from 'features/Comment/selectors';
import { getCachedImage } from 'features/Post/utils';

class PostView extends Component {
  static propTypes = {
    post: PropTypes.shape({
      url: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      tagline: PropTypes.string.isRequired,
      tags: PropTypes.arrayOf(PropTypes.string).isRequired,
      images: PropTypes.arrayOf(PropTypes.object).isRequired,
      author: PropTypes.string,
      active_votes: PropTypes.arrayOf(PropTypes.object),
      payout_value: PropTypes.number.isRequired,
      children: PropTypes.number.isRequired,
      is_active: PropTypes.bool.isRequired,
      is_verified: PropTypes.bool.isRequired,
      verified_by: PropTypes.string,
      beneficiaries: PropTypes.arrayOf(PropTypes.shape({
        account: PropTypes.string.isRequired,
        weight: PropTypes.number.isRequired,
      })),
    }).isRequired,
    author: PropTypes.string,
    permlink: PropTypes.string,
    me: PropTypes.string.isRequired,
    isCommentPublishing: PropTypes.bool.isRequired,
    hasCommentSucceeded: PropTypes.bool.isRequired,
    setModerator: PropTypes.func.isRequired,
    moderatePost: PropTypes.func.isRequired,
    moderatorReply: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      previewImage: '',
      previewVisible: false,
      moderationVisible: false,
      moderationComment: "Your comment here\n\n---\n\n" +
        "Please read our [posting guidelines](https://github.com/Steemhunt/web/blob/master/POSTING_GUIDELINES.md). " +
        "If you have any questions, please join our [Discord Group](https://discord.gg/mWXpgks).",
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.post.verified_by !== this.props.me) {
      this.setState({ moderationVisible: false });
    }

    if (nextProps.hasCommentSucceeded &&
      this.props.hasCommentSucceeded !== nextProps.hasCommentSucceeded &&
      !isEmpty(this.state.moderationComment)) {
      this.setState({ moderationComment: '' });
      this.hideModeration();
    }
  }

  // MARK: - Handle modals

  hideModal = () => this.setState({ previewVisible: false });
  showModal = (e) => {
    this.setState({
      previewImage: e.target.src,
      previewVisible: true,
    });
  };
  hideModeration = () => this.setState({ moderationVisible: false });
  showModeration = () => {
    this.setState({ moderationVisible: true });
    this.props.setModerator();
  };

  changePreview = (diff) => {
    const images = this.props.post.images;

    for (let i in images) {
      if (getCachedImage(images[i].link) === this.state.previewImage) {
        let newIndex = parseInt(i, 10) + diff;
        if (newIndex < 0) {
          newIndex = images.length + newIndex;
        }
        if (newIndex >= images.length) {
          newIndex = newIndex - images.length;
        }

        return this.setState({ previewImage: getCachedImage(images[newIndex].link) });
      }
    }
  };

  handleModerationCommentChange = (e) => this.setState({ moderationComment: e.target.value });
  commentModeration = () => {
      const comment = this.state.moderationComment.trim();
      if (comment) {
        this.props.moderatorReply(comment);
      }
  };

  render() {
    const { me, post } = this.props;
    const images = post.images.map((image, index) => {
      return (
        <div key={index} className="slide-container">
          <img alt={image.name} src={getCachedImage(image.link)} onClick={this.showModal} />
        </div>
      );
    });
    const tags = post.tags.map((tag, index) => {
      // TODO: To steemhunt tags
      return (
        <Tag key={index}><Link to={getTagPath(tag)}>{tag}</Link></Tag>
      );
    });
    const beneficiaries = post.beneficiaries && post.beneficiaries.map((b, index) => {
      return (
        <Timeline.Item key={index}><Author name={b.account} /> ({b.weight / 100}%)</Timeline.Item>
      );
    })

    const shouldShowEdit = window.location.pathname !== '/post' && me === post.author && isEditable(post);

    let reviewButtonText = 'Start Review';

    if (post.is_active && post.is_verified) {
      reviewButtonText = 'Verified';
    } else if (!post.is_active && post.is_verified) {
      reviewButtonText = 'Hidden';
    } else if (!post.is_active && !post.is_verified) {
      reviewButtonText = 'Pending Edit';
    } else if (post.verified_by === me && !post.is_verified) {
      reviewButtonText = 'In Review';
    }

    // a & v => verified => unverify
    // !a & v => hidden => unhide
    // !a & !v => pending edit => hide, approve
    // a & !v => initial => hide, request for edit, approve

    const buttonHide = (
      <Button
        icon="delete"
        type="danger"
        loading={this.props.isModerating}
        onClick={() => this.props.moderatePost(false, true)}
      >
        Hide
      </Button>
    );

    const buttonRequestEdit = (
      <Button
        icon="clock-circle-o"
        loading={this.props.isModerating}
        onClick={() => this.props.moderatePost(false, false)}
      >
        Request for Edit
      </Button>
    );

    const buttonApprove = (
      <Button
        icon="check-circle"
        type="primary"
        loading={this.props.isModerating}
        onClick={() => this.props.moderatePost(true, true)}
      >
        Approve
      </Button>
    );

    const buttonUnhide = (
      <Button
        icon="sync"
        type="primary"
        loading={this.props.isModerating}
        onClick={() => this.props.moderatePost(true, true)}
      >
        Unhide
      </Button>
    );

    const buttonUnverify = (
      <Button
        icon="sync"
        type="danger"
        loading={this.props.isModerating}
        onClick={() => this.props.moderatePost(true, false)}
      >
        Unverify
      </Button>
    );

    return (
      <div className="post-view diagonal-split-view">
        <div className="top-container primary-gradient">
          <span className="featured-date round-border" data-id={post.id}>Featured on {shortFormat(post.listed_at)}</span>

          <div className="edit-buttons">
            {shouldShowEdit &&
              <Link to={`${getPostPath(post)}/edit`}>
                <Button icon="edit" size="small" ghost>Edit</Button>
              </Link>
            }
            {isModerator(me) &&
              <span>
                {(post.verified_by === me || post.verified_by === null || isAdmin(me) || isGuardian(me)) ?
                    (post.author === me ?
                      <Button icon="check-circle" size="small" ghost disabled>
                        Own Content
                      </Button>
                    :
                      <Button icon={post.verified_by && !post.is_verified ? 'loading' : 'check-circle'} size="small" onClick={this.showModeration} ghost>
                        {reviewButtonText}
                        {post.verified_by &&
                          <span> (@{post.verified_by})</span>
                        }
                      </Button>
                    )
                  :
                    (post.is_verified ?
                      <Button icon="check-circle" size="small" ghost disabled>
                        <span>Reviewed by @{post.verified_by}</span>
                      </Button>
                    :
                      <Button loading={true} size="small" ghost disabled>
                        <span>In review by @{post.verified_by}</span>
                      </Button>
                    )
                }
              </span>
            }
          </div>
          <h1>{post.title}</h1>
          <h2>{post.tagline}</h2>
          <Button
            href={addReferral(post.url)}
            type="primary"
            className="round-border inversed-color padded-button checkitout-button"
            target="_blank"
            rel="noopener noreferrer"
          >
            CHECK IT OUT
          </Button>
        </div>
        <div className="diagonal-line"></div>
        <div className="bottom-container">
          {post.images.length === 0 ?
            <Carousel className="carousel" effect="fade">
              <div><Icon type="camera-o" /></div>
            </Carousel>
          :
            <Carousel className="carousel" autoplay={true} effect="scrollx">
              {images}
            </Carousel>
          }

          <div className="description">
            {post.description && getHtml(post.description)}
          </div>

          <div className="timeline-container">
            <ul className="left">
              {post.author && <li>Hunter</li>}
              {beneficiaries && beneficiaries.length > 0 && <li>Makers</li>}
            </ul>

            <Timeline>
              {post.author && <Timeline.Item><Author name={post.author} /></Timeline.Item>}
              {beneficiaries}
            </Timeline>
          </div>

          <div className="vote-container">
            <VoteButton post={post} type="post" layout="detail-page" />

            { me && me !== post.author && !this.props.draft &&
              <ResteemButton post={post} me={me} />
            }

            <div className="social-shares">
              <Tooltip title="Share on Facebook">
                <a
                  href={'https://www.facebook.com/sharer.php?u=' + encodeURI(window.location.href)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-icon"
                >
                  <IconFacebook />
                </a>
              </Tooltip>
              <Tooltip title="Share on Twitter">
                <a href={'https://twitter.com/intent/tweet?url=' + encodeURI(window.location.href) +
                    '&text=' + encodeURI(post.title) +
                    '&hashtags=steemhunt,steem'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-icon"
                >
                  <IconTwitter />
                </a>
              </Tooltip>
              <Tooltip title="Share on LinkedIn">
                <a
                  href={'https://www.linkedin.com/shareArticle?mini=true' +
                    '&url=' + encodeURI(window.location.href) +
                    '&title=' + encodeURI(post.title) +
                    '&summary=' + encodeURI(post.tagline) +
                    '&source=Steemhunt'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-icon"
                >
                  <IconLinkedIn />
                </a>
              </Tooltip>
            </div>
          </div>

          <div className="tags">
            {tags}
          </div>
        </div>
        <Modal visible={this.state.previewVisible} footer={null} onCancel={this.hideModal} width="50%" className="preview-modal">
          <img alt="Preview" src={this.state.previewImage} />
          <div className="prev" onClick={() => this.changePreview(-1)}>
            <Icon type="left" />
          </div>
          <div className="next" onClick={() => this.changePreview(1)}>
            <Icon type="right" />
          </div>
        </Modal>
        {isModerator(me) &&
          <Modal className="moderation-modal" visible={this.state.moderationVisible} footer={null} onCancel={this.hideModeration}>
            <Row>
              <Col span={24}>Moderation Comment:</Col>
            </Row>
            <Row className="top-margin">
              <Col span={17}>
                <Input.TextArea
                  placeholder="You must leave a comment to receive the moderator’s upvoting."
                  value={this.state.moderationComment}
                  onChange={this.handleModerationCommentChange}
                  autosize={{ minRows: 4 }}
                />
              </Col>
              <Col span={7}>
                <Button
                  icon="message"
                  loading={this.props.isCommentPublishing}
                  onClick={this.commentModeration}
                  className="comment-button"
                >
                  Comment
                </Button>
              </Col>
            </Row>
            <Row className="buttons">
              {post.is_active && !post.is_verified && // initial status
                <Col span={24}>
                  {buttonHide}
                  {buttonRequestEdit}
                  {buttonApprove}
                </Col>
              }

              {!post.is_active && !post.is_verified && // pending edit status
                <Col span={24}>
                  {buttonHide}
                  {buttonApprove}
                </Col>
              }

              {!post.is_active && post.is_verified && // hidden status
                <Col span={24}>
                  {buttonUnhide}
                </Col>
              }

              {post.is_active && post.is_verified && // verified status
                <Col span={24}>
                  {buttonUnverify}
                </Col>
              }
            </Row>
          </Modal>
        }
      </div>
    )
  }
}

const mapStateToProps = () => createStructuredSelector({
  me: selectMe(),
  isCommentPublishing: selectIsCommentPublishing(),
  hasCommentSucceeded: selectHasCommentSucceeded(),
});

const mapDispatchToProps = (dispatch, props) => ({
  setModerator: () => dispatch(setModeratorBegin(props.post)),
  moderatePost: (is_active, is_verified, comment) => dispatch(moderatePostBegin(props.post, is_active, is_verified, comment)),
  moderatorReply: (body) => dispatch(replyBegin(props.post, body, true)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PostView);
