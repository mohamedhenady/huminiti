# Architecture Documentation 🏗️

## Overview
This project is a batch management system for a pharmacy, built with a modern decoupled architecture.

## Frontend (Next.js 14) 🖥️
The frontend is built using Next.js 14 with the App Router.

- **Directory**: `/frontend`
- **UI Framework**: React 18
- **Styling**: Tailwind CSS v4 (Mobile-first, RTL support)
- **State Management**: React Context (Auth) + Local State
- **Fonts**: Cairo (Arabic-optimized)
- **Key Features**:
  - Role-based access (Pharmacy vs. Huminiti)
  - Batch progress tracking
  - Bulk Excel import via backend API
  - Elegant Arabic RTL interface

## Backend (FastAPI) 🐍
A high-performance Python API serving as the orchestration layer between the frontend and Supabase.

- **Directory**: `/backend`
- **Logic**: FastAPI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth integration via headers
- **Excel Processing**: `openpyxl` for high-performance spreadsheet parsing

## Data Layer (Supabase) ☁️
- **Tables**:
  - `batches`: Groupings of drug distribution events.
  - `persons`: Recipients of drugs within a batch.
  - `drugs`: Master dictionary of medicines and prices.
  - `records`: Specific drug instances linked to a person and batch.
- **Security**: Row Level Security (RLS) managed in Supabase dashboard.
