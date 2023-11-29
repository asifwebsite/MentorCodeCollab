import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LobbyPage from './pages/LobbyPage';
import CodeBlockPage from './pages/CodeBlockPage'

const App = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact component={LobbyPage} />
        <Route path="/codeblock/:id" component={CodeBlockPage} />
      </Switch>
    </Router>
  );
};

export default App;