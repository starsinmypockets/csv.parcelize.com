import {TagCloud} from 'react-tagcloud';
import Tag from './Tag';
import React, {Component} from 'react';
import Chroma from 'chroma-js';

class BxTagCloud extends Component {
  getColor(size) {
    const val = (size - this.props.min) / (this.props.max - this.props.min);
    var bez = Chroma.bezier(['black', 'purple', 'red', 'pink']);
    return bez(val).hex();
  }

  renderTag(tag, size) {
    const key = tag.key || tag.value;
    const style = {
      margin: '0px 3%',
      verticalAlign: 'middle',
      display: 'inline-block',
      fontSize: `${size}px`,
      color: this.getColor(size),
    };

    return (
      <Tag
        key={key}
        tag={tag}
        size={size}
        style={style}
      />
    );
  }

  render() {
    return (
      <div className="bucket-tag-cloud-container">
        <h2>{this.props.bucket}</h2>
        <TagCloud
          tags={this.props.data}
          shuffle={false}
          disableRandomColor={true}
          renderer={this.renderTag.bind(this)}
          minSize={25}
          maxSize={80}
        />
      </div>
    );
  }
}
export default BxTagCloud;
