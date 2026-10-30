import {createRoot} from 'react-dom/client';
import React from 'react';
import {h} from './shared.js';
import App from './App.js';
import './styles.css';

class Boundary extends React.Component{
constructor(p){super(p);this.state={e:null}}
static getDerivedStateFromError(e){return{e}}
render(){return this.state.e?h`<div style="padding:24px;font:15px/1.5 system-ui;color:#b00020;background:#fff"><b>Something went wrong.</b><pre style="white-space:pre-wrap">${String(this.state.e&&(this.state.e.stack||this.state.e))}</pre><button onClick=${()=>{try{localStorage.clear()}catch(x){}location.reload()}}>Clear saved data and reload</button></div>`:this.props.children}}

createRoot(document.getElementById('root')).render(h`<${Boundary}><${App}/><//>`);
