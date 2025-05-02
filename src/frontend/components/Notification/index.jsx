import React, { useEffect } from 'react';
import { Text, SectionMessage } from '@forge/react';
/**
 * Component to display notifications to the user.
 * It can be used to display success or error messages.
 */
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