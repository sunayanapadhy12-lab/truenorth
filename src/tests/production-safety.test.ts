import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { GET as handleHealth } from '../app/api/health/route';

describe('Production Safety & Deployment Verification', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('1. /api/health Endpoint', () => {
    it('returns valid health shape with persistence and ai status', async () => {
      const response = await handleHealth();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('persistence');
      expect(data).toHaveProperty('ai');
      expect(['supabase', 'mock']).toContain(data.persistence);
      expect(['enabled', 'disabled']).toContain(data.ai);
    });

    it('reports mock persistence when Supabase credentials are unset or placeholder', async () => {
      // In default test environment without Supabase URL
      const response = await handleHealth();
      const data = await response.json();
      expect(data.persistence).toBe('mock');
    });

    it('reports ai as disabled if GEMINI_API_KEY is not set or placeholder', async () => {
      delete process.env.GEMINI_API_KEY;
      const response = await handleHealth();
      const data = await response.json();
      expect(data.ai).toBe('disabled');
    });

    it('reports ai as enabled when GEMINI_API_KEY is configured', async () => {
      process.env.GEMINI_API_KEY = 'AIzaSyRealValidKeySimulation';
      const response = await handleHealth();
      const data = await response.json();
      expect(data.ai).toBe('enabled');
    });
  });

  describe('2. Secret Key Leakage & Client Component Isolation', () => {
    const srcDir = path.resolve(__dirname, '..');

    function getAllFiles(dir: string, extension: string): string[] {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(getAllFiles(fullPath, extension));
        } else if (file.endsWith(extension)) {
          results.push(fullPath);
        }
      });
      return results;
    }

    it('ensures neither SUPABASE_SERVICE_ROLE_KEY nor GEMINI_API_KEY are prefixed with NEXT_PUBLIC_', () => {
      const envExamplePath = path.resolve(__dirname, '../../.env.example');
      const envContent = fs.existsSync(envExamplePath) ? fs.readFileSync(envExamplePath, 'utf-8') : '';

      expect(envContent).not.toContain('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
      expect(envContent).not.toContain('NEXT_PUBLIC_GEMINI_API_KEY');
      expect(process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
      expect(process.env.NEXT_PUBLIC_GEMINI_API_KEY).toBeUndefined();
    });

    it('ensures no client components import or read server-only secrets', () => {
      const tsxFiles = getAllFiles(path.join(srcDir, 'components'), '.tsx');
      const appTsxFiles = getAllFiles(path.join(srcDir, 'app'), '.tsx');
      const allComponentFiles = [...tsxFiles, ...appTsxFiles];

      const clientFiles = allComponentFiles.filter((filePath) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.includes("'use client'") || content.includes('"use client"');
      });

      expect(clientFiles.length).toBeGreaterThan(0);

      clientFiles.forEach((filePath) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileName = path.basename(filePath);

        expect(
          content.includes('process.env.SUPABASE_SERVICE_ROLE_KEY'),
          `Client file ${fileName} must not read process.env.SUPABASE_SERVICE_ROLE_KEY`
        ).toBe(false);

        expect(
          content.includes('process.env.GEMINI_API_KEY'),
          `Client file ${fileName} must not read process.env.GEMINI_API_KEY`
        ).toBe(false);

        expect(
          content.includes('@/lib/supabase/server'),
          `Client file ${fileName} must not import server-only Supabase client`
        ).toBe(false);

        expect(
          content.includes('@/lib/engine/llm-judge'),
          `Client file ${fileName} must not import server-only LLM judge`
        ).toBe(false);
      });
    });
  });
});
