import React, { Component } from 'react';
import { createStructuredSelector } from 'reselect';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, Input, Icon, notification } from 'antd';
import { isEmpty } from 'lodash';
import { replyBegin, editReplyBegin } from './actions/reply';
import { getCachedImage } from 'features/Post/utils';
import { selectIsCommentPublishing, selectHasCommentSucceeded } from './selectors';
import { scrollTo } from 'utils/scroller';
import { uploadImage } from 'utils/helpers/uploadHelpers'

class CommentReplyForm extends Component {
  static propTypes = {
    content: PropTypes.object.isRequired,
    editMode: PropTypes.bool,
    closeForm: PropTypes.func,
  };

  static defaultProps = {
    editMode: false,
  };

  constructor() {
    super();
    this.state = {
      body: '',
      inlineUploading: false
    }
  }

  componentDidMount() {
    if (this.props.editMode) {
      this.setState({ body: this.props.content.body });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.hasCommentSucceeded &&
      this.props.hasCommentSucceeded !== nextProps.hasCommentSucceeded &&
      this.form &&
      !isEmpty(this.form.textAreaRef.value)) {
      this.setState({ body: '' });

      if (nextProps.closeForm) { // indented comment
        nextProps.closeForm();
      } else { // comment on parent article
        // Scroll to the bottom
        const leftPanel = document.getElementById('panel-left');
        const postContainer = document.getElementById('post-container');
        scrollTo(leftPanel, postContainer.offsetHeight, 800);
      }
    }
  }

  onChange = e => this.setState({ body: e.target.value });

  reply = () => {
    if (this.props.editMode) {
      this.props.editReply(this.state.body);
    } else {
      this.props.reply(this.state.body);
    }
  };

  onUploadSuccess = (res) => {
    const { response } = res.data;
    const { selectionStart, innerHTML } = this.form.textAreaRef;
    const text = innerHTML.slice(0, selectionStart)
      + `![${response.name}](${getCachedImage(response.link)})`
      + innerHTML.slice(selectionStart + 1);
    this.setState({
      body: text
    });
  }

  onUploadFail = (e) => {
    notification['error']({ message: e.response });
  }

  inputUpload = (e) => {
    const file = e.target.files[0];
    this.setState({ inlineUploading: true }, () => {
      uploadImage(file, this.onUploadSuccess, this.onUploadFail)
      .then(() => this.setState({ inlineUploading: false }));
    })
  }

  render() {
    const { editMode, closeForm } = this.props;

    return (
      <div className="reply-form">
        <Input.TextArea
          placeholder="Say something..."
          onChange={this.onChange}
          ref={node => this.form = node}
          value={this.state.body}
          autosize />
        <div className="actions">
          {closeForm && (
            <Button shape="circle" onClick={closeForm} icon="close" size="small" className="close-button"></Button>
          )}
          <Button
            type="primary"
            onClick={this.reply}
            loading={this.props.isCommentPublishing}
          >
            {editMode ? 'Update' : 'Post'}
          </Button>
          <div className="inline-upload-container">
            <a onClick={() => this.inlineFileField.click()}>Upload Image</a>
            {this.state.inlineUploading && <Icon type="loading" spin="true" />}
            <input type="file" ref={(ref) => { this.inlineFileField = ref }} onChange={this.inputUpload} accept="image/x-png,image/gif,image/jpeg" />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = () => createStructuredSelector({
  isCommentPublishing: selectIsCommentPublishing(),
  hasCommentSucceeded: selectHasCommentSucceeded(),
});

const mapDispatchToProps = (dispatch, props) => ({
  reply: (body) => dispatch(replyBegin(props.content, body, null)),
  editReply: (body) => dispatch(editReplyBegin(props.content, body)),
});

export default connect(mapStateToProps, mapDispatchToProps)(CommentReplyForm);