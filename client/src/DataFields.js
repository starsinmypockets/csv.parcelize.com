import React, {Component} from 'react';
import {Row, Col, Button} from 'react-bootstrap';

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
      placeholder,
    } = this.props;

    const datafields = [];

    for (let i = 0; i < ct; i++) {
      const name = `${fieldName}_${i}`;
      datafields.push(
        <Col sm={3} key={i}>
          <div className="data-field-container">
            <input
              id={name}
              placeholder={placeholder}
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
        </Col>,
      );
    }
    return datafields;
  }

  render() {
    return (
      <div>
        <Row id="data-fields" style={{textAlign: ''}}>
          {this.getDataFields()}
          <Col sm={3}>
            <h5>
              <Button
                className="increment-bucket"
                onClick={this.props.incrementDataFields}
                bsSize="xsmall"
                bsStyle="primary">
                +
              </Button>{' '}
              <Button
                className="increment-buckets"
                onClick={this.props.decrementDataFields}
                bsStyle="primary"
                bsSize="xsmall">
                -
              </Button>
            </h5>
          </Col>
        </Row>
      </div>
    );
  }
}

export default DataFields;
