import React, {Component} from 'react';
import {Row, Col, Button} from 'react-bootstrap';
import BxTagCloud from './BxTagCloud';
import ClassifyForm from './ClassifyForm';
import ReactDOM from 'react-dom'
import { Motion, spring, presets } from "react-motion";
import UpIcon from './upicon.svg'

const UpArrow = props => {
  return <span><img src={UpIcon} {...props} /></span> 
}

class Inner extends Component {
  componentDidUpdate() {
    document.scrollingElement.scrollTop = this.props.scrollTop
  }
  
  render() {
    return (
    <div id="classify=page-main">
      <Row>
      </Row>
      <Row>
        <h2>Classify your data</h2>
        <p className="lead">
          We've built a model based on your training data. Enter a link to a
          file you want to classify.
        </p>
      </Row>
      <ClassifyForm
        buckets={this.props.buckets}
        arrayFieldCounts={this.props.arrayFieldCounts}
        incrementFormFields={this.props.incrementFormFields}
        doSubmit={this.props.handleSubmit}
      />
      <Row className="text-left" style={{marginTop: '2em'}}>
        <p>
        If you would like to retrain your model{'    '}
        <Button bsSize="sm" onClick={this.props.retrainModel}>
          Click Here
        </Button>
      </p>
      <p>
        **note** that in alpha you can only store one model at a time. You
        will not be able to access previous models.
      </p></Row>
      <Row ref={this.props.tagsRef} style={{minHeight: '20px'}}>
      <UpArrow 
        width="20px"
        onClick={this.props.scrollToTop}
        hidden={this.props.scrollTop < 10}
        style={{
          cursor: 'pointer'
        }}
      /></Row>
      <Row id="tag-cloud" >
        <h2>Your model:</h2>
        {this.props.tagClouds}
      </Row>
    </div>
    )
  }
}

class ClassifyPage extends Component {
  constructor(props, context) {
    super(props, context);
    const token = window.location.pathname.slice(1);
    this.tagsRef = React.createRef();
    const countFields = Object.keys(this.props.buckets).reduce(
      (acc, bucket) => {
        acc[bucket] = 1;
        return acc;
      },
      {},
    );
    countFields.dataFields = 1;
    this.state = Object.assign({}, countFields, {
      token: token,
      arrayFieldCounts: countFields,
      scrollTop: 0
    });
  }
  
  scrollToTags = () => {
    const scrollTop = ReactDOM.findDOMNode(this.tagsRef.current).getBoundingClientRect().y
    console.log('Scroll', scrollTop)
    this.setState({scrollTop: scrollTop})
  }

  scrollToTop = () => {
    this.setState({scrollTop: 0})
  }
  
  //noop
  handleSubmit = (values) => {
    console.log('submit____________', values);
    this.props.submitClassifyForm(values);
  }

  incrementFormFields = (e, field, max = 5, min = 1, op = 'up') => {
    e.preventDefault();
    let i;
    let update = false;
    // we need at least one dataField but can have 0 for bucket search terms
    const curr = this.state.arrayFieldCounts[field] || 0;
    console.log('currr', curr);

    if (op === 'up' && curr < max) {
      update = true;
      i = curr + 1;
    }

    if (op === 'down' && curr > min) {
      update = true;
      i = curr - 1;
    }

    if (update) {
      const newArrCounts = Object.assign({}, this.state.arrayFieldCounts);
      newArrCounts[field] = i;
      this.setState({arrayFieldCounts: newArrCounts});
    }
  }


  render() {
    const mdCols = Math.floor(12 / Object.keys(this.props.buckets).length);
    const tagClouds = Object.keys(this.props.buckets).map((buck, i) => {
      const data = [];
      this.props.buckets[buck].forEach(item => {
        if (item[0]) {
          data.push({value: item[0], count: item[1]});
        }
      });
      return (
        <Col md={mdCols} key={i}>
          <h3 className="text-secondary">{buck}</h3>
          <div className="tag-clouds">
            <BxTagCloud key={i} min={20} max={60} data={data} />
          </div>
        </Col>
      );
    });

    return (
    <div>
        <Button style={{maxWidth: '100px', float:'left', marginBottom: '-3em'}} bsSize="sm" bsStyle="link" onClick={this.scrollToTags}>View your model</Button>
    <Motion style={{scrollTop: spring(this.state.scrollTop, presets.noWobble) }}>
    {motionVals => {
      return (
        <Inner 
          incrementFormFields={this.incrementFormFields}
          handleSubmit={this.handleSubmit}
          arrayFieldCounts={this.state.arrayFieldCounts} 
          tagClouds={tagClouds}
          tagsRef={this.tagsRef}
          scrollTop={motionVals.scrollTop}
          scrollToTop={this.scrollToTop}
          {...this.props}
        />
      )
    }}
    </Motion>
    </div>
    );
  }
}

export default ClassifyPage;
