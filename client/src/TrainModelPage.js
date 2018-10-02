import React, {Component} from 'react';
import {
  Grid,
  Row,
} from 'react-bootstrap';
import TrainModelForm from './TrainModelForm';

class TrainModelPage extends Component {
  constructor(props, context) {
    super(props, context);
    const token = window.location.pathname.slice(1);
    this.state = {
      token: token,
      bucketCount: 2,
      dataFieldCount: 1,
    };
  }

  incrementBuckets() {
    const maxBucketCount = this.props.bucketCount || 3;
    if (this.state.bucketCount < maxBucketCount) {
      const i = this.state.bucketCount + 1;
      this.setState({
        bucketCount: i,
      });
    }
  }

  decrementBuckets() {
    if (this.state.bucketCount > 2) {
      const i = this.state.bucketCount - 1;
      this.setState({
        bucketCount: i,
      });
    }
  }

  incrementDataFields(e) {
    e.preventDefault();
    if (this.state.dataFieldCount < 5) {
      const i = this.state.dataFieldCount + 1;
      this.setState({
        dataFieldCount: i,
      });
    }
  }

  decrementDataFields(e) {
    e.preventDefault();
    if (this.state.dataFieldCount > 1) {
      const i = this.state.dataFieldCount - 1;
      this.setState({
        dataFieldCount: i,
      });
    }
  }

  // noop
  handleSubmit(values) {
    this.props.submitModelTrainForm(values);
  }

  render() {
    console.log(this.state);

    return (
      <Grid id="classifier" className="text-left">
        <h2 className="text-center">Step 1 -- Train your model</h2>
        <Row>
          <span className="h4">Buckets ({this.state.bucketCount})</span>
          <span> -- </span>
          <span>
            CSV rows will be classified into "buckets". Each bucket needs
            training data which should be a CSV of its own.
          </span>
          <h5 className="numBuckets">
            <button
              className="increment-bucket"
              onClick={this.incrementBuckets.bind(this)}>
              (+)
            </button>{' '}
            <button
              className="increment-buckets"
              onClick={this.decrementBuckets.bind(this)}>
              (-)
            </button>
          </h5>
        </Row>
        <TrainModelForm 
          bucketCount={this.state.bucketCount}
          dataFieldCount={this.state.dataFieldCount} 
          incrementDataFields={this.incrementDataFields.bind(this)}
          decrementDataFields={this.decrementDataFields.bind(this)}
          doSubmit={this.handleSubmit.bind(this)}
        />
      </Grid>
    );
  }
}

export default TrainModelPage;
