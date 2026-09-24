import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import chalk from 'chalk';
import { getBinDir } from '../utils/paths.js';

export interface LauncherSetupResult {
  success: boolean;
  notes: string[];
}

/**
 * Finds the global location of the 'tick' binary if installed globally.
 */
function findGlobalTickBinary(): string | null {
  try {
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'where tick' : 'which tick';
    const result = execSync(command, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (result) {
      // On Windows, 'where' might return multiple lines
      const firstLine = result.split(/\r?\n/)[0].trim();
      if (fs.existsSync(firstLine)) {
        return firstLine;
      }
    }
  } catch {
    // Not found in PATH yet
  }
  return null;
}

/**
 * Detects the user's shell configuration file (e.g., ~/.zshrc or ~/.bashrc).
 */
function getShellConfigFile(): string | null {
  const home = os.homedir();
  const shell = process.env.SHELL || '';

  if (shell.includes('zsh')) {
    const zshrc = path.join(home, '.zshrc');
    return fs.existsSync(zshrc) ? zshrc : null;
  }

  if (shell.includes('bash')) {
    const bashrc = path.join(home, '.bashrc');
    const bashProfile = path.join(home, '.bash_profile');
    if (fs.existsSync(bashrc)) return bashrc;
    if (fs.existsSync(bashProfile)) return bashProfile;
    return null;
  }

  if (shell.includes('fish')) {
    const fishConfig = path.join(home, '.config', 'fish', 'config.fish');
    return fs.existsSync(fishConfig) ? fishConfig : null;
  }

  return null;
}

/**
 * Adds an alias to the user's shell config file if not already present.
 */
function configureShellAlias(commandName: string): string | null {
  const rcFile = getShellConfigFile();
  if (!rcFile) return null;

  try {
    const content = fs.readFileSync(rcFile, 'utf-8');
    const aliasPattern = new RegExp(`^\\s*alias\\s+${commandName}=`, 'm');

    if (aliasPattern.test(content)) {
      return `Alias '${commandName}' is already defined in ${path.basename(rcFile)}.`;
    }

    const aliasLine = `\n# Tick CLI assistant alias\nalias ${commandName}="tick"\n`;
    fs.appendFileSync(rcFile, aliasLine, 'utf-8');
    return `Added alias to ~/${path.basename(rcFile)}. (Run: source ~/${path.basename(rcFile)})`;
  } catch {
    return null;
  }
}

/**
 * Sets up dynamic launcher symlink/shim and shell alias so that the assistant
 * name can be invoked directly as a terminal command.
 */
export function setupLauncher(assistantName: string): LauncherSetupResult {
  const commandName = assistantName.toLowerCase();
  const notes: string[] = [];
  const isWindows = process.platform === 'win32';

  if (commandName === 'tick') {
    return { success: true, notes: ['Base command "tick" is already configured.'] };
  }

  // 1. Try to create symlink or shim in the same global directory where 'tick' binary lives
  const tickPath = findGlobalTickBinary();
  if (tickPath) {
    const binDir = path.dirname(tickPath);
    try {
      if (isWindows) {
        const cmdShim = path.join(binDir, `${commandName}.cmd`);
        fs.writeFileSync(cmdShim, `@ECHO off\r\ntick %*\r\n`, 'utf-8');
        const ps1Shim = path.join(binDir, `${commandName}.ps1`);
        fs.writeFileSync(ps1Shim, `& tick @args\r\n`, 'utf-8');
        notes.push(`Created Windows CLI launcher in ${binDir}`);
      } else {
        const targetSymlink = path.join(binDir, commandName);
        if (fs.existsSync(targetSymlink)) {
          fs.unlinkSync(targetSymlink);
        }
        fs.symlinkSync(tickPath, targetSymlink);
        notes.push(`Linked ${commandName} -> ${tickPath}`);
      }
    } catch {
      // Permission denied or unwritable global dir; proceed to shell alias / user bin
    }
  }

  // 2. Create standalone wrapper script in ~/.Tick/bin/
  try {
    const userBinDir = getBinDir();
    if (!fs.existsSync(userBinDir)) {
      fs.mkdirSync(userBinDir, { recursive: true });
    }

    if (isWindows) {
      const userCmdShim = path.join(userBinDir, `${commandName}.cmd`);
      fs.writeFileSync(userCmdShim, `@ECHO off\r\ntick %*\r\n`, 'utf-8');
    } else {
      const userScript = path.join(userBinDir, commandName);
      const scriptContent = `#!/usr/bin/env sh\nexec tick "$@"\n`;
      fs.writeFileSync(userScript, scriptContent, { mode: 0o755 });
    }
  } catch {
    // Ignore user bin errors
  }

  // 3. Configure shell alias on Unix systems
  if (!isWindows) {
    const aliasNote = configureShellAlias(commandName);
    if (aliasNote) {
      notes.push(aliasNote);
    }
  }

  return { success: true, notes };
}
