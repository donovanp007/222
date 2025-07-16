# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
AI Medical Scribe Platform - A streamlined medical transcription platform with iOS-inspired clean interface for South African healthcare. Focus on letting doctors concentrate on patients, not paperwork.

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Architecture & Structure

### Frontend Stack
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Audio**: Web Audio API, MediaRecorder
- **AI Services**: OpenAI Whisper for transcription, Claude API for content categorization
- **State Management**: Zustand
- **Storage**: Local storage (Phase 1), database later

### Project Structure
```
src/
├── components/
│   ├── ui/              # Reusable shadcn/ui components
│   ├── dashboard/       # Dashboard-specific components
│   ├── transcription/   # Recording & transcription components
│   └── templates/       # Template management components
├── pages/               # Next.js pages
├── hooks/               # Custom React hooks
├── utils/               # Helper functions
└── styles/              # Global styles
```

## Design Philosophy

### iOS-Inspired UI Elements
- Clean white backgrounds with subtle shadows
- Card-based layouts for patients/sessions
- Smooth 300ms ease-out animations
- 8px grid system for consistent spacing
- Minimal typography (Inter/SF Pro)
- Progressive disclosure pattern

### Color System
- Primary: Medical blue (#007AFF)
- Secondary: Soft green (#34C759)
- Accent: Warm orange (#FF9500)
- Backgrounds: Pure white, light gray (#F2F2F7)
- Text: Dark gray (#1C1C1E), medium gray (#8E8E93)

## Development Phases

### Phase 1: Foundation & Core UI (Current)
**Focus**: Dashboard with patient management, NO authentication screens

**Key Components**:
- Main dashboard with patient cards grid
- Patient creation modal with smooth animations
- Floating "New Patient" button
- Patient profile screens
- Search functionality

**Week 1 Tasks**:
- Project setup (Next.js 14, TypeScript, Tailwind)
- Dashboard layout with patient grid
- Floating action button
- Search bar with animations

**Week 2 Tasks**:
- Patient creation modal
- Patient cards with swipe actions
- Patient profile screens
- Session history display

### Phase 2: Transcription Core
**Focus**: Audio recording and basic transcription

**Key Features**:
- Full-screen recording interface
- Real-time waveform visualization
- Whisper API integration
- Basic text editing

### Phase 3: Smart Templates
**Focus**: AI-powered note structuring

**Key Features**:
- Template creation interface
- Claude API integration for categorization
- Medical terminology recognition
- Smart content placement

### Phase 4: Enhanced Features
**Focus**: Professional polish and advanced functionality

**Key Features**:
- Advanced session management
- PDF export functionality
- Performance optimization
- Offline capabilities

## Core User Flows

### Primary Flow (No Login)
1. **Dashboard** → View patient cards
2. **New Patient** → Click floating button → Quick form
3. **Transcription** → Auto-opens with patient context
4. **Recording** → One-tap start with visual feedback
5. **AI Processing** → Real-time transcription
6. **Review & Save** → Edit and export

### Secondary Flow
1. **Existing Patient** → Tap patient card
2. **Patient Profile** → View history, start session
3. **Template Selection** → Choose template
4. **Transcription** → Familiar interface

## Technical Guidelines

### Component Development
- Build reusable components first
- Follow iOS design patterns
- 60fps animations mandatory
- Mobile-first responsive design
- Accessibility compliance

### Performance Standards
- Dashboard loads <2 seconds
- Smooth animations (60fps)
- Audio recording works on all modern browsers
- Transcription accuracy >90%

### Code Quality
- TypeScript strict mode
- ESLint + Prettier configuration
- Component-first architecture
- Error boundary implementation
- Graceful degradation

## Key Design Principles
1. **Less is more** - Remove unnecessary elements
2. **Consistent spacing** - 8px increment system
3. **Purposeful animation** - 300ms transitions
4. **Clear hierarchy** - Size, color, spacing for importance
5. **Immediate feedback** - Visual response to interactions

## Current Phase Focus
**Phase 1 - Week 1**: Dashboard foundation without authentication
- Clean patient cards grid
- Floating new patient button
- Smooth animations and transitions
- Patient creation modal
- Search functionality

**Next Steps**: Complete dashboard, then move to patient management before advancing to Phase 2.