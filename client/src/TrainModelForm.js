import React from 'react';
import {Row, Col} from 'react-bootstrap';
import {withFormik} from 'formik';
import * as Yup from 'yup';
/* import DataFields from './DataFields'; */

const form = props => {
  const {isValid, isSubmitting} = props
  return (
    <form>
      <Row id="bucket-forms">{getBucketForms(props)}</Row>
      <Row className="header-fields">
        <Col>
          <span className="h4">Field names</span>
          <span> -- </span>
          <span>
            Enter the fieldnames we are going to evaluate. For example: "title"
            and "description". Text from selected fields will be combined.
            Specified field names must be the same for all files.
          </span>
        </Col>
      </Row>
      <Row id="submit-training-data">
        <br />
        <button type="submit" disabled={isSubmitting || !isValid}>
          SUBMIT
        </button>
      </Row>
    </form>
  );
};

const getBucketForms = props => {
  const {values, touched, errors, handleChange, handleBlur, bucketCount} = props;
  const bucketForms = [];
  for (let i = 0; i < bucketCount; i++) {
    const name = 'bucketName' + i;
    const url = 'bucketUrl' + i;

    bucketForms.push(
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
              errors[name] && touched[name] ? 'text-input error' : 'text-input'
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
            touched[url] && <div className="input-feedback">{errors[url]}</div>}
        </div>
      </Col>,
    );
  }

  return bucketForms;
};

const enhancer= withFormik({
  mapPropsToValues: () => {
    // umm
  },
  validationSchema: (props, context) => {
    console.log('valid', props, context);
    let bucketShape = {}
      for (let i = 0; i < props.bucketCount; i++) {
        bucketShape['bucketName' + i] = Yup.string().required(
          'Each bucket must have unique name!',
        );
        bucketShape['bucketUrl' + i] = Yup.string()
          .url('Invalid url')
          .required('URL required');
      }
    /* const dataFieldsShape = [...Array(props.dataFieldCount).keys()].reduce( */
    /*   (acc, i) => { */
    /*     acc[`dataFields[${i}]`] = Yup.string().required( */
    /*       'Add a valid csv row header title or remove this field (-)', */
    /*     ); */
    /*     return acc; */
    /*   }, */
    /*   {}, */
    /* ); */
    /* return Yup.object().shape(Object.assign(bucketShape, dataFieldsShape)); */
    return Yup.object().shape(bucketShape);
  },
});

export default enhancer(form);
