import React, { useState, useEffect } from 'react';
import type { Story } from '@ladle/react';
import { SimpleAnimalComponent } from '../components/SimpleAnimalComponent';


export const ASimpleAnimal: Story = () => {
 
  return (
    <div style={{ padding: '20px', maxWidth: '1200px' }}>
      <SimpleAnimalComponent />
    </div>
  );
};

