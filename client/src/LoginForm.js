import React, {Component} from 'react';
import './forms.css';
import {
  Button,
  Nav,
  Navbar,
  NavItem,
  NavDropdown,
  MenuItem,
  Grid,
  Row,
  Col,
  ListGroup,
  ListGroupItem,
  FormGroup,
  ControlLabel,
  FormControl,
  HelpBlock,
} from 'react-bootstrap';
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
            errors.password && touched.email ? 'text-input error' : 'text-input'
          }
        />
        {errors.password &&
          touched.password && (
            <div className="input-feedback">{errors.password}</div>
          )}
      </div>
      <button type="submit" disabled={isSubmitting}>
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
  mapPropsToValues: () => ({email: ''}),
  validationSchema: Yup.object().shape({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string().required('Password field is required'),
  }),
  handleSubmit: (values, {props, setSubmitting}) => {
    console.log('VV', values);
    props.loginAction(values);
  },
  displayName: 'BasicForm', // helps with React DevTools
})(MyInnerForm);

class LoginForm extends Component {
  render() {
    return (
      <div id="bucketize-home">
        <Row>
          <h2>Try it for free</h2>
          <Col md={6} mdPush={3}>
            <EnhancedForm loginAction={this.props.loginAction} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default LoginForm;
