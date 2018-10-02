import React from 'react';
import {Row, Col} from 'react-bootstrap';
import DataFields from './DataFields';
import {withFormik} from 'formik';
import * as Yup from 'yup';

const form = props => {
    const {values, touched, errors, handleChange, handleBlur, buckets,arrayFieldCounts, incrementFormFields, doSubmit} = props;
    console.log('arrayFieldCt', arrayFieldCounts)
    const bx = Object.keys(buckets).filter(k => !k.includes('dataField'));
    const mdCols = Math.floor(12 / bx.length);
    const bucketTerms = bx.map(bucket => {
      return (
        <Col md={mdCols} key={bucket}>
          <h4 className="text-left">{bucket}</h4>
          <DataFields
            fieldName={bucket}
            ct={arrayFieldCounts[bucket]}
            placeholder={`${bucket} term`}
            incrementDataFields={e =>
              incrementFormFields(e, bucket, 5,1, 'up')
            }
            decrementDataFields={e =>
              incrementFormFields(e, bucket,5,1, 'down')
            }
            {...props}
          />
        </Col>
      );
    });

    return (
      <form onSubmit={e => {e.preventDefault(); doSubmit()}}>
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
            ct={arrayFieldCounts.dataFields}
            placeholder="CSV Data Field"
            incrementDataFields={e =>
              incrementFormFields(e, 'dataFields', 5,1, 'up')
            }
            decrementDataFields={e =>
              incrementFormFields(e, 'dataFields', null, 1,  'down')
            }
            {...props}
          />
        </Row>
        <Row>
          <h3>Classifier terms</h3>
          <p>Always associate the following terms with their bucket:</p>
          {bucketTerms}
        </Row>
        <Row>
          <button type="submit" disabled={props.isSubmitting || !props.isValid}>
            SUBMIT
          </button>
        </Row>
      </form>
    );
}

const enhancer = withFormik({
  mapPropsToValues: () => {},
  validationSchema: props => {
    console.log("PPPPP", props)
    const validationObj = Object.keys(props.arrayFieldCounts).reduce((acc, key) => {
    for (let i = 0; i < props.arrayFieldCounts[key]; i++) {
      if(key === 'dataFields') {
      acc[`${key}_${i}`] = Yup.string().required(
        'Add a valid name or remove this field (-)',
      );
      } else {
      acc[`${key}_${i}`] = Yup.string()
      }
    }
    return acc
  }, {})
  
  validationObj.url = Yup.string().url('Invalid url').required('Valid URL required')

    return Yup.object().shape(validationObj)
  },
})

export default enhancer(form);
