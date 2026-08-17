import * as vscode from 'vscode';
import { CompareCommands } from './commands';
import { DIFF_SCHEME, DiffContentProvider } from './diffContentProvider';
import { DiffTreeProvider } from './diffTree';
import { readDefaultOptions } from './options';
import { SessionManager } from './session';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Compare JSON');
  const provider = new DiffContentProvider();
  const sessions = new SessionManager(provider, () =>
    readDefaultOptions(output),
  );
  const commands = new CompareCommands(sessions);
  const treeProvider = new DiffTreeProvider(sessions);

  context.subscriptions.push(
    output,
    vscode.workspace.registerTextDocumentContentProvider(DIFF_SCHEME, provider),
    vscode.window.registerTreeDataProvider('compare-json.diffs', treeProvider),
    vscode.commands.registerCommand(
      'compare-json.compareWith',
      (uri?: vscode.Uri) => commands.compareWith(uri),
    ),
    vscode.commands.registerCommand(
      'compare-json.selectForCompare',
      (uri?: vscode.Uri) => commands.selectForCompare(uri),
    ),
    vscode.commands.registerCommand(
      'compare-json.compareWithSelected',
      (uri?: vscode.Uri) => commands.compareWithSelected(uri),
    ),
    vscode.commands.registerCommand('compare-json.configureOptions', () =>
      commands.configureOptions(),
    ),
    vscode.commands.registerCommand('compare-json.swapSides', () =>
      sessions.swapSides(),
    ),
    vscode.commands.registerCommand('compare-json.clearResults', () =>
      sessions.clear(),
    ),
    vscode.commands.registerCommand(
      'compare-json.revealDiff',
      (pathString: string) => commands.revealDiff(pathString),
    ),
  );
}

export function deactivate(): void {}
