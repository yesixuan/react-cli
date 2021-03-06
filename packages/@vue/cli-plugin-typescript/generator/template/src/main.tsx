import { hot } from 'react-hot-loader/root'
import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

const Root = hot(App)

ReactDOM.render(
  <Root />,
  document.getElementById('app')
)
