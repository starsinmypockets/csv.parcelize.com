import React, {Component} from 'react';
import {Row, Col} from 'react-bootstrap';

class FAQ extends Component {
  render() {
    return (
      <div id="FAQ-page">
        <h1>FAQ</h1>
        <Row>
          <h2>What does it do?</h2>
          The parcelize csv tool uses a simple probablistic machine learning
          model (
          <a href="https://en.wikipedia.org/wiki/Naive_Bayes_classifier">
            Naive Bayes
          </a>
          ) to sort mail into categories or "buckets" based on training data.
          Additionally, after the model is trained, you can assign terms to each
          of your selected "buckets". For instance, you might want to sort film
          reviews by genre, but you consider Star Wars to be fantasy, and not
          science fiction. So, add the term "Star Wars" to the fantasy bucket to
          make sure it is properly classified.
        </Row>
        <Row>
          <h2>What is a "model"?</h2>
          <p>
            When we refer to a "model" we are talking about a machine learning
            model. Given training data, the classifier will create a model of
            the data based on word frequency (excluding common words and most
            proper nouns - "stop words"). This model will be stored and used to
            classify your data
          </p>
        </Row>
        <Row>
          <h2>What is "training data"?</h2>
          <p>
            Training data includes samples of pre-categorized data. To use the
            classifier you need training data. Each category of data should be
            in its own CSV file. If we want to categorize rows based on movie
            genre, we should have a file entitled 'fantasy' and one entitled
            "documentary" (etc). Each file should have the same relevant
            headings. For instance, if we are going to evaluate a "review" and
            "excerpt" field, each of our training file should have these fields.
          </p>
        </Row>
        <Row>
          <h2>Does it....</h2>
          <p>
            This is an{' '}
            <a href="https://en.wikipedia.org/wiki/Software_release_life_cycle#Alpha">
              alpha release
            </a>
            . There is more to come and we want to hear from you. See a feature
            that you would like to use? Want to integrate different data sources
            or different methodologies? Drop us a line and let's talk:{' '}
            <a href="mailto:admin@parcelize.com">admin@parcelize.com</a>.
          </p>
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
                  <a href="https://medium.com/@starsinmypockets/machine-learning-and-activism-549e0c853cd6">Read an article on Medium</a>
                </h3>
              </li>
            </ul>
          </Col>
        </Row>
      </div>
    );
  }
}

export default FAQ;
