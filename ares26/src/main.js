import {createRoot} from 'react-dom/client';
import React from 'react';
import {h} from './shared.js';
import App from './App.js';
import './styles.css';

class Boundary extends React.Component{
constructor(p){super(p);this.state={e:null}}
static getDerivedStateFromError(e){return{e}}
render(){return this.state.e?h`<div style="padding:24px;font:15px/1.5 system-ui;color:#b00020;background:#fff"><b>Something went wrong.</b><pre style="white-space:pre-wrap">${import.meta.env.DEV?String(this.state.e&&(this.state.e.stack||this.state.e)):"Please reload the page. If this keeps happening, contact official.srcsmc@gmail.com."}</pre><button onClick=${()=>{try{Object.keys(localStorage).filter(k=>k.startsWith("sb-")).forEach(k=>localStorage.removeItem(k))}catch(x){}location.reload()}}>Sign out and reload</button></div>`:this.props.children}}

createRoot(document.getElementById('root')).render(h`<${Boundary}><${App}/><//>`);
