import React, {Component} from 'react';
import {Row, Col} from 'react-bootstrap';

class Splash extends Component {
  render() {
    const liStyle = {textAlign: 'left', listStyle: 'none'};

    return (
      <div className="welcome" style={liStyle}>
        <Row className="intro-header" style={{textAlign: 'center'}}>
          <h2 style={{textAlign: 'center'}}>Sort CSV rows into categories</h2>
          <p className="lead">
            A simple tool for sorting csv rows based on text analysis.
          </p>
          <br />
        </Row>
        <Row />
        <Row>
          <Col sm={6}>
            <p className="lead text-center">Some uses include:</p>
            <ul>
              <li>
                <h4>
                  sort email (<strong>Urgent</strong>,{' '}
                  <strong>High-priority</strong>, <strong>Low-priority</strong>,{' '}
                  <strong>Spam</strong>)
                </h4>
              </li>
              <li>
                <h4>
                  sentiment analysis (<strong>Pro</strong>, <strong>Con</strong>
                  )
                </h4>
              </li>
              <li>
                <h4>
                  score responses (<strong>Strong</strong>,{' '}
                  <strong>Weak</strong>)
                </h4>
              </li>
              <li>
                <h4>
                  prioritize events (<strong>Attend</strong>,{' '}
                  <strong>RSVP-only</strong>, <strong>Ignore</strong>)
                </h4>
              </li>
              <li>
                <h4>
                  automate decision making (<strong>Call back</strong>,{' '}
                  <strong>Send email</strong>, <strong>Ignore</strong>)
                </h4>
              </li>
            </ul>
          </Col>
          <Col sm={6}>
            <p className="lead text-center">How it works</p>
            <ol>
              <li>
                <h4 className="instruction-step">
                  Generate csv's for each sort category you are using (ex:
                  attend, ignore)
                </h4>
              </li>
              <li>
                <h4 className="instruction-step">
                  Upload files to google docs
                </h4>
              </li>
              <li>
                <h4 className="instruction-step">
                  Provide links to the files and determine which columns to
                  consider
                </h4>
              </li>
              <li>
                <h4 className="instruction-step">
                  Run the trainer and take a look at the results
                </h4>
              </li>
              <li>
                <h4 className="instruction-step">
                  Add search terms to help refine sorting
                </h4>
              </li>
              <li>
                <h4 className="instruction-step">
                  Upload a csv of uncategorized data (make sure it has the
                  appropriate column headers)
                </h4>
              </li>
              <li>
                <h4 className="instruction-step">Download your sorted files</h4>
              </li>
            </ol>
          </Col>
        </Row>
        <Row />
        <Row className="text-center" style={{marginTop: '2em'}}>
          <button
            onClick={e => {
              e.preventDefault();
              this.props.getSignup();
            }}>
            Get started!
          </button>
        </Row>
        <Row>
          <Col>
            <ul style={{listStyle: 'none'}}>
              <li>
                <h3 className="lead">
                  <a href="#">View a demo</a>
                </h3>
              </li>
              <li>
                <h3 className="lead">
                  <a href="#">Read an article on Medium</a>
                </h3>
              </li>
            </ul>
          </Col>
        </Row>
      </div>
    );
  }
}

export default Splash;
