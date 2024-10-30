import React from 'react';
import logo from './logo.svg';
import './App.css';
import GraphVisualisation from './components/GraphVisualisation';

function App() {
  return (
    <div className="App">
      {/* This is using React Flow */}
      <GraphVisualisation/>
    </div>
  );
}

export default App;
