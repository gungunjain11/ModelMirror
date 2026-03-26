export const AUTH_SERVICE_CODE = `// Authentication Service
// Handles JWT token generation and validation

const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const SECRET_KEY = "hardcoded_secret_123"  // ← security issue

async function authenticateUser(username, password) {
  const user = db.findUser(username)  // missing await
  
  if (!user) {
    return null
  }
  
  const isValid = bcrypt.compare(password, user.passwordHash)  // missing await
  
  if (isValid) {
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      SECRET_KEY,
      { expiresIn: '24h' }
    )
    return token
  }
}

async function validateToken(token) {
  const decoded = jwt.verify(token, SECRET_KEY)
  return decoded
  // no try/catch — throws on invalid token
}

async function refreshToken(oldToken) {
  const decoded = validateToken(oldToken)  // missing await
  
  const newToken = jwt.sign(
    { userId: decoded.userId, role: decoded.role },
    SECRET_KEY,
    { expiresIn: '24h' }
  )
  return newToken
}`;

export const DATA_PROCESSOR_CODE = `# Data Processor Module
# Handles batch data transformation and validation

import pandas as pd
import numpy as np
from typing import List, Dict, Optional

class DataProcessor:
    def __init__(self, config: dict):
        self.config = config
        self.cache = {}  # unbounded cache — memory leak
    
    def process_batch(self, records: List[Dict]) -> pd.DataFrame:
        df = pd.DataFrame(records)
        
        # No null check on records
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        for col in df.columns:
            if df[col].dtype == 'object':
                df[col] = df[col].str.strip()  # fails on NaN
        
        self.cache[hash(str(records))] = df  # unhashable
        return df
    
    def validate(self, df: pd.DataFrame) -> bool:
        required = ['id', 'timestamp', 'value']
        return all(col in df.columns for col in required)`;

export const API_CLIENT_CODE = `// API Client — handles external service calls
import axios from 'axios';

interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

const client = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 5000,  // might be too low for batch ops
});

export async function fetchUsers(page: number = 1) {
  const response = await client.get(\`/users?page=\${page}\`);
  return response.data;  // no error handling
}

export async function updateUser(id: string, data: any) {  // 'any' type
  const response = await client.put(\`/users/\${id}\`, data);
  return response.data;
}

// No retry logic implemented despite config option
export async function deleteUser(id: string) {
  await client.delete(\`/users/\${id}\`);
}`;

export const UTILS_CODE = `// Utility Functions
// Common helpers used across the application

function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));  // loses functions, dates, undefined
}

function formatCurrency(amount) {
  return '$' + amount.toFixed(2);  // no locale, no null check
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);  // not crypto-safe
}

function retry(fn, attempts = 3) {
  // No delay between retries
  for (let i = 0; i < attempts; i++) {
    try {
      return fn();
    } catch (e) {
      if (i === attempts - 1) throw e;
    }
  }
}`;

export const CONFIG_PARSER_CODE = `# Configuration Parser
# Reads and validates YAML/JSON config files

import yaml
import json
import os

class ConfigParser:
    def __init__(self, path: str):
        self.path = path
        self.data = None
    
    def load(self):
        with open(self.path, 'r') as f:  # no file existence check
            if self.path.endswith('.yaml'):
                self.data = yaml.load(f)  # unsafe loader!
            elif self.path.endswith('.json'):
                self.data = json.load(f)
        return self.data
    
    def get(self, key: str, default=None):
        keys = key.split('.')
        value = self.data
        for k in keys:
            value = value[k]  # no KeyError handling
        return value or default  # falsy vs None bug
    
    def validate_schema(self, schema: dict) -> bool:
        # TODO: implement schema validation
        pass  # returns None, not False`;

export interface FileInfo {
  name: string;
  language: string;
  code: string;
  status: 'error' | 'warning';
  errorLines: number[];
  errorMessages: Record<number, string>;
}

export const FILES: FileInfo[] = [
  {
    name: 'auth_service.js',
    language: 'JavaScript',
    code: AUTH_SERVICE_CODE,
    status: 'error',
    errorLines: [7, 10, 17, 31, 36],
    errorMessages: {
      7: 'Security: Hardcoded secret key — use environment variables',
      10: 'Missing await — db.findUser() returns a Promise, not a value',
      17: 'Missing await — bcrypt.compare() returns a Promise, isValid is always truthy',
      31: 'No try/catch — jwt.verify() throws on invalid tokens',
      36: 'Missing await — validateToken() is async',
    },
  },
  {
    name: 'data_processor.py',
    language: 'Python',
    code: DATA_PROCESSOR_CODE,
    status: 'error',
    errorLines: [11, 25, 27],
    errorMessages: {
      11: 'Unbounded cache dict will grow forever — memory leak',
      25: '.str.strip() will throw on NaN values in column',
      27: 'Lists are unhashable — hash(str(records)) is fragile',
    },
  },
  {
    name: 'api_client.ts',
    language: 'TypeScript',
    code: API_CLIENT_CODE,
    status: 'warning',
    errorLines: [14, 22],
    errorMessages: {
      14: 'Timeout of 5000ms may be too low for batch operations',
      22: "Using 'any' type defeats TypeScript's type safety",
    },
  },
  {
    name: 'utils.js',
    language: 'JavaScript',
    code: UTILS_CODE,
    status: 'warning',
    errorLines: [12, 16, 20],
    errorMessages: {
      12: 'JSON.parse(JSON.stringify()) loses functions, Dates, undefined, and circular refs',
      16: 'No null check — amount.toFixed(2) throws on null/undefined',
      20: 'Math.random() is not cryptographically secure — use crypto.randomUUID()',
    },
  },
  {
    name: 'config_parser.py',
    language: 'Python',
    code: CONFIG_PARSER_CODE,
    status: 'error',
    errorLines: [14, 22, 27],
    errorMessages: {
      14: 'yaml.load() without Loader is unsafe — use yaml.safe_load()',
      22: 'No KeyError handling — accessing missing nested keys will crash',
      27: 'Returns None instead of False — callers checking bool will get wrong result',
    },
  },
];

export const MOCK_SUGGESTIONS = [
  {
    id: 'sug-1',
    type: 'Fix' as const,
    confidence: 94,
    title: 'Add await before db.findUser()',
    explanation: 'db.findUser() is async but called without await — user will always be a Promise object, never null, so the null check will never trigger.',
    code: 'const user = await db.findUser(username)',
    targetLine: 10,
    borderColor: 'accent',
  },
  {
    id: 'sug-2',
    type: 'Fix' as const,
    confidence: 87,
    title: 'Add await to bcrypt.compare()',
    explanation: 'bcrypt.compare() returns a Promise. Without await, isValid is always truthy — every password attempt will succeed.',
    code: 'const isValid = await bcrypt.compare(password, user.passwordHash)',
    targetLine: 17,
    borderColor: 'accent',
  },
  {
    id: 'sug-3',
    type: 'Security' as const,
    confidence: 79,
    title: 'Move SECRET_KEY to environment variable',
    explanation: 'Hardcoded secrets in source code are a critical security vulnerability. Use process.env.JWT_SECRET instead.',
    code: 'const SECRET_KEY = process.env.JWT_SECRET',
    targetLine: 7,
    borderColor: 'amber',
  },
];

export const MOCK_CHAT_MESSAGES = [
  { role: 'user' as const, content: 'Why is the token validation function dangerous?' },
  {
    role: 'ai' as const,
    content: 'The `validateToken` function calls `jwt.verify()` without a try/catch block. If the token is expired, malformed, or signed with a different key, `jwt.verify()` throws an error that propagates uncaught — crashing whatever called it. In production, this means a single bad token can take down your auth middleware. Wrap it in try/catch and return null on failure.',
  },
  { role: 'user' as const, content: 'How do I add rate limiting to this?' },
];

export const MOCK_CHAT_AI_RESPONSE = `The simplest approach is the \`express-rate-limit\` package. Add it as middleware before your auth route:

\`\`\`javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts
  message: 'Too many login attempts, try again later'
});

app.use('/api/auth', authLimiter);
\`\`\`

This prevents brute-force attacks by limiting how many times a client can attempt authentication within a time window.`;

export const MOCK_TESTS = `describe('authenticateUser', () => {
  test('returns null for unknown user', async () => {
    db.findUser.mockResolvedValue(null)
    const result = await authenticateUser('unknown', 'pass')
    expect(result).toBeNull()
  })

  test('returns token for valid credentials', async () => {
    db.findUser.mockResolvedValue(mockUser)
    bcrypt.compare.mockResolvedValue(true)
    const token = await authenticateUser('alice', 'correct')
    expect(token).toBeDefined()
  })

  test('returns undefined for wrong password', async () => {
    db.findUser.mockResolvedValue(mockUser)
    bcrypt.compare.mockResolvedValue(false)
    const result = await authenticateUser('alice', 'wrong')
    expect(result).toBeUndefined()
  })
})`;
