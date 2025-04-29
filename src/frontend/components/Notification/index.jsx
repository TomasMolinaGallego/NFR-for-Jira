import React, { useEffect } from 'react';
import { Text, SectionMessage } from '@forge/react';

const Notification = ({ type, message }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {}, type === 'error' ? 5000 : 3000);
      return () => clearTimeout(timer);
    }
  }, [message, type]);

  if (!message) return null;
  
  return (
    <SectionMessage appearance={() => type === 'error' ? "error" : "success"}>
    <Text>{message}</Text>
  </SectionMessage>
  );
};

export default Notification;