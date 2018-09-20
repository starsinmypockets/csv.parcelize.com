import React, { Component } from 'react'
import {Button, Nav, Navbar, NavItem, NavDropdown, MenuItem, Grid, Row, Col, ListGroup, ListGroupItem, FormGroup, ControlLabel, FormControl, HelpBlock} from 'react-bootstrap'
import Loader from 'react-loader'
import logo from './logo.svg'
import './App.css'
import LoginForm from './LoginForm.js'
import TrainModelForm from './TrainModelForm.js'
import UploadForm from './UploadForm.js'
import {getToken} from './utils.js'
import filesaver from 'file-saver'

const baseUrl = "https://beemsk0b9h.execute-api.us-east-1.amazonaws.com/dev"

class App extends Component {
  constructor(props, context) {
    super(props)
    const token = getToken()
    this.state = {
      token: token,
      route: "home",
      loaded: true
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

  async verifyTokenAction() {
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
  
  async submitModelTrainFormAction(values) {
    try {
      console.log("SUBMIT TRAINING FORM", this, values)
      
      this.setState({loaded: false})
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
          "Authorization": "Bearer " + getToken(),
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
          "Authorization": "Bearer " + getToken(),
        },
      })

      const body = await res.json()
      const linksArray = body.map(async link => {
        console.log(link)
        const blob = await this.downloadBucket(link)
        const name = link.key.split('.')[0].split('_').slice(-1)[0]

        return <a href={"data:text/csv;charset=utf8,"+encodeURIComponent(blob)} download={name+".csv"}>DOWNLOAD {name} CSV</a>
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
      const res = await fetch(baseUrl+'/dl-bucket', {
        method: "POST", 
        body: JSON.stringify(opts),
        responseType: 'application/octet-stream',
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": "Bearer " + getToken(),
        },
      })

      return await res.blob()
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
      case "submit-sent":
        return <div className="submit-sent">
            <h2>Thank you!</h2>
            <p className="lead">Please check your email for your login link.</p>
          </div>
        break
      case "has-key":
        return <TrainModelForm
          appUses={this.state.appUses}
          trainingModel={this.state.trainingModel}
          submitModelTrainForm={this.submitModelTrainFormAction.bind(this)}
        />
        break
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
            <ul>
              {this.state.dlLinks}
            </ul>
          </div>
        )
        break
      case "has-error":
        return <div id="app-error">
          <p>{JSON.stringify(this.state.error)}</p>
        </div>
        break
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
    console.log("render",this.state)
    const header = (this.state.route === "home") ? this.renderIntro() : ""
    const body = this.route()
    return (
      <div className="App">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous"/>
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Parcelize -- CSV</h1>
          <p className="lead">Dreamtigers uses machine learning to create intelligent pipelines for your data, and tells you things that you didn\'t know about your operations."</p>
        </header>
        <Loader loaded={this.state.loaded}>
          <Grid className="main">
            {header}
            {body}
          </Grid>
        </Loader>
      </div>
    )
  }
}

export default App
