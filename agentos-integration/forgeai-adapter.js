const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const BaseAdapter = require('./base-adapter');

/**
 * ForgeAI local AI app builder living at C:\ForgeAI.
 * Next.js dev server on port 3000, embedded in AgentOS as a native iframe tab.
 */
class ForgeAIAdapter extends BaseAdapter {
  constructor(agentConfig, db, app) {
    super(agentConfig, db, app);
    this.process = null;
  }

  get rootDir() {
    return this.config.data?.rootDir || 'C:\\ForgeAI';
  }

  get url() {
    return this.config.data?.url || 'http://localhost:3000/';
  }

  async getHealth() {
    const listening = await this.checkUrl(this.url);
    if (listening) {
      return { status: 'online', version: 'ForgeAI v0.1', message: 'ForgeAI dev server is listening on port 3000' };
    }

    const installed = fs.existsSync(path.join(this.rootDir, 'package.json'));
    const depsReady = fs.existsSync(path.join(this.rootDir, 'node_modules'));
    if (installed && depsReady) {
      return { status: 'offline', version: 'Installed', message: 'Installed locally but not running' };
    }
    if (installed) {
      return { status: 'warning', version: 'Setup required', message: 'Run npm install in ' + this.rootDir };
    }
    return { status: 'offline', message: 'ForgeAI files are missing from ' + this.rootDir };
  }

  async getOverview() {
    const health = await this.getHealth();
    return {
      status: health.status,
      version: health.version || 'ForgeAI v0.1',
      lastChecked: new Date().toLocaleTimeString(),
      recentWork: [],
      projectsCount: 0,
      memoriesCount: 0,
      logsCount: 0,
      notes: [
        'Prompt-to-app builder: describe an app, preview it live, iterate via chat, export as code.',
        'Projects are stored in the browser (localStorage), so counts are not visible server-side.',
        'AI engine is switchable in ForgeAI Settings: deterministic mock or Codex CLI (ChatGPT subscription).'
      ]
    };
  }

  async executeAction(action) {
    if (action === 'open-control' || action === 'open-native-ui') {
      const health = await this.getHealth();
      if (health.status === 'online') {
        return { success: true, ok: true, url: this.url, openMode: 'native-tab', message: 'ForgeAI is already running.' };
      }

      if (!fs.existsSync(this.rootDir)) {
        return { success: false, ok: false, message: `App folder was not found: ${this.rootDir}` };
      }
      if (!fs.existsSync(path.join(this.rootDir, 'node_modules'))) {
        return { success: false, ok: false, message: `Dependencies missing — run npm install in ${this.rootDir} first.` };
      }

      this.launchServer();
      return {
        success: true,
        ok: true,
        url: this.url,
        openMode: 'native-tab',
        message: 'Starting ForgeAI on port 3000 (first compile takes a few seconds).'
      };
    }

    if (action === 'open-folder') {
      spawn('explorer.exe', [this.rootDir], { detached: true, windowsHide: true }).unref();
      return { success: true, message: 'Opened ForgeAI folder.' };
    }

    if (action === 'open-vs-code') {
      spawn('cmd.exe', ['/c', 'code', this.rootDir], { detached: true, windowsHide: true }).unref();
      return { success: true, message: 'Opened ForgeAI in VS Code.' };
    }

    if (action === 'check-health') {
      const health = await this.getHealth();
      return { success: health.status === 'online', message: `Diagnostics result: ${health.message}` };
    }

    return super.executeAction(action);
  }

  launchServer() {
    if (this.process && !this.process.killed) {
      this.process.kill();
      this.process = null;
    }
    this.process = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev'], {
      cwd: this.rootDir,
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    });
    this.process.unref();
  }

  checkUrl(url) {
    return new Promise((resolve) => {
      const req = http.get(url, { timeout: 1500 }, (res) => {
        res.resume();
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
  }
}

module.exports = ForgeAIAdapter;
