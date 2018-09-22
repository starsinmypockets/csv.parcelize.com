import React, { Component } from 'react'
import './forms.css'
import {Button, Nav, Navbar, NavItem, NavDropdown, MenuItem, Grid, Row, Col, ListGroup, ListGroupItem, FormGroup, ControlLabel, FormControl, HelpBlock} from 'react-bootstrap'
import * as Yup from 'yup'
import { withFormik } from 'formik'

const MIN_PW_SCORE = 40

function scorePassword(pass) {
    var score = 0;
    if (!pass)
        return score;

    // award every unique letter until 5 repetitions
    var letters = new Object();
    for (var i=0; i<pass.length; i++) {
        letters[pass[i]] = (letters[pass[i]] || 0) + 1;
        score += 5.0 / letters[pass[i]];
    }

    // bonus points for mixing it up
    var variations = {
        digits: /\d/.test(pass),
        lower: /[a-z]/.test(pass),
        upper: /[A-Z]/.test(pass),
        nonWords: /\W/.test(pass),
    }

    var variationCount = 0;
    for (var check in variations) {
        variationCount += (variations[check] == true) ? 1 : 0;
    }
    score += (variationCount - 1) * 10;

    return parseInt(score);
}

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
      <div class="password-form-inputs" style={{minHeight: '60px'}}>
        <input
          id="password"
          placeholder="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          className={errors.email && touched.email ? 'text-input error' : 'text-input'}
        />
        {errors.password &&
        touched.password && <div className="input-feedback">{errors.password }</div>}
        <input
          id="confirmPassword"
          placeholder="Confirm password"
          type="password"
          value={values.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          className={errors.confirmPmail && touched.confirmPassword ? 'text-input error' : 'text-input'}
        />
        {errors.confirmPassword &&
        touched.confirmPassword && <div className="input-feedback">{errors.confirmPassword}</div>}
      </div>
      <div class="topmatter">
        <p>Welcome to Parcelize. Please choose a strong password to get started!</p>
      </div>
      <div class="login-form-buttons" style={{marginTop: '2em', width: '100%'}}>
        <button type="submit" disabled={isSubmitting}>
          Submit
        </button>
      </div>
    </form>
  )
}

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
    password: Yup.string()
      .required('Password is required')
      .test('pw-strength', 'Please choose a stronger password!', (val) => {
        return scorePassword(val) >= MIN_PW_SCORE
      }),
    confirmPassword: Yup.string()
      .equalTo(Yup.ref('password'), 'Passwords do not match')
      .required('Please confirm password')
  }),
  handleSubmit: (values, { props, setSubmitting }) => {
    console.log("PW", values)
    props.passwordAction(values)
  },
  displayName: 'BasicForm', // helps with React DevTools
})(MyInnerForm);

class PasswordForm extends Component {
  render() {
    return (
      <div id="bucketize-home">
        <Row>
            <h2>Welcome to Parcelize</h2>

            <Col md={6} mdPush={3}>
              <EnhancedForm 
                passwordAction={this.props.passwordAction}
              />
            </Col>
        </Row>
      </div>
    )
  }
}

export default PasswordForm
