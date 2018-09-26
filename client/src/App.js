import React, { Component } from 'react'
import {Button, Nav, Navbar, NavItem, NavDropdown, MenuItem, Grid, Row, Col, ListGroup, ListGroupItem, FormGroup, ControlLabel, FormControl, HelpBlock} from 'react-bootstrap'
import Loader from 'react-loader'
import logo from './logo.svg'
import './App.css'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'
import TrainModelForm from './TrainModelForm'
import UploadForm from './UploadForm'
import PasswordForm from './PasswordForm'
import { getURLToken, getAuthHeader } from './utils'
import filesaver from 'file-saver'

// const baseUrl = "https://rfm5bo1ob6.execute-api.us-east-1.amazonaws.com/dev"
const baseUrl = "http://localhost:4000"

class App extends Component {
  constructor(props, context) {
    super(props)
    const token = getURLToken()
    const loggedIn = sessionStorage.getItem('jwtToken')
    const initialRoute = (loggedIn) ? 'has-account' : 'home'
    this.state = {
      token: token,
      route: initialRoute,
      loaded: true,
      loggedIn: loggedIn
    }
    
    if (token) {
      this.verifyTokenAction()
    }
  }

  componentDidUpdate() {
    // handle polling for resources
    if (this.state.route === 'model-submit' && this.state.polling && this.state.polling > 0) {
      setTimeout(() => {
        this.getBucketInfoAction()
      }, 1200)
    }
  }

  doLogout() {
    sessionStorage.removeItem('jwtToken')
    this.setState({
      loggedIn: false,
      route: 'home'
    })
  }
  
  async callApi() {
    const response = await fetch(baseUrl+'/pipelines')
    const body = await response.json()
    console.log("OO", body)
    if (response.status !== 200) throw Error(body.message)
    return body
  }

  async signupAction(opts) {
    console.log("Signup Action - app", opts)
    opts.username = opts.email
    const res = await fetch(baseUrl+'/create-user', {
      method: "POST", 
      body: JSON.stringify(opts),
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    })

    const body = await res.json()
    console.log("res", body)
    if (!body) {
      this.setState({route: "bad-submit"})
    } else {
      this.setState({route: "submit-sent"})
    } 
  }
  
  async passwordAction(opts) {
    console.log("Register Action - app", opts)
    const res = await fetch(baseUrl+'/authenticate-user', {
      method: "POST", 
      body: JSON.stringify(opts),
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": getURLToken(),
      },
    })

    if (!res.ok) {
      this.setState({route: "bad-submit"})
    } else {
      this.setState({route: "has-account"})
    } 
  }
  
  async loginAction(opts) {
    try {
      console.log("LoginAction - app", opts)
      const body = {
        username: opts.email,
        password: opts.password
      }
      const res = await fetch(baseUrl+'/login', {
        method: "POST", 
        body: JSON.stringify(body),
        mode: 'cors',
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      })

      const data = await res.json()
      console.log('jwt token', data.token)

      if (res.status > 299) {
        this.setState({route: 'login-fail'})
      }

      if (!res.ok) {
        this.setState({route: "bad-submit"})
      } else {
          sessionStorage.setItem('jwtToken', data.token)
        this.setState({
          route: "has-account",
          loggedIn: true
        })
      } 
    } catch (e) {
      this.setState({route: 'has-error', error: e})
    }
  }

  async verifyTokenAction() {
    const body = JSON.stringify({token: getURLToken()})
    console.log('body', body)
    sessionStorage.setItem('jwtToken', getURLToken())
    const res = await fetch(baseUrl+'/verify-user', {
      method: "GET", 
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": sessionStorage.getItem('jwtToken'),
      },
    })

    if (res.status !== 200) {
      this.setState({route: ""})
    } else { 
      window.history.replaceState({}, document.title, "/")
      this.setState({
        route: 'has-token',
        loggedIn: true
      })
    }
  }
  
  async submitModelTrainFormAction(values) {
    try {
      console.log("SUBMIT TRAINING FORM", this, values)
      const reqBody = values
      reqBody.name = values.modelName
      
      this.setState({loaded: false})
      const res = await fetch(baseUrl+'/train', {
        method: "POST", 
        body: JSON.stringify(reqBody),
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": sessionStorage.getItem('jwtToken'),
        },
      })

      const body = await res.json()
      console.log('server res', body)
      
      if (body.received) {
        // wait for model to be ready
        this.setState({
          route: 'model-submit',
          loaded: true,
          polling: 10
        })
      } else {
        this.setState({
          route: 'has-error',
          loaded: true,
          error: body,
        })
      }
    } catch (e) {
      this.setState({
        route: 'has-error',
        loaded: true,
        error: e,
      })
    }
  }

  async getBucketInfoAction() {
    try {
      const res = await fetch(baseUrl+'/training-data', {
        method: "GET", 
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": sessionStorage.getItem('jwtToken'),
        },
      })

      const body = await res.json()
      console.log('getBucketInfo res', body)

      if (body.bucketInfo) {
        this.setState({
          loaded: true,
          route: 'has-model',
          buckets: body.bucketInfo,
          polling: 0
        })
      } else {
        // try ten times and give up
        // see componentDidMount for other side of this loop
        const retries = (this.state.polling - 1)
        console.log("retries", retries)
        this.setState({
          loaded: true,
          route: 'has-error',
          polling: retries, 
          error: body,
        })
      }
    } catch (e) {
      this.setState({
        loaded: true,
        route: 'has-error',
        error: e
      })
    }
  }
  
  async submitUploadFormAction(values) {
    try {
      console.log("SUBMIT UPLOAD FORM", this, values)
      
      this.setState({loaded: false})
      const res = await fetch(baseUrl+'/classify', {
        method: "POST", 
        body: JSON.stringify(values),
        responseType: 'application/octet-stream',
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": sessionStorage.getItem('jwtToken')
        },
      })

      const body = await res.json()
      const linksArray = body.map(async link => {
        console.log(link)
        const blob = await this.downloadBucket(link)
        const name = link.key.split('.')[0].split('_').slice(-1)[0]

        return (
          <li>
            <h4 className="bucketDl">
              <a href={"data:text/csv;charset=utf8,"+encodeURIComponent(blob)} download={name+".csv"}>DOWNLOAD {name} CSV</a>
            </h4>
          </li>
        )
      })

      const links = await Promise.all(linksArray)

      if (body) {
        this.setState({
          loaded: true,
          route: 'has-dl-links',
          dlLinks: links
        })
      } else {
        this.setState({
          loaded: true,
          route: 'has-error',
          error: 'No dl links'
        })
      }
    } catch (e) {
      this.setState({
        loaded: true,
        route: 'has-error',
        error: e
      })
    }
  }

  async downloadBucket (opts) {
    try {
      const res = await fetch(baseUrl+'/download-bucket', {
        method: "POST", 
        body: JSON.stringify(opts),
        responseType: 'application/octet-stream',
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": sessionStorage.getItem('jwtToken')
        },
      })

      return await res.text()
    } catch (e) {
      this.setState({
        route: 'has-error',
        error: e
      })
    }
  }

  route() {
    // validate token here
    switch (this.state.route) {
      case "bad-submit":
        return <div className="bad-response">
            <h2>Sorry!</h2>
            <p className="lead">Something went wrong with your request. Please try again later</p>
          </div>
        break
      case "signup":
        return (
          <SignupForm
            signupAction={this.signupAction.bind(this)}
          /> 
        )
        break
      case "login":
        return (
          <LoginForm
            loginAction={this.loginAction.bind(this)}
          /> 
        )
        break
      case "submit-sent":
        return <div className="submit-sent">
            <h2>Thank you!</h2>
            <p className="lead">Please check your email for your login link.</p>
          </div>
        break
      case "has-token":
        return <PasswordForm 
          passwordAction={this.passwordAction.bind(this)}
        />
        break
      case "has-account":
        return <TrainModelForm
          appUses={this.state.appUses}
          trainingModel={this.state.trainingModel}
          submitModelTrainForm={this.submitModelTrainFormAction.bind(this)}
        />
        break
      case "login-fail":
        return <p>Login fail</p>
      case "model-submit":
        return <div id="model-submit">
          <h2>Just a moment while we create a machine learning model</h2>
        </div>
        break
      case "has-model":
        return <UploadForm 
          buckets={this.state.buckets}
          submitUploadForm={this.submitUploadFormAction.bind(this)}
        />
        break
      case "classify-submit":
        return <div id="classify-submit">
          <h2>Your download will begin shortly...</h2>
        </div>
        break
      case "has-dl-links":
        return (
          <div id="dl-links">
            <h2>Your parcelized csv files:</h2>
            <ul>
              {this.state.dlLinks}
            </ul>
          </div>
        )
        break
      case "has-error":
        console.log('HAS-ERROR', this.state)
        break
      default:
        return ""
    }
  }

  renderIntro() {
    const liStyle = {textAlign:'left', listStyle: 'none'}

    return (
    <div className="welcome" style={liStyle}>    
      <Row className="intro-header">
        <Col xs={12}>
          <h2 style={{textAlign:'center'}}>Sort CSV rows into categories</h2>
          <p className="lead">A simple tool for sorting csv rows based on text analysis.</p>
          <button onClick={(e) => {e.preventDefault();this.setState({route:'signup'})}}>Signup is free</button>
          <br />
          <p className="lead">Some uses include:</p>
          <ul>
            <li><h4>sentiment analysis (<strong>Pro</strong>, <strong>Con</strong>)</h4></li>
            <li><h4>score responses (<strong>Strong</strong>, <strong>Weak</strong>)</h4></li>
            <li><h4>prioritize events (<strong>Attend</strong>, <strong>RSVP-only</strong>, <strong>Ignore</strong>)</h4></li>
            <li><h4>sort email (<strong>Urgent</strong>, <strong>High-priority</strong>, <strong>Low-priority</strong>, <strong>Spam</strong>)</h4></li>
            <li><h4>automate decision making (<strong>Call back</strong>, <strong>Send email</strong>, <strong>Ignore</strong>)</h4></li>
          </ul>
        </Col>
      </Row>
    <Row><br /></Row>
      <Row>
        <Col xs={12}>
          <p className="lead">While there's no replacement for the wit and wisdom of humanity, we don't need to spend hours sifting through data. Let the machine do the work - drink a cup of coffee and press go. Review the results and tweak. Adjust. Leave the tedium out of your day.</p>
          <ul>
            <li>
              <h4 class="instruction-step">
                Step 1: Sort your csv's into separate files by category (ex: attend, ignore)
              </h4>
            </li>
            <li>
              <h4 class="instruction-step">
                Step 2: Upload the files to google docs
              </h4>
            </li>
            <li>
              <h4 class="instruction-step">
                Step 3: Provide links to the files and tell us which columns to consider
              </h4>
            </li>
            <li>
              <h4 class="instruction-step">
                Step 4: Run the trainer and take a look at the results
              </h4>
            </li>
            <li>
              <h4 class="instruction-step">
                Step 5: Upload a csv of uncategorized data (make sure it has the appropriate column headers)
              </h4>
            </li>
            <li>
              <h4 class="instruction-step">
                Step 6: Download your sorted files
              </h4>
            </li>
          </ul>
        </Col>
      </Row>
      <Row>
        <Col>
          <ul style={{listStyle: 'none'}}>
            <li><h3 className="lead"><a href="#">View a demo</a></h3></li>
            <li><h3 className="lead"><a href="#">Read an article on Medium</a></h3></li>
          </ul>
        </Col>
      </Row>
    </div>
    )
  }

  render() {
    console.log("render",this.state)
    const header = (this.state.route === "home") ? this.renderIntro() : ""
    const body = this.route()
    const accountMenu = (this.state.loggedIn) ? 
        <Row>
          <Col xs={0} md={9} />
          <Col xs={12} md={3}>
            <div class="account">
              <a href="parcelize.com">Info</a>
              <span> |  </span>
              <a href="#" onClick={this.doLogout.bind(this)}>Logout</a>
            </div>
          </Col>
        </Row>
      :
        <Row>
          <Col xs={0} md={9} />
          <Col xs={12} md={3}>
            <div class="account">
              <a href="#" onClick={(e => {e.preventDefault(); this.setState({route: 'login'})})}>Login</a>
              <span> |  </span>
              <a href="#" onClick={(e => {e.preventDefault(); this.setState({route: 'signup'})})}>Signup</a>
            </div>
          </Col>
        </Row>
    return (
      <div className="App">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous"/>
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Parcelize -- CSV</h1>
        </header>
        <Loader loaded={this.state.loaded}>
          <Grid className="main">
            {accountMenu}
            {header}
            {body}
          </Grid>
        </Loader>
      </div>
    )
  }
}

export default App
