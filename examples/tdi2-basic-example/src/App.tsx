import React from 'react';
import { UserProfile } from './components/UserProfile';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>TDI2 Basic Example</h1>
      <p>This example demonstrates basic dependency injection with automatic interface resolution.</p>
      
      <UserProfile userId="123" />
      <UserProfile userId="456" />
    </div>
  );
}

export default App;