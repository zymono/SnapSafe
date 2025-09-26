# Overview

This is a React Native mobile application built with Expo, designed as a cross-platform app that runs on iOS, Android, and web. The project appears to be named "SnapSafe" based on the Firebase configuration, suggesting it's likely a photo or document management application with security features. The app uses modern React Native development practices with TypeScript support and includes barcode scanning capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: Expo Router with file-based routing for declarative navigation structure
- **UI Components**: Custom styling system with centralized theme management
- **State Management**: React hooks and context (no external state management library detected)
- **TypeScript**: Full TypeScript support with strict mode enabled for type safety

## Mobile Platform Support
- **Cross-platform**: iOS, Android, and web support through Expo
- **New Architecture**: Enabled for React Native's new architecture features
- **Platform-specific**: Adaptive icons for Android, tablet support for iOS
- **Edge-to-edge**: Modern Android edge-to-edge display support

## Key Features
- **Barcode Scanning**: Integrated expo-barcode-scanner for QR/barcode functionality
- **Camera Integration**: Photo capture and image picking capabilities
- **Haptic Feedback**: Native haptic feedback support
- **Splash Screen**: Custom splash screen configuration
- **Deep Linking**: URL scheme support for app navigation

## Styling System
- **Centralized Theme**: Comprehensive color palette and spacing system
- **Design Tokens**: Consistent spacing, colors, and typography definitions
- **Responsive Design**: Platform-aware styling with React Native's Platform API

# External Dependencies

## Authentication & Database
- **Firebase**: Primary backend service for authentication and data storage
- **Firestore**: NoSQL database for real-time data synchronization
- **Firebase Auth**: User authentication and session management

## Development Tools
- **Expo CLI**: Development and build toolchain
- **ESLint**: Code linting with Expo-specific configuration
- **Jest**: Testing framework for unit tests
- **TypeScript**: Static type checking

## Third-party Libraries
- **Axios**: HTTP client for API requests
- **React Navigation**: Advanced navigation components (bottom tabs, stack navigation)
- **Expo Vector Icons**: Icon library for UI elements
- **React Native Gesture Handler**: Advanced gesture recognition
- **React Native Reanimated**: High-performance animations
- **React Native WebView**: Web content embedding capability

## Expo Services
- **Expo Updates**: Over-the-air update delivery
- **Expo Constants**: Access to app configuration and device info
- **Expo Image**: Optimized image component with caching
- **Expo Linear Gradient**: Gradient backgrounds and effects