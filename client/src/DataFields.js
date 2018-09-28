import React, {Component} from 'react';
import {Row, Col} from 'react-bootstrap';

class DataFields extends Component {
  getDataFields() {
    const {
      ct,
      fieldName,
      values,
      touched,
      errors,
      handleChange,
      handleBlur,
    } = this.props;

    return [...Array(ct).keys()].map(i => {
      const name = `${fieldName}[${i}]`;

      return (
        <Col md={3} key={i}>
          <div className="data-field-container">
            <input
              id={name}
              placeholder={'CSV Data field'}
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
        </Col>
      );
    });
  }

  render() {
    console.log('DFDF', this.getDataFields());
    return (
      <div>
        <Row id="data-field-controls" style={{textAlign: ''}}>
          <Col>
            <h5>
              <button
                className="increment-bucket"
                onClick={this.props.incrementDataFields}>
                +
              </button>{' '}
              <button
                className="increment-buckets"
                onClick={this.props.decrementDataFields}>
                -
              </button>
            </h5>
          </Col>
        </Row>
        <Row id="data-fields">{this.getDataFields()}</Row>
      </div>
    );
  }
}

export default DataFields;
