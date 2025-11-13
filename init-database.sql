-- JF Monitor Database Schema
-- Run this in Supabase SQL Editor: Project Dashboard → SQL Editor → New Query

-- Create enum for incident types
CREATE TYPE "IncidentType" AS ENUM ('DOWNTIME', 'CONTENT_CHANGE', 'TIMEOUT', 'ERROR');

-- Create Website table
CREATE TABLE "Website" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "checkFrequency" INTEGER NOT NULL DEFAULT 300,
    "changeThreshold" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create Check table
CREATE TABLE "Check" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "websiteId" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "isUp" BOOLEAN NOT NULL,
    "htmlHash" TEXT NOT NULL,
    "changePercent" DOUBLE PRECISION,
    "hasChange" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorMessage" TEXT,
    CONSTRAINT "Check_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create HtmlSnapshot table
CREATE TABLE "HtmlSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "websiteId" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "htmlHash" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HtmlSnapshot_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Incident table
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "websiteId" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "statusCode" INTEGER,
    "changePercent" DOUBLE PRECISION,
    "description" TEXT,
    "alertSent" BOOLEAN NOT NULL DEFAULT false,
    "alertSentAt" TIMESTAMP(3),
    "resolutionAlertSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Incident_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create AlertConfig table
CREATE TABLE "AlertConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailTo" TEXT[],
    "emailFrom" TEXT NOT NULL,
    "brevoApiKey" TEXT,
    "telegramEnabled" BOOLEAN NOT NULL DEFAULT true,
    "telegramBotToken" TEXT,
    "telegramChatId" TEXT,
    "alertOnDown" BOOLEAN NOT NULL DEFAULT true,
    "alertOnChange" BOOLEAN NOT NULL DEFAULT true,
    "alertOnRecovery" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create indexes
CREATE INDEX "Website_isActive_idx" ON "Website"("isActive");
CREATE INDEX "Check_websiteId_timestamp_idx" ON "Check"("websiteId", "timestamp");
CREATE INDEX "Check_timestamp_idx" ON "Check"("timestamp");
CREATE INDEX "HtmlSnapshot_websiteId_capturedAt_idx" ON "HtmlSnapshot"("websiteId", "capturedAt");
CREATE INDEX "Incident_websiteId_isResolved_idx" ON "Incident"("websiteId", "isResolved");
CREATE INDEX "Incident_startTime_idx" ON "Incident"("startTime");
