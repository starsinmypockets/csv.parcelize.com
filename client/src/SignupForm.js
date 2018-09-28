import React, { Component } from 'react'
import './forms.css'
import {Button, Nav, Navbar, NavItem, NavDropdown, MenuItem, Grid, Row, Col, ListGroup, ListGroupItem, FormGroup, ControlLabel, FormControl, HelpBlock} from 'react-bootstrap'
import * as Yup from 'yup'
import { withFormik } from 'formik'


// Our inner form component. Will be wrapped with Formik({..})
const MyInnerForm = props => {
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
  } = props;
  return (
    <form onSubmit={handleSubmit}>
      <div class="login-form-inputs" style={{minHeight: '60px'}}>
        <input
          id="email"
          placeholder="Enter your email"
          type="text"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          className={errors.email && touched.email ? 'text-input error' : 'text-input'}
        />
        {errors.email &&
        touched.email && <div className="input-feedback">{errors.email}</div>}
        <input
          id="confirmEmail"
          placeholder="Confirm email"
          type="text"
          value={values.confirmEmail}
          onChange={handleChange}
          onBlur={handleBlur}
          className={errors.confirmEmail && touched.confirmEmail ? 'text-input error' : 'text-input'}
        />
        {errors.confirmEmail &&
        touched.confirmEmail && <div className="input-feedback">{errors.confirmEmail}</div>}
        <div class="left" style={{width:'50%', float:'left'}}>
          <input
            id="firstName"
            placeholder="First Name"
            type="text"
            value={values.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors.firstName && touched.firstName ? 'text-input error' : 'text-input'}
          />
          {errors.firstName &&
        touched.firstName && <div className="input-feedback">{errors.firstName }</div>}
        </div>
        <div class="right" style={{width:'50%', float:'left'}}>
        <input
          id="lastName"
          placeholder="Last Name"
          type="text"
          value={values.lastName}
          onChange={handleChange}
          onBlur={handleBlur}
          className={errors.lastName && touched.lastName ? 'text-input error' : 'text-input'}
        />
        {errors.lastName &&
        touched.lastName && <div className="input-feedback">{errors.lastName }</div>}
        </div>
      </div>
      <div class="topmatter">
        <p>By clicking Sign Up, you are agreeing with our <a href="/tos">Terms and Conditions of Use</a>.</p>
        <p><a href="/privacy">Privacy Policy</a>.</p>
      </div>
      <div class="login-form-buttons" style={{marginTop: '2em', width: '100%'}}>
        <button type="submit" disabled={isSubmitting}>
          Sign Up
        </button>
      </div>
    </form>
  )
}

// eslint-disable-next-line
function equalTo(ref: any, msg: any) {
  return Yup.mixed().test({
    name: 'equalTo',
    exclusive: false,
    message: msg || '${path} must be the same as ${reference}',
    params: {
      reference: ref.path,
    },
    test: function(value: any) {
      return value === this.resolve(ref);
    },
  });
}

Yup.addMethod(Yup.string, 'equalTo', equalTo)

const EnhancedForm = withFormik({
  mapPropsToValues: () => ({ email: '' }),
  validationSchema: Yup.object().shape({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required!'),
    confirmEmail: Yup.string()
      .equalTo(Yup.ref('email'), 'Emails do not match')
      .required('Please confirm email'),
    firstName: Yup.string()
      .required('First name is required!'),
    lastName: Yup.string()
      .required('Last name is required!'),
  }),
  handleSubmit: (values, { props, setSubmitting }) => {
    values.name = values.firstName + ' ' + values.lastName
    console.log("VV", values)
    props.signupAction(values)
  },
  displayName: 'BasicForm', // helps with React DevTools
})(MyInnerForm);

class SignupForm extends Component {
  render() {
    return (
      <div id="bucketize-home">
        <Row>
            <h2>Try it for free</h2>
            <Col md={6} mdPush={3}>
              <EnhancedForm 
                signupAction={this.props.signupAction}
              />
            </Col>
        </Row>
      </div>

    )
  }
}

export default SignupForm
