import React, { Component } from 'react'
import {Button, Nav, Navbar, NavItem, NavDropdown, MenuItem, Grid, Row, Col, ListGroup, ListGroupItem, FormGroup, ControlLabel, FormControl, HelpBlock} from 'react-bootstrap'
import logo from './logo.svg'
import './App.css'
import LoginForm from './LoginForm.js'
import TrainModelForm from './TrainModelForm.js'
import UploadForm from './UploadForm.js'

const baseUrl = "https://beemsk0b9h.execute-api.us-east-1.amazonaws.com/dev"

// utils
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function getUrlParam(parameter, defaultvalue) {
    var urlparameter = defaultvalue;
    if(window.location.href.indexOf(parameter) > -1){
        urlparameter = getUrlVars()[parameter];
        }
    return urlparameter;
}

function getToken() {
  return getUrlParam('token', false)
}

class App extends Component {
  constructor(props, context) {
    super(props)
    const token = getToken()
    this.state = {
      token: token,
      route: "home"
    }
    
    if (token) {
      this.verifyToken()
    }
  }
  
  async callApi() {
    const response = await fetch(baseUrl+'/pipelines')
    const body = await response.json()
    console.log("OO", body)
    if (response.status !== 200) throw Error(body.message)
    return body
  }

  async loginAction(opts) {
    console.log("Login Action - app", opts)
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

  async verifyToken() {
    const body = JSON.stringify({token: getToken()})
    console.log('body', body)
    const res = await fetch(baseUrl+'/verify-user', {
      method: "POST", 
      body: body,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": "Bearer " + getToken(),
      },
    })

    if (res.status !== 200) {
      this.setState({route: ""})
    } else { 
      const body = await res.json()
      
      body.route = "has-key"
      console.log(body)
      this.setState(body)
    }
  }
  
  async submitModelTrainForm(values) {
    console.log("SUBMIT", this, values)
    
    const res = await fetch(baseUrl+'/train', {
      method: "POST", 
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": "Bearer " + getToken(),
      },
    })

    const body = await res.json()
    console.log('server res', body)
    this.setState({
      route: "has-model",
      buckets: body
    })
  }
  
  async submitUploadForm(e, values) {
    e.preventDefault()
    
    const res = await fetch('/classify', {
      method: "POST", 
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": "Bearer " + getToken(),
      },
    })

    const body = await res.json()
  }

  // if this gets any bigger, plug cra router in
  route() {
    // validate token here
    switch (this.state.route) {
      case "bad-submit":
        return (
          <div className="bad-response">
            <h2>Sorry!</h2>
            <p className="lead">Something went wrong with your request. Please try again later</p>
          </div>
        )
        break
      case "submit-sent":
        return (
          <div className="submit-sent">
            <h2>Thank you!</h2>
            <p className="lead">Please check your email for your login link.</p>
          </div>
        )
        break
      case "has-key":
        return <TrainModelForm
          appUses={this.state.appUses}
          trainingModel={this.state.trainingModel}
          submitModelTrainForm={this.submitModelTrainForm.bind(this)}
        />
        break
      case"has-model":
        return <UploadForm 
          buckets={this.state.buckets}
          submitUploadForm={this.submitUploadForm.bind(this)}
        />
      default:
        return (
          <LoginForm
            appUses={this.state.appUses}
            loginAction={this.loginAction.bind(this)}
          /> 
        )

    }
  }

  renderIntro() {
    return (
      <Row className="intro-header">
        <Col xs={12}>
          <h2>So much to do, so little time</h2>
          <p>How much of your time do you spend sorting things? Spreadsheets, emails, products, events, catalog items, your laundry.</p>
          <p>We can't help you with your laundry but we can help to make sense of the constant stream of information that comes across your desk. Whether you are looking for a better workflow to help categorize products, to get the right information to the right department, or to make better use of the data you collect and rely upon, we are here to help.</p>
        </Col>
      </Row>
    )
  }

  render() {
    const header = (this.state.route === "home") ? this.renderIntro() : ""
    const body = this.route()
    console.log("render",this.state)
    return (
      <div className="App">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous"/>
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Parcelize -- CSV</h1>
          <p className="lead">Dreamtigers uses machine learning to create intelligent pipelines for your data, and tells you things that you didn\'t know about your operations."</p>
        </header>
        <Grid className="main">
          {header}
          {body}
        </Grid>
      </div>
    )
  }
}

export default App
