import React, {Component} from 'react';
import {
  Grid,
  Row,
  Col,
} from 'react-bootstrap';
import {withFormik} from 'formik';
import * as Yup from 'yup';
import DataFields from './DataFields';

class TrainModelForm extends Component {
  constructor(props, context) {
    super(props, context);
    const token = window.location.pathname.slice(1);
    this.state = {
      token: token,
      bucketCount: 2,
      dataFieldCount: 1,
    };
  }

  componentDidMount() {
    this.setState({
      bucketForms: this.getBucketForms(this.state.bucketCount),
    });
  }

  getBucketForms(i) {
    const {
      values,
      touched,
      errors,
      handleChange,
      handleBlur,
    } = this.props;

    const bucketFields = [...Array(i).keys()].map(i => {
      const name = 'bucketName' + i;
      const url = 'bucketUrl' + i;

      return (
        <Col md={6} className="bucket-group-field" key={i}>
          <div className="bucket-form-field">
            <input
              id={name}
              placeholder={'Bucket Name ' + (i + 1)}
              type="text"
              value={values[name]}
              onChange={handleChange}
              onBlur={handleBlur}
              className={
                errors[name] && touched[name]
                  ? 'text-input error'
                  : 'text-input'
              }
            />
            {errors[name] &&
              touched[name] && (
                <div className="input-feedback">{errors[name]}</div>
              )}
          </div>
          <div className="bucket-form-field">
            <input
              id={url}
              placeholder={'Bucket URL ' + (i + 1)}
              type="url"
              value={values[url]}
              onChange={handleChange}
              onBlur={handleBlur}
              className={
                errors[url] && touched[url] ? 'text-input error' : 'text-input'
              }
            />
            {errors[url] &&
              touched[url] && (
                <div className="input-feedback">{errors[url]}</div>
              )}
          </div>
        </Col>
      );
    });

    return <div className="bucket-fields">{bucketFields}</div>;
  }

  incrementBuckets() {
    const maxBucketCount = this.props.bucketCount || 3;
    if (this.state.bucketCount < maxBucketCount) {
      const i = this.state.bucketCount + 1;
      this.setState({
        bucketCount: i,
        bucketForms: this.getBucketForms(i),
      });
    }
  }

  decrementBuckets() {
    if (this.state.bucketCount > 2) {
      const i = this.state.bucketCount - 1;
      this.setState({
        bucketCount: i,
        bucketForms: this.getBucketForms(i),
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

  handleSubmit(e) {
    e.preventDefault();
    console.log('submit____________', this.props.values);
    this.props.submitModelTrainForm(this.props.values);
  }

  render() {
    console.log(this.state);
    const form = (
      <form>
        <Row id="bucket-forms">{this.state.bucketForms}</Row>
        <Row className="header-fields">
          <Col>
            <span className="h4">Field names</span>
            <span> -- </span>
            <span>
              Enter the fieldnames we are going to evaluate. For example:
              "title" and "description". Text from selected fields will be
              combined. Specified field names must be the same for all files.
            </span>
          </Col>
        </Row>
        <br />
        <DataFields
          fieldName="dataFields"
          ct={this.state.dataFieldCount}
          {...this.props}
          incrementDataFields={this.incrementDataFields.bind(this)}
          decrementDataFields={this.decrementDataFields.bind(this)}
        />
        <br />
        <Row id="submit-training-data">
          <br />
          <button type="submit" onClick={this.handleSubmit.bind(this)}>
            SUBMIT
          </button>
        </Row>
      </form>
    );

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
        {form}
      </Grid>
    );
  }
}

const TrainingPage = withFormik({
  mapPropsToValues: () => {
    // umm
  },
  validationSchema: (props, context) => {
    console.log('valid', props, context);
    const bucketShape = [...Array(props.bucketCount).keys()].reduce(
      (acc, i) => {
        acc['bucketName' + i] = Yup.string().required(
          'Each bucket must have unique name!',
        );
        acc['bucketUrl' + i] = Yup.string()
          .url('Invalid url')
          .required('URL required');
        return acc;
      },
      {},
    );
    const dataFieldsShape = [...Array(props.dataFieldCount).keys()].reduce(
      (acc, i) => {
        acc[`dataFields[${i}]`] = Yup.string().required(
          'Add a valid csv row header title or remove this field (-)',
        );
        return acc;
      },
      {},
    );
    return Yup.object().shape(Object.assign(bucketShape, dataFieldsShape));
  },
})(TrainModelForm);

export default TrainingPage;
