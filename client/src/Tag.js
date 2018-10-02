import React, {Component} from 'react';

class Tag extends Component {
  render() {
    return (
      <span
        className="tag-cloud-tag"
        style={this.props.style}
        key={this.props.key}
      >{this.props.tag.value}</span>
    );
  }
}

export default Tag;
