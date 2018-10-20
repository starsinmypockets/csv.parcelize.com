import React, {Component} from 'react';
import {Grid, Row, Col} from 'react-bootstrap';
import Loader from 'react-loader';
import logo from './logo.svg';
import './App.css';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import TrainModelPage from './TrainModelPage';
import ClassifyPage from './ClassifyPage';
import FAQ from './FAQ';
import Splash from './Splash';
import PasswordForm from './PasswordForm';
import {getURLToken} from './utils';

const getBaseUrl = () => {
  const hostname = window && window.location && window.location.hostname;
  switch (hostname) {
    case 'csv.parcelize.com':
      return 'https://ts3ewworv2.execute-api.us-east-1.amazonaws.com/prod';
    case 'dev.parcelize.com':
      return 'https://rfm5bo1ob6.execute-api.us-east-1.amazonaws.com/dev';
    case 'localhost':
      return 'http://localhost:4000';
    default:
      return 'https://ts3ewworv2.execute-api.us-east-1.amazonaws.com/prod';
  }
};

let baseUrl = getBaseUrl();
const __version__ = 'ALPHA -- 0.2.15';

class App extends Component {
  constructor(props) {
    super(props);
    let initialRoute;
    const token = getURLToken();
    const loggedIn = sessionStorage.getItem('jwtToken');
    
    if (token) {
      initialRoute = 'has-token';
    } else {
      initialRoute = loggedIn ? 'user-home' : 'home';
    }
    
    this.state = {
      token: token,
      route: initialRoute,
      loaded: true,
      loggedIn: loggedIn,
    };

    this.doLogout = landingPage => {
      const route = landingPage || 'home';
      sessionStorage.removeItem('jwtToken');
      this.setState({
        loggedIn: false,
        route: route,
      });
    };

    if (token) {
      console.log('tok'), token;
      this.verifyTokenAction();
    } else if (loggedIn) {
      this.getLoggedUserAction();
    }
  }

  componentDidMount() {
    document.title = 'Parcelize CSV Classifier';
  }

  hasBuckets() {
    try {
      return this.state.buckets && Object.keys(this.state.buckets).length > 0;
    } catch (e) {
      console.log('HAS BUCKETS', e);
      return false;
    }
  }

  async callApi() {
    const response = await fetch(baseUrl + '/pipelines');
    const body = await response.json();
    console.log('OO', body);
    if (response.status !== 200) throw Error(body.message);
    return body;
  }

  async signupAction(opts) {
    console.log('Signup Action - app', opts);
    try {
      opts.username = opts.email;
      const res = await fetch(baseUrl + '/create-user', {
        method: 'POST',
        body: JSON.stringify(opts),
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });

      const body = await res.json();
      console.log('res', body);
      if (!res.ok) {
        this.setState({route: 'bad-submit'});
      } else {
        this.setState({
          route: 'submit-sent',
        });
      }
    } catch (e) {
      console.log(e);
      this.setState({route: 'has-error', error: e});
    }
  }

  async passwordAction(opts) {
    try {
      console.log('Register Action - app', opts);
      console.log(sessionStorage.getItem('jwtToken'));
      const res = await fetch(baseUrl + '/authenticate-user', {
        method: 'POST',
        body: JSON.stringify({password: opts.password}),
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: sessionStorage.getItem('jwtToken'),
        },
      });

      if (!res.ok) {
        this.setState({route: 'bad-submit'});
      } else {
        this.doLogout('login');
      }
    } catch (e) {
      console.log(e);
      this.setState({route: 'bad-submit'});
    }
  }

  async loginAction(opts) {
    try {
      console.log('LoginAction - app', opts);
      const body = {
        username: opts.email,
        password: opts.password,
      };
      const res = await fetch(baseUrl + '/login', {
        method: 'POST',
        body: JSON.stringify(body),
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });

      const data = await res.json();
      console.log('jwt token', data.token);

      if (!res.ok) {
        this.setState({route: 'login-fail'});
      } else {
        sessionStorage.setItem('jwtToken', data.token);
        this.setState({
          route: 'user-home',
          loggedIn: true,
          buckets: data.bucketInfo,
        });
      }
    } catch (e) {
      this.setState({route: 'login-fail'});
    }
  }

  async getLoggedUserAction() {
    try {
      const res = await fetch(baseUrl + '/verify-user', {
        method: 'GET',
        mode: 'cors',
        headers: {
          Authorization: sessionStorage.getItem('jwtToken'),
        },
      });

      const body = await res.json();
      if (!res.ok) {
        this.setState({
          route: 'bad-submit',
        });
      } else {
        this.setState({
          user: body.user,
          buckets: body.bucketInfo,
          route: 'user-home',
        });
      }
    } catch (e) {
      this.setState({
        route: 'has-error',
        loaded: true,
        error: e,
      });
    }
  }

  async verifyTokenAction() {
    try {
      const tok = getURLToken();
      sessionStorage.setItem('jwtToken', tok);

      const res = await fetch(baseUrl + '/verify-user', {
        method: 'GET',
        mode: 'cors',
        headers: {
          Authorization: tok,
        },
      });

      if (!res.ok) {
        this.setState({route: 'bad-submit'});
      } else {
        window.history.replaceState({}, document.title, '/');
        this.setState({
          route: 'has-token',
          loggedIn: true,
        });
      }
    } catch (e) {
      this.setState({route: 'bad-submit'});
    }
  }

  async retrainModelAction() {
    this.setState({buckets: null, route: 'user-home'});
  }

  async submitModelTrainFormAction(values) {
    try {
      console.log('SUBMIT TRAINING FORM', this, values);
      const reqBody = values;
      reqBody.name = values.modelName;

      // flatten dataFields to array
      reqBody.dataFields = Object.keys(values)
        .filter(f => f.includes('dataField'))
        .map(key => {
          return values[key];
        });

      this.setState({loaded: false});
      const res = await fetch(baseUrl + '/train', {
        method: 'POST',
        body: JSON.stringify(reqBody),
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: sessionStorage.getItem('jwtToken'),
        },
      });

      const body = await res.json();
      console.log('bucketinfo body', body);

      if (body) {
        this.setState({
          loaded: true,
          route: 'user-home',
          buckets: body,
        });
      } else {
        this.setState({
          route: 'bad-submit',
          loaded: true,
        });
      }
    } catch (e) {
      this.setState({
        route: 'has-error',
        loaded: true,
        error: e,
      });
    }
  }

  async submitClassifyFormAction(values) {
    try {
      console.log('SUBMIT UPLOAD FORM', this, values);

      this.setState({loaded: false});

      const res = await fetch(baseUrl + '/classify', {
        method: 'POST',
        body: JSON.stringify(values),
        responseType: 'application/octet-stream',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: sessionStorage.getItem('jwtToken'),
        },
      });

      const body = await res.json();
      const linksArray = body.map(async (link, i) => {
        console.log(link);
        const blob = await this.downloadBucket(link);
        const name = link.key
          .split('.')[0]
          .split('_')
          .slice(-1)[0];

        return (
          <li key={i}>
            <h4 className="bucketDl">
              <a
                href={'data:text/csv;charset=utf8,' + encodeURIComponent(blob)}
                download={name + '.csv'}>
                DOWNLOAD {name} CSV
              </a>
            </h4>
          </li>
        );
      });

      const links = await Promise.all(linksArray);

      if (body) {
        this.setState({
          loaded: true,
          route: 'has-dl-links',
          dlLinks: links,
        });
      } else {
        this.setState({
          loaded: true,
          route: 'has-error',
          error: 'No dl links',
        });
      }
    } catch (e) {
      this.setState({
        loaded: true,
        route: 'has-error',
        error: e,
      });
    }
  }

  async downloadBucket(opts) {
    try {
      const res = await fetch(baseUrl + '/download-bucket', {
        method: 'POST',
        body: JSON.stringify(opts),
        responseType: 'application/octet-stream',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: sessionStorage.getItem('jwtToken'),
        },
      });

      return await res.text();
    } catch (e) {
      this.setState({
        route: 'has-error',
        error: e,
      });
    }
  }

  route() {
    console.log(this.state.route, this.state);
    switch (this.state.route) {
      case 'login-fail':
        return (
          <div>
            <h3>Sign up today</h3>
            <SignupForm signupAction={this.signupAction.bind(this)} />
          </div>
        );
      case 'bad-submit':
        return (
          <div className="bad-response">
            <h2>Sorry!</h2>
            <p className="lead">
              Something went wrong with your request. Please try again later
            </p>
          </div>
        );
      case 'signup':
        return <SignupForm signupAction={this.signupAction.bind(this)} />;
      case 'login':
        return <LoginForm loginAction={this.loginAction.bind(this)} />;
      case 'FAQ':
        return <FAQ />;
      case 'submit-sent':
        return (
          <div className="submit-sent">
            <h2>Thank you!</h2>
            <p className="lead">Please check your email for your login link.</p>
            <p>(Make sure to check your Spam folder too)</p>
          </div>
        );
      case 'has-token':
        return <PasswordForm passwordAction={this.passwordAction.bind(this)} />;
      case 'user-home':
        if (this.hasBuckets()) {
          return (
            <ClassifyPage
              buckets={this.state.buckets}
              submitClassifyForm={this.submitClassifyFormAction.bind(this)}
              retrainModel={this.retrainModelAction.bind(this)}
            />
          );
        } else {
          return (
            <TrainModelPage
              appUses={this.state.appUses}
              trainingModel={this.state.trainingModel}
              submitModelTrainForm={this.submitModelTrainFormAction.bind(this)}
            />
          );
        }
      case 'model-submit':
        return (
          <div id="model-submit">
            <h2>Just a moment while we create a machine learning model</h2>
            <h3>This may take a few moments...</h3>
          </div>
        );
      case 'classify-submit':
        return (
          <div id="classify-submit">
            <h2>Your download will begin shortly...</h2>
          </div>
        );
      case 'has-dl-links':
        return (
          <div id="dl-links">
            <h2>Your parcelized csv files:</h2>
            <ul style={{listStyle: 'none'}}>{this.state.dlLinks}</ul>
          </div>
        );
      case 'has-error':
        console.log('HAS-ERROR', this.state);
        break;
      default:
        return '';
    }
  }

  render() {
    console.log('render', this.state);
    const header =
      this.state.route === 'home' ? (
        <Splash
          getSignup={() => {
            this.setState({route: 'signup'});
          }}
        />
      ) : (
        ''
      );
    const body = this.route();
    const accountMenu = this.state.loggedIn ? (
      <Row>
        <Col xs={0} md={9} />
        <Col xs={12} md={3}>
          <div className="account">
            <a href="http://parcelize.com">Info</a>
            <span> | </span>
            <a href="#" onClick={this.doLogout}>
              Logout
            </a>
            <span> | </span>
            <a href="csv.parcelize.com">Home</a>
            <span> | </span>
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                this.setState({route: 'FAQ'});
              }}>
              FAQ
            </a>
          </div>
        </Col>
      </Row>
    ) : (
      <Row>
        <Col xs={0} md={9} />
        <Col xs={12} md={3}>
          <div className="account">
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                this.setState({route: 'login'});
              }}>
              Login
            </a>
            <span> | </span>
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                this.setState({route: 'signup'});
              }}>
              Signup
            </a>
            <span> | </span>
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                this.setState({route: 'FAQ'});
              }}>
              FAQ
            </a>
          </div>
        </Col>
      </Row>
    );
    return (
      <div className="App">
        <link
          rel="stylesheet"
          href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
          integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u"
          crossOrigin="anonymous"
        />
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Parcelize -- CSV ({__version__})</h1>
        </header>
        <Loader loaded={this.state.loaded}>
          <Grid className="main">
            {accountMenu}
            {header}
            {body}
          </Grid>
        </Loader>
      </div>
    );
  }
}

export default App;
