import React, { Component } from 'react'
import {Button, Nav, Navbar, NavItem, NavDropdown, MenuItem, Grid, Row, Col, ListGroup, ListGroupItem, FormGroup, ControlLabel, FormControl, Form, HelpBlock} from 'react-bootstrap'

class TextArrayInput extends Component {
  constructor(props, context) {
    super(props, context)
    this.state = {
      values: this.props.values || []
    }
  }

  createUI(){
     return this.state.values.map((el, i) => 
        <FormGroup>
    	    <FormControl type="text" value={el||''} onChange={this.handleChange.bind(this, i)} />
    	    <Button value='remove' onClick={this.removeClick.bind(this, i)}>(-)</Button>
        </FormGroup>
     )
  }

  handleChange(i, event) {
     let values = [...this.state.values];
     values[i] = event.target.value;
     this.setState({ values });
  }
  
  addClick(){
    this.setState(prevState => ({ values: [...prevState.values, '']}))
  }
  
  removeClick(i){
     let values = [...this.state.values];
     values.splice(i,1);
     this.setState({ values });
  }

  render() {
    return (
    <div>
    <ControlLabel>{this.props.label}</ControlLabel>
    <Form className="text-array-input" inline>
      {this.createUI()}        
      <Button onClick={this.addClick.bind(this)}>Add more</Button>
    </Form>
    </div>
    )
  }
}

export default TextArrayInput
