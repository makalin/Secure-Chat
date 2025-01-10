// client/src/utils/encryption.js
import { X25519, AES_GCM } from '@stablelib/x25519';
import { randomBytes } from 'crypto';

class E2EEncryption {
  constructor() {
    this.keyPair = null;
    this.sharedSecrets = new Map();
  }

  // Generate key pair for the user
  async generateKeyPair() {
    this.keyPair = await X25519.generateKeyPair();
    return this.keyPair.publicKey;
  }

  // Establish shared secret with another user
  async establishSharedSecret(otherPublicKey, userId) {
    const sharedSecret = await X25519.sharedSecret(
      this.keyPair.privateKey,
      otherPublicKey
    );
    this.sharedSecrets.set(userId, sharedSecret);
    return sharedSecret;
  }

  // Encrypt message
  async encryptMessage(message, recipientId) {
    const sharedSecret = this.sharedSecrets.get(recipientId);
    if (!sharedSecret) throw new Error('No shared secret established');

    const iv = randomBytes(12);
    const encoder = new TextEncoder();
    const messageData = encoder.encode(JSON.stringify({
      content: message,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hour expiry
    }));

    const encrypted = await AES_GCM.encrypt(messageData, sharedSecret, iv);
    return {
      encrypted: Buffer.from(encrypted).toString('base64'),
      iv: Buffer.from(iv).toString('base64')
    };
  }

  // Decrypt message
  async decryptMessage(encryptedData, senderId) {
    const sharedSecret = this.sharedSecrets.get(senderId);
    if (!sharedSecret) throw new Error('No shared secret established');

    const encrypted = Buffer.from(encryptedData.encrypted, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');

    const decrypted = await AES_GCM.decrypt(encrypted, sharedSecret, iv);
    const decoder = new TextDecoder();
    const messageData = JSON.parse(decoder.decode(decrypted));

    // Check if message has expired
    if (messageData.expiresAt < Date.now()) {
      throw new Error('Message has expired');
    }

    return messageData;
  }
}

// client/src/features/SecureChat.js
import React, { useEffect, useState } from 'react';
import { E2EEncryption } from '../utils/encryption';
import { registerServiceWorker } from '../utils/pushNotifications';

const encryption = new E2EEncryption();

export const useSecureChat = () => {
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    // Initialize encryption
    const initEncryption = async () => {
      const publicKey = await encryption.generateKeyPair();
      // Send public key to server
      await fetch('/api/keys', {
        method: 'POST',
        body: JSON.stringify({ publicKey })
      });
    };

    // Initialize push notifications
    const initPushNotifications = async () => {
      const registration = await registerServiceWorker();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VAPID_PUBLIC_KEY
      });
      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription)
      });
    };

    // Screenshot detection
    const detectScreenshot = () => {
      document.addEventListener('keydown', (e) => {
        if (
          (e.key === 'PrintScreen') ||
          (e.ctrlKey && e.key === 'p') ||
          (e.metaKey && e.shiftKey && e.key === '4')
        ) {
          handleScreenshotAttempt();
        }
      });
    };

    initEncryption();
    initPushNotifications();
    detectScreenshot();
  }, []);

  const handleScreenshotAttempt = () => {
    // Log attempt and notify other party
    console.warn('Screenshot attempt detected');
    // You could also blur the UI, show a warning, etc.
  };

  const sendMessage = async (content, recipientId) => {
    try {
      const encryptedData = await encryption.encryptMessage(content, recipientId);
      
      // Send to server
      await fetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          recipientId,
          encryptedData,
          expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        })
      });

    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return {
    messages,
    sendMessage
  };
};

// server/pushNotifications.js
import webpush from 'web-push';

export const sendPushNotification = async (subscription, message) => {
  const payload = JSON.stringify({
    title: 'New Message',
    body: 'You have received a new encrypted message'
  });

  try {
    await webpush.sendNotification(subscription, payload);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

// service-worker.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icon.png',
    badge: '/badge.png',
    data: {
      messageId: data.messageId
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
