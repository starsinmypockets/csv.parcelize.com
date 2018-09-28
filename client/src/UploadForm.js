import React, {Component} from 'react';
import {
  Row,
} from 'react-bootstrap';
import DataFields from './DataFields';
import {TagCloud} from 'react-tagcloud';
import {withFormik} from 'formik';
import * as Yup from 'yup';

class UploadForm extends Component {
  constructor(props, context) {
    super(props, context);
    const token = window.location.pathname.slice(1);
    this.state = {token: token, dataFieldCount: 1};
  }

  handleSubmit(e) {
    e.preventDefault();
    console.log('submit____________', this.props.values);
    this.props.submitUploadForm(this.props.values);
  }

  getUploadForm() {
    const {
      values,
      touched,
      errors,
      handleChange,
      handleBlur,
    } = this.props;

    return (
      <form>
        <div className="bucket-form-field">
          <input
            id={'url'}
            placeholder={'Enter URL of data to classify'}
            type="url"
            value={values['url']}
            onChange={handleChange}
            onBlur={handleBlur}
            className={
              errors['url'] && touched['url']
                ? 'text-input error'
                : 'text-input'
            }
          />
          {errors['url'] &&
            touched['url'] && (
              <div className="input-feedback">{errors['url']}</div>
            )}
        </div>
        <DataFields
          fieldName="dataFields"
          ct={this.state.dataFieldCount}
          incrementDataFields={this.incrementDataFields.bind(this)}
          decrementDataFields={this.decrementDataFields.bind(this)}
          {...this.props}
        />
        <button type="submit" onClick={this.handleSubmit.bind(this)}>
          SUBMIT
        </button>
      </form>
    );
  }

  incrementDataFields(e) {
    e.preventDefault();
    console.log('+++++++++', this);
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

  render() {
    const tagClouds = Object.keys(this.props.buckets).map((buck, i) => {
      const data = [];
      this.props.buckets[buck].forEach(item => {
        if (item[0]) {
          data.push({value: item[0], count: item[1]});
        }
      });
      return (
        <div className="bucket-tag-cloud-container" key={i}>
          <h2>{buck}</h2>
          <TagCloud minSize={20} maxSize={50} tags={data} />
        </div>
      );
    });

    return (
      <div id="upload-form-main">
        <h2>Success!</h2>
        <p className="lead">
          We've built a model based on your training data. Enter a link to a
          file you want to classify.
        </p>
        {this.getUploadForm()}
        <Row>{tagClouds}</Row>
      </div>
    );
  }
}
const UploadPage = withFormik({
  mapPropsToValues: () => {},
  validationSchema: (props) => {
    const dataFieldsShape = [...Array(props.dataFieldCount).keys()].reduce(
      (acc, i) => {
        acc[`dataFields[${i}]`] = Yup.string().required(
          'Add a valid csv row header title or remove this field (-)',
        );
        return acc;
      },
      {},
    );
    const formShape = {
      url: Yup.string()
        .url('Invalid url')
        .required('URL required'),
    };
    return Yup.object().shape(Object.assign({}, dataFieldsShape, formShape));
  },
})(UploadForm);

export default UploadPage;
