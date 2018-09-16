import React, { Component } from 'react'
import {Button, Nav, Navbar, NavItem, NavDropdown, MenuItem, Grid, Row, Col, ListGroup, ListGroupItem, FormGroup, ControlLabel, FormControl, HelpBlock} from 'react-bootstrap'
import TextArrayInput from './TextArrayInput.js'
import { TagCloud } from 'react-tagcloud'
import { withFormik } from 'formik';
import * as Yup from 'yup'

class UploadForm extends Component {
  constructor(props, context) {
    super(props, context)
    const token = window.location.pathname.slice(1)
    this.state = {token: token}
  }


  getUploadForm() {
    const {
      values,
      touched,
      errors,
      dirty,
      isSubmitting,
      handleChange,
      handleBlur,
      handleSubmit,
      handleReset,
    } = this.props;

    return (
      <form>
        <div className="bucket-form-field">
          <input
            id={"url"}
            placeholder={"Enter URL of data to classify"}
            type="url"
            value={values["url"]}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors["url"] && touched["url"] ? 'text-input error' : 'text-input'}
          />
          {errors["url"] &&
          touched["url"] && <div className="input-feedback">{errors["url"]}</div>}
        </div>
        <button type="submit" onClick={this.props.submitUploadForm.bind(this, this.props.values)}>SUBMIT</button>
      </form>
    )
  }

  render() {
    console.log(this)
    const tagClouds = Object.keys(this.props.buckets).map(buck => {
      const data = []
      this.props.buckets[buck].forEach(item => {
        if (item[0]) {
          data.push({value: item[0], count: item[1]})
        }
      })
      return (
        <div className="bucket-tag-cloud-container">
          <h2>{buck}</h2>
          <TagCloud 
            minSize={20}
            maxSize={50}
            tags={data}
          />
        </div>
      )
    })
 
    return (
    <div id="upload-form-main">
      <h2>Success!</h2>
      <p class="lead">We've built a model based on your training data. Enter a link to a file you want to classify.</p>
      {this.getUploadForm()}
      <Row>
        {tagClouds}
      </Row>
    </div>
    )
  }
}
const UploadPage = withFormik({
  mapPropsToValues: () => {},
  validationSchema: (props, context) => {
    return Yup.object().shape({
      url: Yup.string().url('Invalid url').required('URL required') 
    })
  }
})(UploadForm)

export default UploadPage
