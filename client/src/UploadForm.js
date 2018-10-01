import React, {Component} from 'react';
import {Row, Col, Button} from 'react-bootstrap';
import DataFields from './DataFields';
import BxTagCloud from './BxTagCloud';
import {withFormik} from 'formik';
import * as Yup from 'yup';

class UploadForm extends Component {
  constructor(props, context) {
    super(props, context);
    const token = window.location.pathname.slice(1);
    const countFields = Object.keys(this.props.buckets).reduce(
      (acc, bucket) => {
        acc[`${bucket}FieldCount`] = 1;
        return acc;
      },
      {},
    );
    this.state = Object.assign({}, countFields, {
      token: token,
      dataFieldCount: 1,
    });
  }

  incrementFormFields(e, field, max = 5, op = 'up') {
    e.preventDefault();
    const countField = `${field}FieldCount`;
    let i;

    if (op === 'up' && this.state[countField] < max) {
      i = this.state[countField] + 1;
    }

    if (op === 'down' && this.state[countField] > 1) {
      i = this.state[countField] - 1;
    }

    if (i) {
      const formState = {};
      formState[countField] = i;
      this.setState(formState);
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    console.log('submit____________', this.props.values);
    this.props.submitUploadForm(this.props.values);
  }

  getUploadForm() {
    const {values, touched, errors, handleChange, handleBlur} = this.props;
    const bx = Object.keys(this.props.buckets);
    const mdCols = Math.floor(12 / bx.length);
    const bucketTerms = bx.map(bucket => {
      return (
        <Col md={mdCols} key={bucket}>
          <h4 className="text-left">{bucket}</h4>
          <DataFields
            fieldName={`bucket${bucket}`}
            ct={this.state[`${bucket}FieldCount`]}
            placeholder={`${bucket} term`}
            incrementDataFields={e =>
              this.incrementFormFields(e, bucket, 5, 'up')
            }
            decrementDataFields={e =>
              this.incrementFormFields(e, bucket, null, 'down')
            }
            {...this.props}
          />
        </Col>
      );
    });

    return (
      <form>
        <Row>
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
        </Row>
        <br />
        <Row>
          <DataFields
            fieldName="dataFields"
            ct={this.state.dataFieldCount}
            placeholder="CSV Data Field"
            incrementDataFields={e =>
              this.incrementFormFields(e, 'data', 5, 'up')
            }
            decrementDataFields={e =>
              this.incrementFormFields(e, 'data', null, 'down')
            }
            {...this.props}
          />
        </Row>
        <Row>
          <h3>Classifier terms</h3>
          <p>Always associate the following terms with their bucket:</p>
          {bucketTerms}
        </Row>
        <Row>
          <button type="submit" onClick={this.handleSubmit.bind(this)}>
            SUBMIT
          </button>
        </Row>
      </form>
    );
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
        <div className="tag-clouds" key={i}>
          <h2>{buck}</h2>
          <BxTagCloud key={i} min={20} max={60} data={data} />
        </div>
      );
    });

    return (
      <div id="upload-form-main">
        <Row>
          <p className="lead">
            We've built a model based on your training data. Enter a link to a
            file you want to classify.
          </p>
          <p>
            If you would like to retrain your model{' '}
            <Button bsSize="sm" onClick={this.props.retrainModel}>
              Click Here
            </Button>
          </p>
          <p>
            **note** that in alpha you can only store one model at a time. You
            will not be able to access previous models.
          </p>
        </Row>
        {this.getUploadForm()}
        <Row>{tagClouds}</Row>
      </div>
    );
  }
}

const UploadPage = withFormik({
  mapPropsToValues: () => {},
  validationSchema: props => {
    let dataFieldsShape = {};
    for (let i = 0; i < props.dataFieldCount; i++) {
      dataFieldsShape[`dataFields[${i}]`] = Yup.string().required(
        'Add a valid csv row header title or remove this field (-)',
      );
    }

    const bucketFieldsShape = Object.keys(props.buckets).reduce(
      (acc, bucket) => {
        for (let i = 0; i < props[`${bucket}FieldCount`]; i++) {
          acc[`bucket${bucket}Field[${i}]`] = Yup.string().required(
            'Add a valid search term for this bucket, or remove the field (-)',
          );
          return acc;
        }
      },
      {},
    );

    const formShape = {
      url: Yup.string()
        .url('Invalid url')
        .required('URL required'),
    };
    const validationObject = Yup.object().shape(
      Object.assign({}, bucketFieldsShape, dataFieldsShape, formShape),
    );
    console.log('VALIDATOR');
    return validationObject;
  },
})(UploadForm);

export default UploadPage;
