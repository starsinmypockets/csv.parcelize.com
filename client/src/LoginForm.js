import React, {Component} from 'react';
import './forms.css';
import {Button, Row, Col} from 'react-bootstrap';
import * as Yup from 'yup';
import {withFormik} from 'formik';

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
    handleReset,
    loginAction,
    isValid,
  } = props;
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        loginAction(values);
      }}>
      <div class="login-form-inputs" style={{minHeight: '60px'}}>
        <input
          id="email"
          placeholder="Enter your email"
          type="text"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          className={
            errors.email && touched.email ? 'text-input error' : 'text-input'
          }
        />
        {errors.email &&
          touched.email && <div className="input-feedback">{errors.email}</div>}
      </div>
      <div class="login-form-inputs" style={{minHeight: '60px'}}>
        <input
          id="password"
          placeholder="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          className={
            errors.password && touched.password
              ? 'text-input error'
              : 'text-input'
          }
        />
        {errors.password &&
          touched.password && (
            <div className="input-feedback">{errors.password}</div>
          )}
      </div>
      <button type="submit" disabled={isSubmitting || !isValid}>
        Login
      </button>
    </form>
  );
};

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

Yup.addMethod(Yup.string, 'equalTo', equalTo);

const EnhancedForm = withFormik({
  validationSchema: Yup.object().shape({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string().required('Password field is required'),
  }),
  displayName: 'BasicForm', // helps with React DevTools
})(MyInnerForm);

class LoginForm extends Component {
  handleSubmit(values) {
    this.props.loginAction(values);
  }

  render() {
    return (
      <div id="bucketize-home">
        <Row>
          <h2>Log In</h2>
          <Col md={6} mdPush={3}>
            <EnhancedForm loginAction={this.handleSubmit.bind(this)} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default LoginForm;
