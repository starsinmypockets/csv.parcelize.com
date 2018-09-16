import React, { Component } from 'react'
import {Button, Nav, Navbar, NavItem, NavDropdown, MenuItem, Grid, Row, Col, ListGroup, ListGroupItem, FormGroup, ControlLabel, FormControl, HelpBlock} from 'react-bootstrap'
import { withFormik } from 'formik';
import * as Yup from 'yup'

class TrainModelForm extends Component {
  constructor(props, context) {
    super(props, context)
    const token = window.location.pathname.slice(1)
    this.state = {
      token: token,
      bucketCount: 2,
      dataFieldCount: 1
    }
  }

  componentDidMount() {
    this.setState({
      bucketForms : this.getBucketForms(this.state.bucketCount),
      dataFields: this.getDataFields(this.state.dataFieldCount)
    })
  }

  getBucketForms(i) {
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
    
    const bucketFields = [...Array(i).keys()].map(i => {
      const name = 'bucketName' + i
      const url = 'bucketUrl' + i

      return (
      <div className="bucket-group-field">
        <div className="bucket-form-field">
          <input
            id={name}
            placeholder={"Bucket Name " + (i + 1)}
            type="text"
            value={values[name]}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors[name] && touched[name] ? 'text-input error' : 'text-input'}
          />
          {errors[name] &&
          touched[name] && <div className="input-feedback">{errors[name]}</div>}
        </div>
        <div className="bucket-form-field">
          <input
            id={url}
            placeholder={"Bucket URL " + (i + 1)}
            type="url"
            value={values[url]}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors[url] && touched[url] ? 'text-input error' : 'text-input'}
          />
          {errors[url] &&
          touched[url] && <div className="input-feedback">{errors[url]}</div>}
        </div>
      </div>
      )
    })

    return (
      <div className="bucket-fields">"
        {bucketFields}
      </div>
    )
  }
  
  getDataFields(i) {
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
    
    return [...Array(i).keys()].map(i => {
      const name = `datafield[${i}]`

      return (
        <div className="data-field-container">
          <input
            id={name}
            placeholder={"CSV Data field"}
            type="text"
            value={values[name]}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors[name] && touched[name] ? 'text-input error' : 'text-input'}
          />
          {errors[name] &&
          touched[name] && <div className="input-feedback">{errors[name]}</div>}
        </div>
      )
    })
  }

  incrementBuckets() {
    const maxBucketCount = this.props.bucketCount || 3
    if (this.state.bucketCount < maxBucketCount) {
      const i = this.state.bucketCount + 1
      this.setState({ 
        bucketCount: i,
        bucketForms: this.getBucketForms(i)
      })
    }
  }

  decrementBuckets() {
    if (this.state.bucketCount > 2) {
      const i = this.state.bucketCount - 1
      this.setState({ 
        bucketCount: i,
        bucketForms: this.getBucketForms(i)
      })
    }
  }
  
  incrementDataFields(e) {
    e.preventDefault()
    if (this.state.dataFieldCount < 5) {
      const i = this.state.dataFieldCount + 1
      this.setState({ 
        dataFieldCount: i,
        dataFields: this.getDataFields(i)
      })
    }
  }

  decrementDataFields(e) {
    e.preventDefault()
    if (this.state.dataFieldCount > 1) {
      const i = this.state.dataFieldCount - 1
      this.setState({ 
        dataFieldCount: i,
        dataFields: this.getDataFields(i)
      })
    }
  }

  handleSubmit(e) {
    e.preventDefault()
    console.log("submit____________", this.props.values)
    this.props.submitModelTrainForm(this.props.values)
  }
  

  render() {
    console.log(this.state)
    const form = 
      <form>
        {this.state.bucketForms}
        <div className="header-fields">
          <p className="lead">Enter the fieldnames we are going to evaluate. For example: "title" and "description".</p>
          <p>Fields will be combined and processed as a string. Fieldnames must be the same for all files, but only for the fields we are evaluating. Additional fields will be ignored.</p> 
        </div>
        {this.state.dataFields}<button className="increment-bucket" onClick={this.incrementDataFields.bind(this)}>+</button> <button className="increment-buckets" onClick={this.decrementDataFields.bind(this)}>-</button>
        <button type="submit" onClick={this.handleSubmit.bind(this)}>SUBMIT</button>
      </form>
    
    return (
    <Grid id="classifier">
      <Row>
      <h1>Step 1 -- Train your model</h1>
      <div id="training-data-page">
        <h2 className="numBuckets">Number of Buckets:  {this.state.bucketCount} <button className="increment-bucket" onClick={this.incrementBuckets.bind(this)}>(+)</button> <button className="increment-buckets" onClick={this.decrementBuckets.bind(this)}>(-)</button></h2>
      </div>

      <h3>"Buckets"</h3>
      <p>
        We're going to classify your information into "Buckets". Each bucket is identified by a key (for instance, "information request") and has an associated csv file. The csv file will serve as training information for this bucket. 
      </p>
      <p>
        You can have as many buckets as you need, but you need training data for each bucket, and all of the training data need to be formatted the same.
      </p>
      </Row>
      {form}
    </Grid>
    )
  }
}

const TrainingPage = withFormik({
  mapPropsToValues: () => {
    // umm
  },
  validationSchema: (props, context) => {
    console.log('valid', props, context)
    const bucketShape = [...Array(props.bucketCount).keys()].reduce((acc, i) => {
       acc["bucketName"+i] = Yup.string().required('Each bucket must have unique name!')
       acc["bucketUrl"+i] = Yup.string().url('Invalid url').required('URL required')
       return acc
    }, {})
    const dataFieldsShape = [...Array(props.dataFieldCount).keys()].reduce((acc, i) => {
      acc[`datafield[${i}]`] = Yup.string().required('Add a valid csv row header title or remove this field (-)')
      return acc
    }, {})
    return Yup.object().shape(Object.assign(bucketShape, dataFieldsShape))
  }
})(TrainModelForm)

export default TrainingPage
